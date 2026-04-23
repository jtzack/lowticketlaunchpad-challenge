import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SESSIONS, SESSION_TAGS } from '@/lib/sessions'
import { DEFAULT_REWARDS, type Reward } from '@/lib/rewards'
import { isAdmin } from '@/lib/admin'
import { AdminHeader } from '../admin-header'
import { RewardRow } from './reward-row'

export const dynamic = 'force-dynamic'

export default async function AdminRewardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) redirect('/')

  const [{ data: rewardsData }, { data: submissionsData }, { data: claimsData }] =
    await Promise.all([
      supabase.from('rewards').select('*').order('id', { ascending: true }),
      supabase.from('submissions').select('session_id').eq('is_public', true),
      supabase.from('reward_claims').select('reward_id'),
    ])

  const rewards: Reward[] =
    rewardsData && rewardsData.length > 0
      ? (rewardsData as Reward[])
      : DEFAULT_REWARDS

  // Unlocks-per-reward = # of submissions for its session.
  const unlocksBySession: Record<number, number> = {}
  for (const s of submissionsData || []) {
    unlocksBySession[s.session_id] = (unlocksBySession[s.session_id] || 0) + 1
  }
  const claimedByReward: Record<number, number> = {}
  for (const c of claimsData || []) {
    claimedByReward[c.reward_id] = (claimedByReward[c.reward_id] || 0) + 1
  }

  const totalLinksSet = rewards.filter((r) => r.url && r.url.trim()).length
  const totalClaimed = Object.values(claimedByReward).reduce((a, b) => a + b, 0)
  const awaitingClaim = rewards.reduce((sum, r) => {
    const unlocked = unlocksBySession[r.session_id] || 0
    const claimed = claimedByReward[r.id] || 0
    return sum + Math.max(0, unlocked - claimed)
  }, 0)

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AdminHeader tab="rewards" adminEmail={user.email || 'admin'} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-7">
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
              Session rewards
            </p>
            <h1 className="font-display text-[clamp(36px,5vw,48px)] text-white uppercase leading-[0.95]">
              Reward links.
            </h1>
            <p className="font-sans text-[14px] text-white/55 mt-2 max-w-[640px]">
              One reward per session. Edit the name and URL — students see the
              &ldquo;Claim reward&rdquo; button once they ship that session.
            </p>
          </div>
          <div className="flex gap-6">
            <Stat value={`${totalLinksSet}/${rewards.length}`} label="Links set" color="#fff" />
            <Stat value={String(totalClaimed)} label="Claimed" color="#F9E35D" />
            <Stat value={String(awaitingClaim)} label="Awaiting claim" color="#87B8F8" />
          </div>
        </div>

        <div className="grid gap-3">
          {rewards.map((r) => {
            const session = SESSIONS.find((s) => s.id === r.session_id)
            return (
              <RewardRow
                key={r.id}
                rewardId={r.id}
                sessionTag={SESSION_TAGS[r.session_id] || ''}
                sessionNumber={session?.number ?? r.session_id}
                initialTitle={r.title}
                initialDescription={r.description ?? ''}
                initialUrl={r.url}
                stats={{
                  unlocks: unlocksBySession[r.session_id] || 0,
                  claimed: claimedByReward[r.id] || 0,
                  updatedAt: r.updated_at ?? null,
                }}
              />
            )
          })}
        </div>
      </main>

      <footer className="border-t border-white/10 py-5 text-center">
        <p className="font-sans text-[11px] text-white/30">
          © 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
        </p>
      </footer>
    </div>
  )
}

function Stat({
  value,
  label,
  color,
}: {
  value: string
  label: string
  color: string
}) {
  return (
    <div>
      <div
        className="font-display leading-none"
        style={{ color, fontSize: 'clamp(32px, 4vw, 44px)' }}
      >
        {value}
      </div>
      <div className="font-sans text-[10px] text-white/40 uppercase tracking-[0.18em] mt-1.5">
        {label}
      </div>
    </div>
  )
}
