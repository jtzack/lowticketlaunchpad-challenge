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

export async function updateTierNames(
  updates: { rank: number; name: string }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    for (const u of updates) {
      const trimmed = u.name.trim()
      if (!trimmed) return { ok: false, error: `Tier ${u.rank} name cannot be empty` }
      if (trimmed.length > 40) return { ok: false, error: `Tier ${u.rank} name too long` }
      const { error } = await admin
        .from('tiers')
        .update({ name: trimmed })
        .eq('rank', u.rank)
      if (error) return { ok: false, error: error.message }
    }
    // Tier names show up on the dashboard, leaderboard, celebrate modal,
    // and anywhere TierBadge renders. Revalidate the pages that read them.
    revalidatePath('/admin/tiers')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// Returns a one-shot magic-link URL for the given email without sending an
// email. Lets an admin DM/text the link directly when Supabase's built-in
// SMTP is rate-limited or a student says they didn't get the email.
//
// SECURITY NOTE: anyone who has the returned link can sign in as that
// user. requireAdmin() gates this; treat the link itself as a credential.
export async function generateSignInLink(
  email: string
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return { ok: false, error: 'Email required' }

    const admin = createAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmed,
      options: siteUrl ? { redirectTo: `${siteUrl}/auth/callback` } : undefined,
    })
    if (error) return { ok: false, error: error.message }
    const link = data?.properties?.action_link
    if (!link) return { ok: false, error: 'No link returned by Supabase' }
    return { ok: true, link }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
