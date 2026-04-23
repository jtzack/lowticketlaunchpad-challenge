'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { computePointsBreakdown } from '@/lib/scoring'
import { submitProof, updateProof } from './actions'

export type SubmissionDraft = {
  id: string
  proof_type: 'link' | 'text'
  proof_url: string | null
  proof_text: string | null
  notes: string | null
  submitted_at?: string
}

export function SubmitForm({
  sessionId,
  userId: _userId,
  dueAt,
  existing,
  onSaved,
  onCancel,
}: {
  sessionId: number
  userId: string
  dueAt: string | null
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
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // Use the original submitted_at for edits so a tiny edit doesn't
  // suddenly push points up or down; new submissions score against now.
  const effectiveSubmittedAt = existing?.submitted_at ?? new Date().toISOString()

  const breakdown = useMemo(
    () =>
      computePointsBreakdown({
        proofType,
        hasUrl: Boolean(proofUrl.trim()),
        hasNotes: Boolean(notes.trim()),
        submittedAt: effectiveSubmittedAt,
        dueAt,
      }),
    [proofType, proofUrl, notes, dueAt, effectiveSubmittedAt]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const payload = {
      proofType,
      proofUrl: proofType === 'link' ? proofUrl : null,
      proofText: proofType === 'text' ? proofText : null,
      notes: notes || null,
    }

    startTransition(async () => {
      const res = isEdit && existing
        ? await updateProof(existing.id, payload)
        : await submitProof(sessionId, payload)

      if (!res.ok) {
        setError(res.error)
        return
      }

      if (isEdit) {
        router.refresh()
        onSaved?.()
        return
      }

      router.push(`/dashboard?celebrate=${sessionId}&awarded=${res.pointsAwarded}`)
      router.refresh()
    })
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

      {/* Points preview */}
      <div className="mb-4 px-4 py-3 rounded-md border border-yellow/20 bg-yellow/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-[11px] font-bold text-yellow uppercase tracking-[0.14em]">
            {isEdit ? 'Updated Score' : 'You’ll Earn'}
          </span>
          <span className="font-display text-[24px] text-yellow leading-none">
            {breakdown.total} pts
          </span>
        </div>
        <div className="font-sans text-[12px] text-white/55 mt-1.5">
          {breakdown.base} base ({breakdown.baseReason})
          {breakdown.daysLate > 0 && (
            <>
              {' · '}
              <span className="text-red-300">
                {breakdown.daysLate} day
                {breakdown.daysLate === 1 ? '' : 's'} late ·{' '}
                -{Math.round((1 - breakdown.multiplier) * 100)}%
              </span>
            </>
          )}
        </div>
      </div>

      <div className={isEdit ? 'flex gap-2' : ''}>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 bg-yellow text-black font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-50"
        >
          {pending
            ? isEdit
              ? 'Saving…'
              : 'Submitting…'
            : isEdit
              ? 'Save changes'
              : `Submit & Earn ${breakdown.total} Points`}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
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
