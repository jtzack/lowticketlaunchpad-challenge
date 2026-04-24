'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computePoints } from '@/lib/scoring'

// Two fields, no mode toggle: a link to the work and/or free-form notes.
// proof_type is derived server-side from which of the two is filled.
export type ProofInput = {
  url: string | null
  notes: string | null
}

type SanitizedProof = {
  url: string | null
  notes: string | null
  proofType: 'link' | 'text'
}

type Ok = { ok: true; pointsAwarded: number }
type Err = { ok: false; error: string }
type Result = Ok | Err

async function getUserOrFail() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

function sanitize(input: ProofInput): SanitizedProof | null {
  const url = input.url ? input.url.trim() || null : null
  const notes = input.notes ? input.notes.trim() || null : null
  if (!url && !notes) return null
  // A submission that has a URL is a "link" type, even if the student
  // also left a note. No URL → the notes are the proof, stored as "text".
  return {
    url,
    notes,
    proofType: url ? 'link' : 'text',
  }
}

// Persisted shape for the submissions row. Keeps the DB columns the admin
// table + ProofCard already render (proof_url / proof_text / notes) so no
// rendering changes are needed.
function toRowColumns(s: SanitizedProof) {
  if (s.proofType === 'link') {
    return {
      proof_type: 'link' as const,
      proof_url: s.url,
      proof_text: null,
      notes: s.notes,
    }
  }
  // text-only: store the student's notes as the proof body, leave notes null
  // so ProofCard doesn't double-render it as both proof and commentary.
  return {
    proof_type: 'text' as const,
    proof_url: null,
    proof_text: s.notes,
    notes: null,
  }
}

async function scoreAgainstSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: number,
  s: SanitizedProof,
  submittedAt: string
): Promise<number> {
  const { data: session } = await supabase
    .from('sessions')
    .select('due_at')
    .eq('id', sessionId)
    .maybeSingle()
  return computePoints({
    hasUrl: Boolean(s.url),
    hasNotes: Boolean(s.notes),
    submittedAt,
    dueAt: session?.due_at ?? null,
  })
}

export async function submitProof(
  sessionId: number,
  raw: ProofInput
): Promise<Result> {
  try {
    const s = sanitize(raw)
    if (!s) {
      return {
        ok: false,
        error: 'Add a link or notes before submitting.',
      }
    }

    const { supabase, user } = await getUserOrFail()

    // Gate: a session unlocks on the previous session's due date. Session
    // 1 is always open. This server-side check is the source of truth —
    // the UI also hides the form, but a direct action call needs to be
    // rejected here too.
    if (sessionId > 1) {
      const { data: prev } = await supabase
        .from('sessions')
        .select('due_at')
        .eq('id', sessionId - 1)
        .maybeSingle()
      if (prev?.due_at) {
        const opensAt = new Date(prev.due_at)
        if (!Number.isNaN(opensAt.getTime()) && Date.now() < opensAt.getTime()) {
          const when = opensAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          })
          return {
            ok: false,
            error: `Session ${sessionId} opens ${when}.`,
          }
        }
      }
    }

    const submittedAt = new Date().toISOString()
    const pointsAwarded = await scoreAgainstSession(
      supabase,
      sessionId,
      s,
      submittedAt
    )

    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      session_id: sessionId,
      ...toRowColumns(s),
      points_awarded: pointsAwarded,
      is_public: true,
      submitted_at: submittedAt,
    })
    if (error) return { ok: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath(`/session/${sessionId}`)
    revalidatePath('/showcase')
    revalidatePath('/leaderboard')
    return { ok: true, pointsAwarded }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateProof(
  submissionId: string,
  raw: ProofInput
): Promise<Result> {
  try {
    const s = sanitize(raw)
    if (!s) {
      return {
        ok: false,
        error: 'Add a link or notes before saving.',
      }
    }

    const { supabase } = await getUserOrFail()
    // Need the session id + original submitted_at so lateness is judged by
    // when the work was first turned in, not when the student last tweaked a
    // typo. RLS only lets the owner read their own row so this also doubles
    // as the authorization check.
    const { data: existing, error: readError } = await supabase
      .from('submissions')
      .select('session_id, submitted_at')
      .eq('id', submissionId)
      .maybeSingle()
    if (readError) return { ok: false, error: readError.message }
    if (!existing) return { ok: false, error: 'Submission not found' }

    const pointsAwarded = await scoreAgainstSession(
      supabase,
      existing.session_id,
      s,
      existing.submitted_at
    )

    const { error } = await supabase
      .from('submissions')
      .update({
        ...toRowColumns(s),
        points_awarded: pointsAwarded,
      })
      .eq('id', submissionId)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath(`/session/${existing.session_id}`)
    revalidatePath('/showcase')
    revalidatePath('/leaderboard')
    return { ok: true, pointsAwarded }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
