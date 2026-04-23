'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SubmitForm({
  sessionId,
  userId,
}: {
  sessionId: number
  userId: string
}) {
  const router = useRouter()
  const [proofType, setProofType] = useState<'link' | 'text'>('link')
  const [proofUrl, setProofUrl] = useState('')
  const [proofText, setProofText] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const supabase = createClient()

    const payload = {
      user_id: userId,
      session_id: sessionId,
      proof_type: proofType,
      proof_url: proofType === 'link' ? proofUrl : null,
      proof_text: proofType === 'text' ? proofText : null,
      notes: notes || null,
      points_awarded: 100,
      is_public: true,
    }

    const { error: insertError } = await supabase
      .from('submissions')
      .insert(payload)

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    router.push(
      `/dashboard?celebrate=${sessionId}&awarded=${payload.points_awarded}`
    )
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-blue/30 bg-blue/[0.04] rounded-lg p-6"
    >
      <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-4">
        Submit Your Proof
      </p>

      {/* Type toggle */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setProofType('link')}
          className={`flex-1 py-2.5 px-4 rounded-md font-sans text-[13px] font-bold uppercase tracking-wider transition ${
            proofType === 'link'
              ? 'bg-yellow text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => setProofType('text')}
          className={`flex-1 py-2.5 px-4 rounded-md font-sans text-[13px] font-bold uppercase tracking-wider transition ${
            proofType === 'text'
              ? 'bg-yellow text-black'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Text
        </button>
      </div>

      {/* Input */}
      {proofType === 'link' ? (
        <input
          type="url"
          required
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="https://example.com/your-product"
          className="w-full bg-black border border-white/20 rounded-md px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none mb-4"
        />
      ) : (
        <textarea
          required
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          placeholder="Paste your outline, copy, or proof here…"
          rows={6}
          className="w-full bg-black border border-white/20 rounded-md px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none mb-4 resize-y"
        />
      )}

      {/* Notes (optional) */}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — what's the context?"
        className="w-full bg-black border border-white/20 rounded-md px-4 py-3 font-sans text-[13px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none mb-4"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-yellow text-black font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-50"
      >
        {submitting ? 'Submitting\u2026' : 'Submit & Earn 100 Points'}
      </button>

      {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}

      <p className="mt-3 font-sans text-[11px] text-white/40 text-center">
        Submissions are public and visible on the showcase.
      </p>
    </form>
  )
}
