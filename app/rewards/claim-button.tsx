'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ClaimButton({
  rewardId,
  url,
  userId,
}: {
  rewardId: number
  url: string
  userId: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('reward_claims')
      .insert({ user_id: userId, reward_id: rewardId })

    if (insertError && insertError.code !== '23505') {
      // 23505 = unique_violation (already claimed, treat as success)
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Open the reward link in a new tab and refresh the page state.
    window.open(url, '_blank', 'noopener,noreferrer')
    startTransition(() => {
      router.refresh()
    })
    setLoading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className="w-full bg-yellow text-black font-sans text-[13px] font-bold uppercase tracking-[0.08em] py-3 rounded-lg hover:bg-yellow/90 transition disabled:opacity-50"
      >
        {loading ? 'Claiming…' : 'Claim reward →'}
      </button>
      {error && (
        <p className="mt-2 text-[12px] text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
