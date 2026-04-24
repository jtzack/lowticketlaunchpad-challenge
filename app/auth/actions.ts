'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Revalidate so any cached server-rendered auth state clears. The
  // redirect below takes the user to the landing page where the logged-out
  // view will render.
  revalidatePath('/', 'layout')
  redirect('/')
}
