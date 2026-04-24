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

// A "link" submission stores the URL in proof_url and free-form context in
// notes. A "text" submission stores the student's writeup in proof_text
// (notes is null). The edit form collapses both shapes into a single
// url + notes view; on save the server re-derives which columns to fill.
function draftToFields(draft: SubmissionDraft | undefined): {
  url: string
  notes: string
} {
  if (!draft) return { url: '', notes: '' }
  if (draft.proof_type === 'link') {
    return {
      url: draft.proof_url ?? '',
      notes: draft.notes ?? '',
    }
  }
  return {
    url: '',
    notes: draft.proof_text ?? draft.notes ?? '',
  }
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
  const initialFields = draftToFields(existing)
  const [url, setUrl] = useState(initialFields.url)
  const [notes, setNotes] = useState(initialFields.notes)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // Edits keep the original submitted_at for scoring so a typo fix doesn't
  // change the lateness penalty; new submissions score against now.
  const effectiveSubmittedAt = existing?.submitted_at ?? new Date().toISOString()

  const hasUrl = Boolean(url.trim())
  const hasNotes = Boolean(notes.trim())
  const canSubmit = hasUrl || hasNotes

  const breakdown = useMemo(
    () =>
      computePointsBreakdown({
        hasUrl,
        hasNotes,
        submittedAt: effectiveSubmittedAt,
        dueAt,
      }),
    [hasUrl, hasNotes, dueAt, effectiveSubmittedAt]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!canSubmit) {
      setError('Add a link or notes before submitting.')
      return
    }

    const payload = {
      url: hasUrl ? url : null,
      notes: hasNotes ? notes : null,
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
      <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
        {isEdit ? 'Edit Your Submission' : 'Submit Your Proof'}
      </p>
      <p className="font-sans text-[13px] text-white/55 leading-[1.5] mb-5">
        Fill in either field (or both). A link + notes earns the most points.
      </p>

      {/* Link */}
      <label className="block font-mono text-[10px] text-white/50 tracking-[0.14em] mb-1.5 uppercase">
        Link to your work{' '}
        <span className="text-white/30 normal-case tracking-normal">(optional)</span>
      </label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/your-product"
        className="w-full bg-black border border-white/20 rounded-md px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none mb-4"
      />

      {/* Notes */}
      <label className="block font-mono text-[10px] text-white/50 tracking-[0.14em] mb-1.5 uppercase">
        Notes{' '}
        <span className="text-white/30 normal-case tracking-normal">
          (optional — context, or your answer if you don&apos;t have a link)
        </span>
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What did you build? What did you learn?"
        rows={5}
        className="w-full bg-black border border-white/20 rounded-md px-4 py-3 font-sans text-[14px] text-white placeholder:text-white/30 focus:border-blue focus:outline-none mb-4 resize-y"
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
          {breakdown.baseReason}
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
          disabled={pending || !canSubmit}
          className="flex-1 bg-yellow text-black font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
