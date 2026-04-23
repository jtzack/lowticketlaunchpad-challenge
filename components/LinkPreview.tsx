'use client'

import { useEffect, useRef, useState } from 'react'

type PreviewData = {
  ok: true
  url: string
  hostname: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

type PreviewResponse = PreviewData | { ok: false; error: string }

// Simple module-level cache so multiple cards on the same page referencing
// the same URL only fetch it once per session.
const cache = new Map<string, Promise<PreviewResponse>>()

function fetchPreview(url: string): Promise<PreviewResponse> {
  const cached = cache.get(url)
  if (cached) return cached
  const p = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
    .then((r) => r.json() as Promise<PreviewResponse>)
    .catch((): PreviewResponse => ({ ok: false, error: 'network' }))
  cache.set(url, p)
  return p
}

export function LinkPreview({
  url,
  compact = false,
}: {
  url: string
  compact?: boolean
}) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const imgFailedRef = useRef(false)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    imgFailedRef.current = false
    setImgFailed(false)
    fetchPreview(url).then((res) => {
      if (cancelled) return
      if (res.ok && (res.title || res.description || res.image)) {
        setData(res)
      } else {
        setFailed(true)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-[14px] text-blue hover:text-yellow underline break-all"
      >
        {url}
      </a>
    )
  }

  if (loading || !data) {
    return (
      <div
        className={`border border-white/10 rounded-lg bg-dark/40 overflow-hidden animate-pulse ${
          compact ? '' : ''
        }`}
      >
        {!compact && <div className="aspect-[16/9] bg-white/[0.03]" />}
        <div className="p-3 space-y-2">
          <div className="h-2.5 w-20 bg-white/[0.06] rounded" />
          <div className="h-3 w-5/6 bg-white/[0.08] rounded" />
          <div className="h-2.5 w-4/6 bg-white/[0.05] rounded" />
        </div>
      </div>
    )
  }

  const showImage = data.image && !imgFailed && !compact

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-white/15 rounded-lg bg-dark/40 overflow-hidden hover:border-white/30 transition group"
    >
      {showImage && (
        <div className="aspect-[16/9] bg-black overflow-hidden">
          {/* Remote image from the og:image tag — rendered with a plain <img>
              so we don't have to allowlist domains in next.config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image!}
            alt=""
            loading="lazy"
            onError={() => {
              imgFailedRef.current = true
              setImgFailed(true)
            }}
            className="w-full h-full object-cover group-hover:opacity-90 transition"
          />
        </div>
      )}
      <div className={compact ? 'p-2.5' : 'p-3'}>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40 mb-1 truncate">
          {data.siteName || data.hostname}
        </div>
        {data.title && (
          <div
            className={`font-sans text-white font-semibold group-hover:text-yellow transition line-clamp-2 ${
              compact ? 'text-[12px]' : 'text-[13px]'
            }`}
          >
            {data.title}
          </div>
        )}
        {data.description && !compact && (
          <div className="font-sans text-[12px] text-white/55 line-clamp-2 mt-1 leading-snug">
            {data.description}
          </div>
        )}
      </div>
    </a>
  )
}
