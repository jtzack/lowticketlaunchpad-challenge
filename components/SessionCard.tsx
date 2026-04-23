import Link from 'next/link'
import type { SessionInfo } from '@/lib/sessions'

export type SessionStatus = 'locked' | 'active' | 'submitted'

const OVERDUE_GRACE_DAYS = 2
const MS_PER_DAY = 24 * 60 * 60 * 1000

function formatDueDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SessionCard({
  session,
  status,
  dueAt,
}: {
  session: SessionInfo
  status: SessionStatus
  dueAt?: string | null
}) {
  const isLocked = status === 'locked'
  const isSubmitted = status === 'submitted'
  const isActive = status === 'active'

  const dueDate = dueAt ? new Date(dueAt) : null
  const hasValidDue = dueDate && !Number.isNaN(dueDate.getTime())
  const daysPastDue = hasValidDue
    ? Math.floor((Date.now() - dueDate.getTime()) / MS_PER_DAY)
    : 0
  const isOverdue =
    !isSubmitted && hasValidDue && daysPastDue >= OVERDUE_GRACE_DAYS

  const borderColor = isSubmitted
    ? 'border-yellow/60'
    : isOverdue
      ? 'border-red-500/70'
      : isActive
        ? 'border-blue/60'
        : 'border-white/10'

  const bgColor = isSubmitted
    ? 'bg-yellow/[0.04]'
    : isOverdue
      ? 'bg-red-500/[0.06]'
      : isActive
        ? 'bg-blue/[0.04]'
        : 'bg-dark/30'

  const inner = (
    <div
      className={`relative h-full rounded-lg border ${borderColor} ${bgColor} p-5 transition hover:border-white/30 ${
        isLocked && !isOverdue ? 'opacity-50' : ''
      }`}
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {isSubmitted && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow/20 text-yellow font-sans text-[9px] font-bold uppercase tracking-wider">
            ✓ Done
          </span>
        )}
        {!isSubmitted && isOverdue && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-sans text-[9px] font-bold uppercase tracking-wider">
            Overdue
          </span>
        )}
        {!isSubmitted && !isOverdue && isActive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue/20 text-blue font-sans text-[9px] font-bold uppercase tracking-wider">
            Active
          </span>
        )}
        {!isSubmitted && !isOverdue && isLocked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-sans text-[9px] font-bold uppercase tracking-wider">
            Locked
          </span>
        )}
      </div>

      <span className="font-sans text-[10px] font-bold text-blue uppercase tracking-wider">
        Session {session.number}
      </span>
      <h3 className="font-display text-[18px] text-white uppercase mt-1 mb-2 leading-tight pr-16">
        {session.title}
      </h3>
      <p className="font-sans text-[13px] text-white/50 leading-relaxed">
        {session.description}
      </p>

      {hasValidDue && (
        <p
          className={`font-sans text-[11px] uppercase tracking-[0.14em] mt-4 ${
            isOverdue
              ? 'text-red-300'
              : isSubmitted
                ? 'text-white/30'
                : 'text-white/45'
          }`}
        >
          {isOverdue
            ? `Overdue by ${daysPastDue} day${daysPastDue === 1 ? '' : 's'} · Due ${formatDueDate(dueAt!)}`
            : `Due ${formatDueDate(dueAt!)}`}
        </p>
      )}
    </div>
  )

  if (isLocked) return <div>{inner}</div>

  return (
    <Link href={`/session/${session.id}`} className="block h-full">
      {inner}
    </Link>
  )
}
