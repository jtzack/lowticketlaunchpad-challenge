'use client'

import { useState, useTransition } from 'react'
import { toggleFeature } from './actions'

export function FeatureToggle({
  submissionId,
  initial,
}: {
  submissionId: string
  initial: boolean
}) {
  const [featured, setFeatured] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    const next = !featured
    setFeatured(next)
    setError(null)
    startTransition(async () => {
      const res = await toggleFeature(submissionId, next)
      if (!res.ok) {
        // Revert on failure
        setFeatured(!next)
        setError(res.error)
      }
    })
  }

  const base =
    'px-3 py-2 rounded-md font-sans text-[11px] font-bold uppercase tracking-[0.1em] transition disabled:opacity-50'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`${base} ${
          featured
            ? 'bg-yellow text-black hover:bg-yellow/90'
            : 'bg-transparent border border-white/20 text-white/60 hover:text-yellow hover:border-yellow/40'
        }`}
      >
        {featured ? '★ Featured' : '☆ Feature'}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  )
}
