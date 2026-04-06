import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { SessionCard, type SessionStatus } from '@/components/SessionCard'
import { TierBadge } from '@/components/TierBadge'
import { SESSIONS } from '@/lib/sessions'
import {
  computeStreak,
  computeTotalPoints,
  getTier,
  getNextTier,
  getProgressToNextTier,
  type Submission,
} from '@/lib/points'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch profile + submissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: submissionsData } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('session_id', { ascending: true })

  const submissions = (submissionsData || []) as Submission[]
  const completedSet = new Set(submissions.map((s) => s.session_id))
  const totalPoints = computeTotalPoints(submissions)
  const streak = computeStreak(submissions)
  const tier = getTier(totalPoints)
  const nextTier = getNextTier(totalPoints)
  const progress = getProgressToNextTier(totalPoints)
  const displayName = profile?.name || user.email?.split('@')[0] || 'Student'

  // Determine status for each session: submitted | active | locked
  // Logic: a session is "active" if it's the lowest unsubmitted session.
  // Everything before the lowest unsubmitted is submitted, everything after is locked.
  const lowestUnsubmitted = SESSIONS.find((s) => !completedSet.has(s.id))?.id
  function getStatus(sessionId: number): SessionStatus {
    if (completedSet.has(sessionId)) return 'submitted'
    if (sessionId === lowestUnsubmitted) return 'active'
    return 'locked'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
              Welcome Back
            </p>
            <h1 className="font-display text-[clamp(36px,5vw,56px)] text-white uppercase leading-[0.95]">
              {displayName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <TierBadge points={totalPoints} />
            <div className="text-right">
              <div className="font-display text-[36px] text-yellow leading-none">
                {totalPoints}
              </div>
              <div className="font-sans text-[10px] text-white/40 uppercase tracking-wider mt-1">
                Total Points
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <StatBlock label="Submitted" value={`${submissions.length} / 6`} />
          <StatBlock label="Streak" value={`${streak}\u00d7`} />
          <StatBlock label="Current Tier" value={tier.name} />
          <StatBlock
            label={nextTier ? `To ${nextTier.name}` : 'Maxed Out'}
            value={nextTier ? `${nextTier.min - totalPoints} pts` : '\u2728'}
          />
        </div>

        {/* Tier progress bar */}
        {nextTier && (
          <div className="mb-12">
            <div className="flex justify-between text-[11px] font-sans uppercase tracking-wider mb-2">
              <span className="text-white/40">{tier.name}</span>
              <span className="text-white/40">{nextTier.name}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-sans text-[12px] text-white/50 mt-2">
              {nextTier.min - totalPoints} more points to unlock:{' '}
              <span className="text-yellow">{nextTier.unlock}</span>
            </p>
          </div>
        )}

        {/* Pipeline */}
        <div className="mb-10">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-4">
            Your Pipeline
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SESSIONS.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                status={getStatus(session.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="font-sans text-[12px] text-white/30">
          &copy; 2026 Low-Ticket Launchpad. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 rounded-lg p-5 bg-dark/30">
      <div className="font-display text-[clamp(24px,3vw,36px)] text-white leading-none">
        {value}
      </div>
      <div className="font-sans text-[10px] text-white/40 uppercase tracking-wider mt-2">
        {label}
      </div>
    </div>
  )
}
