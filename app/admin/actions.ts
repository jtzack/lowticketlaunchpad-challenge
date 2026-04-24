'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    throw new Error('Not authorized')
  }
  return user
}

export async function toggleFeature(
  submissionId: string,
  nextValue: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('submissions')
      .update({ is_featured: nextValue })
      .eq('id', submissionId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/showcase')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

function revalidateSubmissionViews() {
  revalidatePath('/admin')
  revalidatePath('/showcase')
  revalidatePath('/leaderboard')
}

export async function setSubmissionVisibility(
  submissionId: string,
  isPublic: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const update: { is_public: boolean; is_featured?: boolean } = {
      is_public: isPublic,
    }
    // Hiding a submission also un-features it, so it can't linger on the showcase.
    if (!isPublic) update.is_featured = false
    const { error } = await admin
      .from('submissions')
      .update(update)
      .eq('id', submissionId)
    if (error) return { ok: false, error: error.message }
    revalidateSubmissionViews()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function setSubmissionsVisibility(
  submissionIds: string[],
  isPublic: boolean
): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  try {
    await requireAdmin()
    if (submissionIds.length === 0) return { ok: true, count: 0 }
    const admin = createAdminClient()
    const update: { is_public: boolean; is_featured?: boolean } = {
      is_public: isPublic,
    }
    if (!isPublic) update.is_featured = false
    const { error } = await admin
      .from('submissions')
      .update(update)
      .in('id', submissionIds)
    if (error) return { ok: false, error: error.message }
    revalidateSubmissionViews()
    return { ok: true, count: submissionIds.length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteSubmission(
  submissionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('submissions')
      .delete()
      .eq('id', submissionId)
    if (error) return { ok: false, error: error.message }
    revalidateSubmissionViews()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteSubmissions(
  submissionIds: string[]
): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  try {
    await requireAdmin()
    if (submissionIds.length === 0) return { ok: true, count: 0 }
    const admin = createAdminClient()
    const { error } = await admin
      .from('submissions')
      .delete()
      .in('id', submissionIds)
    if (error) return { ok: false, error: error.message }
    revalidateSubmissionViews()
    return { ok: true, count: submissionIds.length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateSession(
  sessionId: number,
  title: string,
  description: string,
  homeworkPrompt: string,
  sessionUrl: string | null,
  dueAtIso: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('sessions')
      .update({
        title,
        description,
        homework_prompt: homeworkPrompt,
        session_url: sessionUrl,
        due_at: dueAtIso,
      })
      .eq('id', sessionId)
    if (error) return { ok: false, error: error.message }
    // Sessions are displayed across the whole app; bust every cache that
    // renders a title, subtitle, or due date so edits appear immediately.
    revalidatePath('/admin/sessions')
    revalidatePath('/admin')
    revalidatePath('/dashboard')
    revalidatePath('/session/[id]', 'page')
    revalidatePath('/showcase')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateReward(
  rewardId: number,
  title: string,
  description: string | null,
  url: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('rewards')
      .update({
        title,
        description,
        url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/rewards')
    revalidatePath('/rewards')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
