'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/app/showcase/actions'

export function LikeButton({
  submissionId,
  initialLiked,
  initialCount,
  canLike,
}: {
  submissionId: string
  initialLiked: boolean
  initialCount: number
  canLike: boolean
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick(e: React.MouseEvent) {
    // The button sits inside some cards that are wrapped in Link/anchor
    // elements. Stop propagation so clicking the heart doesn't trigger the
    // parent's navigation.
    e.stopPropagation()
    e.preventDefault()
    if (!canLike || pending) return
    const next = !liked
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    setError(null)
    startTransition(async () => {
      const res = await toggleLike(submissionId)
      if (!res.ok) {
        setLiked(!next)
        setCount((c) => c + (next ? -1 : 1))
        setError(res.error)
        return
      }
      // Reconcile with server truth
      setLiked(res.liked)
      setCount(res.count)
    })
  }

  const title = canLike
    ? liked
      ? 'Unlike'
      : 'Like'
    : 'Sign in to like'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canLike || pending}
      title={title}
      aria-pressed={liked}
      aria-label={title}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border transition font-sans text-[11px] font-bold ${
        liked
          ? 'border-red-500/60 bg-red-500/10 text-red-300'
          : 'border-white/15 bg-transparent text-white/60 hover:text-red-300 hover:border-red-500/40'
      } ${!canLike ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
        error ? 'ring-1 ring-red-400/50' : ''
      }`}
    >
      <span aria-hidden>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
