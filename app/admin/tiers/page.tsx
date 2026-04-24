import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { TIERS, getTiersFromDb } from '@/lib/points'
import { AdminHeader } from '../admin-header'
import { TiersForm, type TierEdit } from './tiers-form'

export const dynamic = 'force-dynamic'

export default async function AdminTiersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) redirect('/')

  const tiers = await getTiersFromDb(supabase)
  const rows: TierEdit[] = TIERS.map((t, i) => ({
    rank: i + 1,
    name: tiers[i]?.name ?? t.name,
    min: t.min,
  }))

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AdminHeader tab="tiers" adminEmail={user.email || 'admin'} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-8 py-10">
        <div className="mb-7">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
            Tier names
          </p>
          <h1 className="font-display text-[clamp(36px,5vw,48px)] text-white uppercase leading-[0.95]">
            Rename the ladder.
          </h1>
          <p className="font-sans text-[14px] text-white/55 mt-2 max-w-[640px]">
            Customize the four tier names shown on the dashboard, leaderboard,
            and in-session badges. Point thresholds stay fixed.
          </p>
        </div>

        <TiersForm initial={rows} />
      </main>

      <footer className="border-t border-white/10 py-5 text-center">
        <p className="font-sans text-[11px] text-white/30">
          © 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
        </p>
      </footer>
    </div>
  )
}
