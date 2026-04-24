import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { SESSIONS, SESSION_TAGS } from '@/lib/sessions'
import {
  DEFAULT_REWARDS,
  statusFor,
  type Reward,
  type RewardStatus,
  type RewardWithStatus,
} from '@/lib/rewards'
import { computeTotalPoints, type Submission } from '@/lib/points'
import { ClaimButton } from './claim-button'

export const dynamic = 'force-dynamic'

export default async function RewardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: submissionsData }, { data: rewardsData }, { data: claimsData }, { data: profile }] =
    await Promise.all([
      supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id),
      supabase.from('rewards').select('*').order('id', { ascending: true }),
      supabase
        .from('reward_claims')
        .select('reward_id, claimed_at')
        .eq('user_id', user.id),
      supabase.from('profiles').select('name').eq('id', user.id).single(),
    ])

  const submissions = (submissionsData || []) as Submission[]
  const completedSessionIds = new Set(submissions.map((s) => s.session_id))

  // Fall back to defaults if the rewards table hasn't been seeded.
  const rewards: Reward[] =
    rewardsData && rewardsData.length > 0
      ? (rewardsData as Reward[])
      : DEFAULT_REWARDS

  const claimedMap = new Map<number, string>()
  for (const c of claimsData || []) {
    claimedMap.set(c.reward_id, c.claimed_at)
  }
  const claimedRewardIds = new Set(claimedMap.keys())

  const rewardsWithStatus: RewardWithStatus[] = rewards.map((r) => ({
    ...r,
    status: statusFor(r, completedSessionIds, claimedRewardIds),
    claimed_at: claimedMap.get(r.id) ?? null,
  }))

  const claimedN = rewardsWithStatus.filter((r) => r.status === 'claimed').length
  const unlockedN = rewardsWithStatus.filter((r) => r.status === 'unlocked').length
  const lockedN = rewardsWithStatus.filter((r) => r.status === 'locked').length
  const shippedCount = submissions.length
  const totalPoints = computeTotalPoints(submissions)
  const displayName: string =
    profile?.name || user.email?.split('@')[0] || 'Student'
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <BrandHeader active="rewards" points={totalPoints} initials={initials} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-10 md:py-12">
        {/* Header + stats */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
              Your rewards
            </p>
            <h1 className="font-display text-[clamp(44px,7vw,64px)] text-white uppercase leading-[0.95]">
              My rewards.
            </h1>
            <p className="font-sans text-[15px] text-white/55 mt-3 max-w-[540px] leading-[1.5]">
              Six rewards, one for every session you ship. Claim the links as
              you unlock them.
            </p>
          </div>
          <div className="flex gap-6 md:gap-8">
            <Stat value={claimedN} label="Claimed" color="#ffffff" />
            <Stat value={unlockedN} label="Ready" color="#F9E35D" />
            <Stat value={lockedN} label="Locked" color="#6a6a6a" />
          </div>
        </div>

        {/* Progress spine */}
        <div className="border border-white/10 rounded-xl p-6 md:px-8 mb-7 bg-[#0f0f0f]">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.18em] mb-4">
            Your progress · {shippedCount} of 6 shipped
          </p>
          <div className="relative h-[34px]">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-[2px] bg-yellow -translate-y-1/2 transition-all"
              style={{ width: `${(shippedCount / 6) * 100}%` }}
            />
            <div className="grid grid-cols-6">
              {rewardsWithStatus.map((r) => {
                const color =
                  r.status === 'claimed'
                    ? '#F9E35D'
                    : r.status === 'unlocked'
                      ? '#87B8F8'
                      : '#333333'
                const filled = r.status === 'claimed' ? '#F9E35D' : 'transparent'
                return (
                  <div
                    key={r.id}
                    className="flex justify-center relative -top-[7px]"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center font-display text-[10px] text-black"
                      style={{
                        background: filled,
                        border: `2px solid ${color}`,
                      }}
                    >
                      {r.status === 'claimed' ? '✓' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rewards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewardsWithStatus.map((r) => (
            <RewardCard key={r.id} reward={r} userId={user.id} />
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="font-sans text-[12px] text-white/30">
          &copy; 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
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
  value: number
  label: string
  color: string
}) {
  return (
    <div>
      <div
        className="font-display leading-none"
        style={{ color, fontSize: 'clamp(40px, 5vw, 52px)' }}
      >
        {value}
      </div>
      <div className="font-sans text-[10px] text-white/40 uppercase tracking-[0.18em] mt-1.5">
        {label}
      </div>
    </div>
  )
}

function RewardCard({
  reward,
  userId,
}: {
  reward: RewardWithStatus
  userId: string
}) {
  const { status } = reward
  const tag = SESSION_TAGS[reward.session_id] ?? ''
  const sessionNum = SESSIONS.find((s) => s.id === reward.session_id)?.number ?? reward.session_id

  const accent =
    status === 'unlocked' ? '#F9E35D' : status === 'claimed' ? '#87B8F8' : '#555'

  const borderClass =
    status === 'unlocked' ? 'border-yellow/40' : 'border-white/10'
  const bgClass =
    status === 'unlocked'
      ? 'bg-yellow/[0.04]'
      : 'bg-white/[0.015]'

  const claimedDate = reward.claimed_at
    ? new Date(reward.claimed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div
      className={`border ${borderClass} ${bgClass} rounded-2xl p-6 flex flex-col ${
        status === 'locked' ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center font-display text-[18px]"
            style={{
              background: `${accent}22`,
              border: `1px solid ${accent}55`,
              color: accent,
            }}
          >
            {status === 'claimed' ? '✓' : status === 'locked' ? '🔒' : '★'}
          </div>
          <div>
            <div className="font-mono text-[10px] text-white/40 uppercase tracking-[0.14em]">
              Reward {String(reward.id).padStart(2, '0')} · {tag}
            </div>
            <h3
              className={`font-display text-[19px] text-white uppercase leading-tight mt-0.5 transition ${
                status === 'locked' ? 'blur-[6px] select-none' : ''
              }`}
              aria-hidden={status === 'locked'}
            >
              {reward.title}
            </h3>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {reward.description && (
        <p
          className={`font-sans text-[13px] text-white/60 leading-[1.5] mb-4 flex-1 transition ${
            status === 'locked' ? 'blur-[5px] select-none' : ''
          }`}
          aria-hidden={status === 'locked'}
        >
          {reward.description}
        </p>
      )}

      {status === 'unlocked' && reward.url && (
        <ClaimButton rewardId={reward.id} url={reward.url} userId={userId} />
      )}

      {status === 'unlocked' && !reward.url && (
        <div className="bg-black border border-red-400/20 rounded-lg px-3 py-2.5 font-sans text-[12px] text-red-300/90">
          Admin hasn&apos;t set a link for this reward yet. Check back soon.
        </div>
      )}

      {status === 'claimed' && (
        <div className="flex items-center justify-between gap-3">
          {reward.url ? (
            <a
              href={reward.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-sans text-[12px] font-bold text-blue hover:text-yellow uppercase tracking-[0.08em]"
            >
              Open reward ↗
            </a>
          ) : (
            <span />
          )}
          {claimedDate && (
            <span className="font-mono text-[10px] text-white/40 tracking-[0.12em] uppercase whitespace-nowrap">
              CLAIMED {claimedDate.toUpperCase()}
            </span>
          )}
        </div>
      )}

      {status === 'locked' && (
        <div>
          <div className="flex justify-between font-sans text-[10px] uppercase tracking-[0.14em] text-white/40 mb-2">
            <span>Ship session {sessionNum} to unlock</span>
          </div>
          <div className="h-[5px] bg-white/5 rounded-full overflow-hidden">
            <div className="h-full" style={{ width: '0%', background: accent }} />
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: RewardStatus }) {
  if (status === 'claimed') {
    return (
      <span className="px-2 py-1 rounded-full border border-white/10 text-white/40 font-sans text-[9px] font-bold uppercase tracking-[0.12em]">
        ✓ Claimed
      </span>
    )
  }
  if (status === 'unlocked') {
    return (
      <span className="px-2 py-1 rounded-full border border-yellow/40 bg-yellow/10 text-yellow font-sans text-[9px] font-bold uppercase tracking-[0.12em]">
        Ready
      </span>
    )
  }
  return (
    <span className="px-2 py-1 rounded-full border border-white/10 text-white/40 font-sans text-[9px] font-bold uppercase tracking-[0.12em]">
      Locked
    </span>
  )
}

