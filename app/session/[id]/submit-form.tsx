'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export type SubmissionDraft = {
  id: string
  proof_type: 'link' | 'text'
  proof_url: string | null
  proof_text: string | null
  notes: string | null
}

export function SubmitForm({
  sessionId,
  userId,
  existing,
  onSaved,
  onCancel,
}: {
  sessionId: number
  userId: string
  existing?: SubmissionDraft
  onSaved?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(existing)
  const [proofType, setProofType] = useState<'link' | 'text'>(
    existing?.proof_type ?? 'link'
  )
  const [proofUrl, setProofUrl] = useState(existing?.proof_url ?? '')
  const [proofText, setProofText] = useState(existing?.proof_text ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const supabase = createClient()
    const payload = {
      proof_type: proofType,
      proof_url: proofType === 'link' ? proofUrl : null,
      proof_text: proofType === 'text' ? proofText : null,
      notes: notes || null,
    }

    if (isEdit && existing) {
      const { error: updateError } = await supabase
        .from('submissions')
        .update(payload)
        .eq('id', existing.id)

      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }

      router.refresh()
      onSaved?.()
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('submissions').insert({
      ...payload,
      user_id: userId,
      session_id: sessionId,
      points_awarded: 100,
      is_public: true,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    router.push(`/dashboard?celebrate=${sessionId}&awarded=100`)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-blue/30 bg-blue/[0.04] rounded-lg p-6"
    >
      <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-4">
        {isEdit ? 'Edit Your Submission' : 'Submit Your Proof'}
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

      <div className={isEdit ? 'flex gap-2' : ''}>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-yellow text-black font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-50"
        >
          {submitting
            ? isEdit
              ? 'Saving…'
              : 'Submitting…'
            : isEdit
              ? 'Save changes'
              : 'Submit & Earn 100 Points'}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 bg-transparent border border-white/20 text-white/70 font-sans text-[13px] font-bold uppercase tracking-[0.08em] rounded-md hover:border-white/40 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}

      {!isEdit && (
        <p className="mt-3 font-sans text-[11px] text-white/40 text-center">
          Submissions are public and visible on the showcase.
        </p>
      )}
    </form>
  )
}
