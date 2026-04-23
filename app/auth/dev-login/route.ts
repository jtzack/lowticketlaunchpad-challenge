import { NextResponse, type NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

// Admin login shortcut. Visit /auth/dev-login?token=$DEV_ADMIN_LOGIN_TOKEN
// to drop into a session as the first email listed in ADMIN_EMAILS (override
// with &email=... if you need a specific one). Opt-in via the
// ENABLE_DEV_ADMIN_LOGIN env var so the route 404s unless you explicitly
// turn it on — remove the var and redeploy to disable.

function notFound() {
  return new NextResponse('Not found', { status: 404 })
}

function tokensMatch(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export async function GET(req: NextRequest) {
  if (process.env.ENABLE_DEV_ADMIN_LOGIN !== 'true') return notFound()

  const expected = process.env.DEV_ADMIN_LOGIN_TOKEN
  const provided = req.nextUrl.searchParams.get('token')
  if (!expected || !provided || !tokensMatch(expected, provided)) {
    return notFound()
  }

  const requestedEmail = req.nextUrl.searchParams.get('email')?.toLowerCase()
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  const email = requestedEmail
    ? adminEmails.find((e) => e.toLowerCase() === requestedEmail)
    : adminEmails[0]

  if (!email || !isAdmin(email)) {
    return new NextResponse(
      'No admin email configured. Set ADMIN_EMAILS in .env.local.',
      { status: 500 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    return new NextResponse(
      `Failed to generate link: ${error?.message ?? 'no token returned'}`,
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: hashedToken,
    type: 'magiclink',
  })
  if (verifyError) {
    return new NextResponse(`Failed to verify: ${verifyError.message}`, {
      status: 500,
    })
  }

  return NextResponse.redirect(new URL('/admin', req.url))
}
