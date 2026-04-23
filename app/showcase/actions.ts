'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Ok = { ok: true; liked: boolean; count: number }
type Err = { ok: false; error: string }

export async function toggleLike(submissionId: string): Promise<Ok | Err> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Sign in to like submissions' }

    const { data: existing } = await supabase
      .from('submission_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('submission_id', submissionId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('submission_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('submission_id', submissionId)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await supabase
        .from('submission_likes')
        .insert({ user_id: user.id, submission_id: submissionId })
      // 23505 = unique violation; treat as success (race on double-click)
      if (error && error.code !== '23505') {
        return { ok: false, error: error.message }
      }
    }

    const { count } = await supabase
      .from('submission_likes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId)

    revalidatePath('/showcase')
    // Session peer view reads counts too, but we don't know which session id
    // the submission belongs to without a round-trip. Skip revalidating it —
    // the optimistic state on the button keeps the UI fresh, and the next
    // natural page load picks up the new count.
    return { ok: true, liked: !existing, count: count ?? 0 }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
