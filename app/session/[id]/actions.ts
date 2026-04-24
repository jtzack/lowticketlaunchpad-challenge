'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computePoints } from '@/lib/scoring'

type ProofInput = {
  proofType: 'link' | 'text'
  proofUrl: string | null
  proofText: string | null
  notes: string | null
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

function sanitize(input: ProofInput): ProofInput {
  return {
    proofType: input.proofType === 'text' ? 'text' : 'link',
    proofUrl:
      input.proofType === 'link' && input.proofUrl
        ? input.proofUrl.trim() || null
        : null,
    proofText:
      input.proofType === 'text' && input.proofText
        ? input.proofText.trim() || null
        : null,
    notes: input.notes ? input.notes.trim() || null : null,
  }
}

async function scoreAgainstSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: number,
  input: ProofInput,
  submittedAt: string
): Promise<number> {
  const { data: session } = await supabase
    .from('sessions')
    .select('due_at')
    .eq('id', sessionId)
    .maybeSingle()
  return computePoints({
    proofType: input.proofType,
    hasUrl: Boolean(input.proofUrl),
    hasNotes: Boolean(input.notes),
    submittedAt,
    dueAt: session?.due_at ?? null,
  })
}

export async function submitProof(
  sessionId: number,
  raw: ProofInput
): Promise<Result> {
  try {
    const input = sanitize(raw)
    if (input.proofType === 'link' && !input.proofUrl) {
      return { ok: false, error: 'Link submissions need a URL' }
    }
    if (input.proofType === 'text' && !input.proofText) {
      return { ok: false, error: 'Text submissions need a proof body' }
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
      input,
      submittedAt
    )

    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      session_id: sessionId,
      proof_type: input.proofType,
      proof_url: input.proofUrl,
      proof_text: input.proofText,
      notes: input.notes,
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
    const input = sanitize(raw)
    if (input.proofType === 'link' && !input.proofUrl) {
      return { ok: false, error: 'Link submissions need a URL' }
    }
    if (input.proofType === 'text' && !input.proofText) {
      return { ok: false, error: 'Text submissions need a proof body' }
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
      input,
      existing.submitted_at
    )

    const { error } = await supabase
      .from('submissions')
      .update({
        proof_type: input.proofType,
        proof_url: input.proofUrl,
        proof_text: input.proofText,
        notes: input.notes,
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
