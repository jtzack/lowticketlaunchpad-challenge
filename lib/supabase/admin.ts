import { createClient as createSbClient } from '@supabase/supabase-js'

// Service-role client for trusted server-side admin writes. Bypasses RLS, so
// only call this from code paths that have already verified the caller is an
// admin (see `isAdmin` in app/admin/*).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin mutations. Add it to .env.local.'
    )
  }

  return createSbClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
