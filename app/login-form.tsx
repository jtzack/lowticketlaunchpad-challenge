'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  )
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    setError('')

    const supabase = createClient()
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (signInError) {
      setStatus('error')
      setError(signInError.message)
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-blue/40 bg-blue/5 rounded-[14px] p-7 text-center">
        <p className="font-display text-[22px] text-yellow uppercase mb-2 tracking-wide">
          Check Your Email
        </p>
        <p className="font-sans text-[14px] text-white/60 leading-relaxed">
          We sent a magic link to{' '}
          <strong className="text-white">{email}</strong>. Click it to access
          your dashboard.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/20 rounded-[14px] p-7 bg-[#0f0f0f]"
    >
      <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.18em] mb-3.5">
        Sign in · Magic link
      </p>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3.5 font-sans text-[14px] text-white placeholder:text-white/35 focus:border-blue focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full mt-3 bg-yellow text-black font-sans text-[14px] font-bold uppercase tracking-[0.08em] py-3.5 rounded-lg hover:bg-yellow/90 transition disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link →'}
      </button>
      {error && (
        <p className="mt-3 text-[13px] text-red-400 text-center">{error}</p>
      )}
      <p className="mt-3 font-sans text-[11px] text-white/40 text-center">
        No password. We&apos;ll email you a sign-in link.
      </p>
    </form>
  )
}
