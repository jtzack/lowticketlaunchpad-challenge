'use client'

import { useState } from 'react'
import { LinkPreview } from '@/components/LinkPreview'
import { SubmitForm, type SubmissionDraft } from './submit-form'

export function MySubmissionCard({
  sessionId,
  userId,
  dueAt,
  submission,
  pointsAwarded,
  submittedAt,
}: {
  sessionId: number
  userId: string
  dueAt: string | null
  submission: SubmissionDraft
  pointsAwarded: number
  submittedAt: string
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <SubmitForm
        sessionId={sessionId}
        userId={userId}
        dueAt={dueAt}
        existing={{ ...submission, submitted_at: submittedAt }}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="border border-yellow/40 bg-yellow/[0.04] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans text-[11px] font-bold text-yellow uppercase tracking-wider">
          ✓ Submitted · +{pointsAwarded} points
        </span>
        <div className="flex items-center gap-3">
          <span className="font-sans text-[12px] text-white/40">
            {new Date(submittedAt).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-2.5 py-1 rounded-md border border-white/20 bg-transparent text-white/70 font-sans text-[11px] font-bold uppercase tracking-[0.1em] hover:border-yellow/50 hover:text-yellow transition"
          >
            Edit
          </button>
        </div>
      </div>
      {submission.proof_type === 'link' && submission.proof_url && (
        <LinkPreview url={submission.proof_url} />
      )}
      {submission.proof_type === 'text' && submission.proof_text && (
        <p className="font-sans text-[14px] text-white/70 whitespace-pre-wrap leading-relaxed">
          {submission.proof_text}
        </p>
      )}
      {submission.notes && (
        <p className="mt-4 pt-4 border-t border-white/10 font-sans text-[13px] text-white/50 italic">
          &ldquo;{submission.notes}&rdquo;
        </p>
      )}
    </div>
  )
}
