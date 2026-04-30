import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { AdminHeader } from '../admin-header'
import { UserRow } from './user-row'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) redirect('/')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, name')
    .order('email', { ascending: true })

  const rows = profiles ?? []

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AdminHeader tab="users" adminEmail={user.email || 'admin'} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-8 py-10">
        <div className="mb-7">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
            Cohort roster
          </p>
          <h1 className="font-display text-[clamp(36px,5vw,48px)] text-white uppercase leading-[0.95]">
            Send a sign-in link.
          </h1>
          <p className="font-sans text-[14px] text-white/55 mt-2 max-w-[640px]">
            Use this when a student says they can&apos;t find their magic link
            email or Supabase&apos;s rate limit is blocking new sends. Click
            &ldquo;Get sign-in link&rdquo; to generate a one-time URL, copy it,
            and DM/text it to them. No email is sent.
          </p>
          <p className="font-sans text-[12px] text-yellow/80 mt-3 max-w-[640px] border-l-2 border-yellow/40 pl-3">
            Treat the link like a password. Anyone who gets it can sign in as
            that user.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="border border-white/10 rounded-xl p-12 text-center bg-dark/30">
            <p className="font-display text-[20px] text-white uppercase mb-2">
              No users yet
            </p>
            <p className="font-sans text-[13px] text-white/50">
              Once students sign up, they&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {rows.map((p) => (
              <UserRow key={p.id} email={p.email} name={p.name} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-5 text-center">
        <p className="font-sans text-[11px] text-white/30">
          © 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
        </p>
      </footer>
    </div>
  )
}
