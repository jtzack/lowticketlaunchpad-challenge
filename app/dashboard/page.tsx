import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { SessionCard, type SessionStatus } from '@/components/SessionCard'
import { InlineNameEdit } from './inline-name-edit'
import { computeOpensAt, getSessionsFromDb } from '@/lib/sessions'
import {
  computeStreak,
  computeTotalPoints,
  getTier,
  getNextTier,
  getTiersFromDb,
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
  const tiers = await getTiersFromDb(supabase)
  const tier = getTier(totalPoints, tiers)
  const nextTier = getNextTier(totalPoints, tiers)
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
  // A session is 'active' once its unlock date (the previous session's due
  // date) has passed. Sessions whose unlock date is still in the future are
  // 'upcoming' — visible on the dashboard with an "Opens <date>" badge but
  // not submittable. Session 1 is always open.
  const now = new Date()
  const opensAtById = new Map<number, Date | null>(
    sessions.map((s) => [s.id, computeOpensAt(s.id, sessions)])
  )
  function isOpen(sessionId: number): boolean {
    const opensAt = opensAtById.get(sessionId)
    return !opensAt || now.getTime() >= opensAt.getTime()
  }
  function getStatus(sessionId: number): SessionStatus {
    if (completedSet.has(sessionId)) return 'submitted'
    if (!isOpen(sessionId)) return 'upcoming'
    return 'active'
  }
  // For the Next Up CTA: prefer the lowest open-and-unsubmitted session.
  // Falls back to the lowest unsubmitted so we can show "Opens <date>" when
  // the student is all caught up.
  const nextOpen =
    sessions.find((s) => !completedSet.has(s.id) && isOpen(s.id)) ?? null
  const nextUnsubmitted =
    sessions.find((s) => !completedSet.has(s.id)) ?? null
  const nextSession = nextOpen ?? nextUnsubmitted

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
            <InlineNameEdit
              initialName={displayName}
              needsSetup={!profile?.name}
            />
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
                {basePoints} earned · +{streakBonus} streak bonus
              </div>
            )}
          </div>
        </section>

        {/* Session progress bar with tier markers overlaid */}
        <SessionProgressBar
          sessions={sessions}
          completedSet={completedSet}
          currentTierName={tier.name}
          tierNames={tiers.map((t) => t.name)}
        />

        {/* Next-up CTA + stats, side by side so horizontal space isn't wasted */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <NextUpCard
            nextSession={nextSession}
            opensAt={
              nextSession
                ? opensAtById.get(nextSession.id)?.toISOString() ?? null
                : null
            }
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
                opensAt={
                  opensAtById.get(session.id)?.toISOString() ?? null
                }
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

// Tier checkpoints sit at the dots where a perfect-run student reaches each
// tier: second tier at session 2, third at session 4, top at session 6. Tier
// names come from DB-backed data so they update when the admin edits them.
const TIER_DOT_INDEXES = [0, 1, 3, 5]

function SessionProgressBar({
  sessions,
  completedSet,
  currentTierName,
  tierNames,
}: {
  sessions: { id: number; number: number }[]
  completedSet: Set<number>
  currentTierName: string
  tierNames: string[]
}) {
  const checkpoints = TIER_DOT_INDEXES.map((dotIndex, i) => ({
    name: tierNames[i] ?? '',
    dotIndex,
  }))
  const total = sessions.length
  if (total === 0) return null
  const completedCount = sessions.filter((s) => completedSet.has(s.id)).length
  const lastFilledIndex = completedCount - 1 // -1 if none submitted
  // Fill line reaches the last filled dot (or 0 if none submitted yet).
  const fillPercent =
    lastFilledIndex < 0 ? 0 : (lastFilledIndex / (total - 1)) * 100

  return (
    <section className="mb-10">
      {/* Tier labels */}
      <div className="relative h-5 mb-2">
        {checkpoints.map((t) => {
          const left = (t.dotIndex / (total - 1)) * 100
          const isCurrent = t.name === currentTierName
          return (
            <span
              key={t.name}
              className={`absolute -translate-x-1/2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                isCurrent ? 'text-yellow' : 'text-white/35'
              }`}
              style={{ left: `${left}%` }}
            >
              {t.name}
            </span>
          )
        })}
      </div>

      {/* Bar with dots */}
      <div className="relative h-5">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2" />
        {/* Filled line up to last submitted session */}
        <div
          className="absolute top-1/2 left-0 h-[2px] bg-yellow -translate-y-1/2 transition-all"
          style={{ width: `${fillPercent}%` }}
        />
        {/* Session dots */}
        {sessions.map((s, i) => {
          const left = (i / (total - 1)) * 100
          const isDone = completedSet.has(s.id)
          return (
            <div
              key={s.id}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%` }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 transition ${
                  isDone
                    ? 'bg-yellow border-yellow'
                    : 'bg-black border-white/25'
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* Session number labels */}
      <div className="relative h-4 mt-2">
        {sessions.map((s, i) => {
          const left = (i / (total - 1)) * 100
          return (
            <span
              key={s.id}
              className="absolute -translate-x-1/2 font-mono text-[10px] tracking-[0.12em] text-white/40"
              style={{ left: `${left}%` }}
            >
              S0{s.number}
            </span>
          )
        })}
      </div>
    </section>
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

function formatCalendarDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function NextUpCard({
  nextSession,
  opensAt,
  completed,
}: {
  nextSession: {
    id: number
    number: number
    title: string
    due_at?: string | null
  } | null
  opensAt: string | null
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

  const dueLabel = nextSession.due_at ? formatCalendarDate(nextSession.due_at) : null
  const isUpcoming =
    opensAt !== null && Date.now() < new Date(opensAt).getTime()

  // Student is caught up and the next session hasn't opened yet.
  if (isUpcoming && opensAt) {
    return (
      <div className="md:col-span-2 rounded-lg border border-white/15 bg-dark/40 p-6 flex flex-col justify-between gap-4">
        <div>
          <p className="font-sans text-[11px] font-bold text-white/55 uppercase tracking-[0.18em] mb-2">
            Next Up · Session {nextSession.number}
          </p>
          <h2 className="font-display text-[clamp(22px,2.5vw,28px)] text-white uppercase leading-tight mb-2 opacity-80">
            {nextSession.title}
          </h2>
          <p className="font-sans text-[13px] text-white/55 leading-[1.5]">
            You're caught up. Session {nextSession.number} opens{' '}
            <span className="text-yellow">{formatCalendarDate(opensAt)}</span>
            {dueLabel ? ` (due ${dueLabel})` : ''}. Come back then.
          </p>
        </div>
      </div>
    )
  }

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
