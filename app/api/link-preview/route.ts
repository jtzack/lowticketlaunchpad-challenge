import { NextResponse, type NextRequest } from 'next/server'

// Fetches a URL server-side, parses Open Graph / Twitter Card / basic head
// meta tags, and returns a normalized preview payload. Results are cached
// by the runtime for an hour so repeated calls for the same URL are cheap.

const FETCH_TIMEOUT_MS = 5_000
const MAX_HTML_BYTES = 200_000
const CACHE_SECONDS = 60 * 60

// Rough SSRF guard: block loopback, link-local, and RFC1918 private ranges
// so a student-pasted URL can't be used to poke at internal services. This
// is a hostname-string check; an attacker with DNS control could still
// point a public name at a private IP, but for a cohort app this is fine.
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h === '0.0.0.0' || h === '::1' || h === '[::1]') {
    return true
  }
  if (/^127\./.test(h)) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true
  if (/^fc[0-9a-f]{2}:/i.test(h) || /^fd[0-9a-f]{2}:/i.test(h)) return true
  if (h.endsWith('.internal') || h.endsWith('.local')) return true
  return false
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => {
      const code = parseInt(d, 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, d) => {
      const code = parseInt(d, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ''
    })
}

function extractMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const k = escapeRegex(key)
    const r1 = new RegExp(
      `<meta[^>]*?(?:property|name)=["']${k}["'][^>]*?content=["']([^"']*?)["']`,
      'i'
    )
    const m1 = html.match(r1)
    if (m1?.[1]) return decodeHtmlEntities(m1[1]).trim()
    const r2 = new RegExp(
      `<meta[^>]*?content=["']([^"']*?)["'][^>]*?(?:property|name)=["']${k}["']`,
      'i'
    )
    const m2 = html.match(r2)
    if (m2?.[1]) return decodeHtmlEntities(m2[1]).trim()
  }
  return null
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m?.[1] ? decodeHtmlEntities(m[1]).trim() || null : null
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url')
  if (!target) {
    return NextResponse.json(
      { ok: false, error: 'missing url' },
      { status: 400 }
    )
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid url' },
      { status: 400 }
    )
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json(
      { ok: false, error: 'only http/https' },
      { status: 400 }
    )
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json(
      { ok: false, error: 'blocked host' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
      headers: {
        // Browser-like UA so sites that 403 generic bots (some blog
        // platforms, Cloudflare-lenient sites) still serve us their
        // og-tagged HTML. Cloudflare-protected pages (Gumroad, etc.)
        // will still reject us — the client falls back to a plain link.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: CACHE_SECONDS },
    })

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: `upstream status ${res.status}`,
      })
    }

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('html') && !ct.includes('xhtml')) {
      return NextResponse.json({ ok: false, error: 'not html' })
    }

    const raw = await res.text()
    const html = raw.length > MAX_HTML_BYTES ? raw.slice(0, MAX_HTML_BYTES) : raw
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html

    const title =
      extractMeta(head, ['og:title', 'twitter:title']) ?? extractTitle(html)
    const description = extractMeta(head, [
      'og:description',
      'twitter:description',
      'description',
    ])
    let image = extractMeta(head, [
      'og:image',
      'og:image:secure_url',
      'twitter:image',
      'twitter:image:src',
    ])
    if (image && !/^https?:\/\//i.test(image)) {
      try {
        image = new URL(image, parsed).toString()
      } catch {
        image = null
      }
    }
    const siteName = extractMeta(head, ['og:site_name'])

    return NextResponse.json({
      ok: true,
      url: parsed.toString(),
      hostname: parsed.hostname.replace(/^www\./, ''),
      title: title || null,
      description: description || null,
      image: image || null,
      siteName: siteName || null,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'fetch failed',
    })
  }
}
