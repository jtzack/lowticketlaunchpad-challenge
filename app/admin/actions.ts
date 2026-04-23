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

export async function updateSession(
  sessionId: number,
  title: string,
  dueAtIso: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('sessions')
      .update({ title, due_at: dueAtIso })
      .eq('id', sessionId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/sessions')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateReward(
  rewardId: number,
  title: string,
  url: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from('rewards')
      .update({ title, url, updated_at: new Date().toISOString() })
      .eq('id', rewardId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/rewards')
    revalidatePath('/rewards')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
