import Link from 'next/link'
import type { SessionInfo } from '@/lib/sessions'

export type SessionStatus = 'locked' | 'active' | 'submitted'

export function SessionCard({
  session,
  status,
}: {
  session: SessionInfo
  status: SessionStatus
}) {
  const isLocked = status === 'locked'
  const isSubmitted = status === 'submitted'
  const isActive = status === 'active'

  const borderColor = isSubmitted
    ? 'border-yellow/60'
    : isActive
      ? 'border-blue/60'
      : 'border-white/10'

  const bgColor = isSubmitted
    ? 'bg-yellow/[0.04]'
    : isActive
      ? 'bg-blue/[0.04]'
      : 'bg-dark/30'

  const inner = (
    <div
      className={`relative h-full rounded-lg border ${borderColor} ${bgColor} p-5 transition hover:border-white/30 ${
        isLocked ? 'opacity-50' : ''
      }`}
    >
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {isSubmitted && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow/20 text-yellow font-sans text-[9px] font-bold uppercase tracking-wider">
            ✓ Done
          </span>
        )}
        {isActive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue/20 text-blue font-sans text-[9px] font-bold uppercase tracking-wider">
            Active
          </span>
        )}
        {isLocked && (
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
    </div>
  )

  if (isLocked) return <div>{inner}</div>

  return (
    <Link href={`/session/${session.id}`} className="block h-full">
      {inner}
    </Link>
  )
}
