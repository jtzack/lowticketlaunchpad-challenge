import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { SessionCard, type SessionStatus } from '@/components/SessionCard'
import { getSessionsFromDb } from '@/lib/sessions'
import {
  computeStreak,
  computeTotalPoints,
  getTier,
  getNextTier,
  getProgressToNextTier,
  type Submission,
} from '@/lib/points'
import { CelebrateModal } from './celebrate-modal'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ celebrate?: string; awarded?: string }>
}) {
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

  const sessions = await getSessionsFromDb(supabase)

  const submissions = (submissionsData || []) as Submission[]
  const completedSet = new Set(submissions.map((s) => s.session_id))
  const totalPoints = computeTotalPoints(submissions)
  const streak = computeStreak(submissions)
  const basePoints = submissions.reduce(
    (sum, s) => sum + (s.points_awarded || 0),
    0
  )
  const streakBonus = Math.max(0, totalPoints - basePoints)
  const tier = getTier(totalPoints)
  const nextTier = getNextTier(totalPoints)
  const progress = getProgressToNextTier(totalPoints)
  const displayName: string =
    profile?.name || user.email?.split('@')[0] || 'Student'

  // Celebration modal: triggered by ?celebrate=<sessionId>&awarded=<points>
  const sp = await searchParams
  const celebrateId = sp?.celebrate ? parseInt(sp.celebrate, 10) : null
  const celebrateSession =
    celebrateId && !Number.isNaN(celebrateId)
      ? sessions.find((s) => s.id === celebrateId) ?? null
      : null
  const awardedPoints = sp?.awarded ? parseInt(sp.awarded, 10) : 100
  const showCelebrate = Boolean(
    celebrateSession && completedSet.has(celebrateSession.id)
  )

  // Determine status for each session: submitted | active | locked
  // Logic: a session is "active" if it's the lowest unsubmitted session.
  // Everything before the lowest unsubmitted is submitted, everything after is locked.
  const lowestUnsubmitted = sessions.find((s) => !completedSet.has(s.id))?.id
  const nextSession =
    sessions.find((s) => s.id === lowestUnsubmitted) ?? null
  function getStatus(sessionId: number): SessionStatus {
    if (completedSet.has(sessionId)) return 'submitted'
    if (sessionId === lowestUnsubmitted) return 'active'
    return 'locked'
  }

  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader
        active="dashboard"
        points={totalPoints}
        initials={initials}
      />

      {showCelebrate && celebrateSession && (
        <CelebrateModal
          totalPoints={totalPoints}
          streak={streak}
          pointsAwarded={Number.isNaN(awardedPoints) ? 100 : awardedPoints}
          currentTier={tier.name}
          nextTier={nextTier?.name ?? null}
          pointsToNextTier={nextTier ? nextTier.min - totalPoints : null}
          sessionNumber={celebrateSession.number}
        />
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-10 md:py-12">
        {/* Hero: name + tier sentence on the left, points + breakdown on the right */}
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="max-w-xl">
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
              Welcome Back
            </p>
            <h1 className="font-display text-[clamp(36px,5vw,56px)] text-white uppercase leading-[0.95] mb-3">
              {displayName}
            </h1>
            <p className="font-sans text-[14px] text-white/65 leading-[1.5]">
              {nextTier
                ? `You're a ${tier.name}. ${
                    nextTier.min - totalPoints
                  } more points to reach ${nextTier.name}.`
                : `You're a ${tier.name} \u2014 the top tier. Keep shipping.`}
            </p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <div className="font-display text-[clamp(48px,6vw,72px)] text-yellow leading-none">
              {totalPoints}
            </div>
            <div className="font-sans text-[11px] font-bold text-white/60 uppercase tracking-[0.18em] mt-2">
              Total Points
            </div>
            {streakBonus > 0 && (
              <div className="font-sans text-[11px] text-white/40 mt-1">
                {basePoints} earned \u00b7 +{streakBonus} streak bonus
              </div>
            )}
          </div>
        </section>

        {/* Tier progress bar */}
        {nextTier && (
          <section className="mb-8">
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
          </section>
        )}

        {/* Next-up CTA + stats, side by side so horizontal space isn't wasted */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <NextUpCard
            nextSession={nextSession}
            completed={submissions.length === sessions.length}
          />
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <StatBlock label="Submitted" value={`${submissions.length} / 6`} />
            <StatBlock label="Streak" value={`${streak}\u00d7`} />
          </div>
        </section>

        {/* Pipeline */}
        <div className="mb-10">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-4">
            Your Pipeline
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                status={getStatus(session.id)}
                dueAt={session.due_at ?? null}
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

function NextUpCard({
  nextSession,
  completed,
}: {
  nextSession: {
    id: number
    number: number
    title: string
    due_at?: string | null
  } | null
  completed: boolean
}) {
  if (completed || !nextSession) {
    return (
      <div className="md:col-span-2 rounded-lg border border-yellow/40 bg-yellow/[0.04] p-6 flex flex-col justify-center">
        <p className="font-sans text-[11px] font-bold text-yellow uppercase tracking-[0.18em] mb-2">
          All Shipped
        </p>
        <h2 className="font-display text-[clamp(22px,2.5vw,28px)] text-white uppercase leading-tight mb-2">
          You finished the challenge.
        </h2>
        <p className="font-sans text-[13px] text-white/60 leading-[1.5]">
          Six of six submitted. Claim your rewards on the rewards page or
          revisit past sessions anytime.
        </p>
      </div>
    )
  }

  const dueLabel = nextSession.due_at
    ? new Date(nextSession.due_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null

  return (
    <Link
      href={`/session/${nextSession.id}`}
      className="md:col-span-2 group rounded-lg border border-blue/40 bg-blue/[0.06] p-6 flex flex-col justify-between gap-4 hover:border-blue/70 transition"
    >
      <div>
        <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.18em] mb-2">
          Next Up · Session {nextSession.number}
        </p>
        <h2 className="font-display text-[clamp(22px,2.5vw,28px)] text-white uppercase leading-tight mb-2">
          {nextSession.title}
        </h2>
        <p className="font-sans text-[13px] text-white/60 leading-[1.5]">
          {dueLabel ? `Due ${dueLabel}. ` : ''}Submit a link and a note to earn
          up to 100 points.
        </p>
      </div>
      <span className="self-start inline-flex items-center gap-2 font-sans text-[12px] font-bold text-blue uppercase tracking-[0.1em] group-hover:text-yellow transition">
        Go to session →
      </span>
    </Link>
  )
}
