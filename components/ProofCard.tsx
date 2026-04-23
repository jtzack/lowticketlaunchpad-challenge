import type { Submission } from '@/lib/points'
import { getSessionById } from '@/lib/sessions'

type ProofCardProps = {
  submission: Submission
  studentName?: string | null
  showSession?: boolean
  featured?: boolean
}

export function ProofCard({
  submission,
  studentName,
  showSession = false,
  featured = false,
}: ProofCardProps) {
  const session = getSessionById(submission.session_id)
  const date = new Date(submission.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className={`border rounded-lg p-5 transition ${
        featured
          ? 'border-yellow/40 bg-yellow/[0.04] hover:border-yellow/60'
          : 'border-white/10 bg-dark/30 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[10px] font-bold text-yellow uppercase tracking-wider flex items-center gap-2">
          {showSession && session
            ? `Session ${session.number}`
            : `Session ${submission.session_id}`}
          {featured && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow text-black text-[9px] font-bold tracking-[0.1em]">
              ★ FEATURED
            </span>
          )}
        </span>
        <span className="font-sans text-[11px] text-white/30">{date}</span>
      </div>

      {showSession && session && (
        <h4 className="font-display text-[15px] text-white uppercase leading-tight mb-3">
          {session.title}
        </h4>
      )}

      {submission.proof_type === 'link' && submission.proof_url && (
        <a
          href={submission.proof_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-[13px] text-blue hover:text-yellow underline break-all"
        >
          {submission.proof_url}
        </a>
      )}
      {submission.proof_type === 'text' && submission.proof_text && (
        <p className="font-sans text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap line-clamp-6">
          {submission.proof_text}
        </p>
      )}

      {submission.notes && (
        <p className="mt-3 pt-3 border-t border-white/5 font-sans text-[12px] text-white/40 italic">
          &ldquo;{submission.notes}&rdquo;
        </p>
      )}

      {studentName && (
        <p className="mt-3 pt-3 border-t border-white/5 font-sans text-[11px] text-white/50">
          by <span className="text-cream">{studentName}</span>
        </p>
      )}
    </div>
  )
}
