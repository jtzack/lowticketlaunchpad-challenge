'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type CelebrateModalProps = {
  totalPoints: number
  streak: number
  pointsAwarded: number
  currentTier: string
  nextTier: string | null
  pointsToNextTier: number | null
  sessionNumber: number
}

// Deterministic confetti layout — avoids rerunning RNG on every render and
// keeps SSR/CSR consistent.
const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  top: ((i * 41) % 100) + (i % 2 ? 0 : 0.5),
  left: (i * 73) % 100,
  rot: (i * 17) % 360,
  color: i % 3 === 0 ? '#F9E35D' : i % 3 === 1 ? '#87B8F8' : '#F7F5ED',
  size: i % 2 ? 7 : 10,
  round: i % 2 === 0,
}))

export function CelebrateModal({
  totalPoints,
  streak,
  pointsAwarded,
  currentTier,
  nextTier,
  pointsToNextTier,
  sessionNumber,
}: CelebrateModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(true)

  // Escape key dismiss
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cleanHref = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('celebrate')
    next.delete('awarded')
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }, [pathname, searchParams])

  function close() {
    setOpen(false)
    router.replace(cleanHref, { scroll: false })
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebrate-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close celebration"
        onClick={close}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-default"
      />

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="absolute opacity-80"
            style={{
              top: `${c.top}%`,
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: c.round ? '50%' : 0,
              transform: `rotate(${c.rot}deg)`,
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div
        className="relative w-full max-w-[520px] rounded-2xl border border-white/20 bg-[#0a0a0a] px-8 py-10 md:px-11 md:py-11 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at top, rgba(249,227,93,0.12), transparent 70%)',
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3.5 right-4 text-white/50 hover:text-white text-[20px] leading-none"
        >
          ×
        </button>

        <p className="font-sans text-[11px] font-bold text-yellow uppercase tracking-[0.18em] mb-4">
          Proof accepted · Session {String(sessionNumber).padStart(2, '0')}
        </p>

        <div
          className="font-display text-yellow leading-[0.85]"
          style={{ fontSize: 'clamp(96px, 18vw, 140px)', textShadow: '0 3px 0 rgba(0,0,0,0.4)' }}
        >
          +{pointsAwarded}
        </div>

        <h2
          id="celebrate-title"
          className="font-display text-[clamp(28px,4vw,38px)] text-white uppercase mt-1.5"
        >
          Points banked.
        </h2>

        <p className="font-sans text-[14px] text-white/60 leading-[1.55] mt-3 max-w-[380px] mx-auto">
          You&apos;re on a <span className="text-blue">{streak}× streak</span>{' '}
          and now a <span className="text-yellow">{currentTier}</span>. Keep
          shipping.
        </p>

        <p className="font-mono text-[10px] text-white/45 tracking-[0.18em] uppercase mt-5">
          <span className="text-yellow">{totalPoints}</span> TOTAL
          {nextTier && pointsToNextTier !== null && pointsToNextTier > 0 && (
            <> · {pointsToNextTier} TO {nextTier.toUpperCase()}</>
          )}
        </p>

        <div className="flex gap-2.5 mt-7">
          <Link
            href="/rewards"
            className="flex-1 bg-yellow text-black font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-lg hover:bg-yellow/90 transition text-center"
          >
            Claim reward →
          </Link>
          <button
            type="button"
            onClick={close}
            className="flex-1 border border-white/20 text-white font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-lg hover:bg-white/5 transition"
          >
            Keep going
          </button>
        </div>
      </div>
    </div>
  )
}
