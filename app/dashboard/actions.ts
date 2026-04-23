'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Ok = { ok: true; name: string }
type Err = { ok: false; error: string }

export async function updateProfileName(name: string): Promise<Ok | Err> {
  try {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, error: 'Name cannot be empty' }
    if (trimmed.length > 60) return { ok: false, error: 'Name too long' }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Not signed in' }

    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed })
      .eq('id', user.id)

    if (error) return { ok: false, error: error.message }

    // Name surfaces on every page that renders a student identity.
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    revalidatePath('/showcase')
    revalidatePath('/admin')
    return { ok: true, name: trimmed }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}
