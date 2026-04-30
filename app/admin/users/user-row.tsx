'use client'

import { useState, useTransition } from 'react'
import { generateSignInLink } from '../actions'

export function UserRow({
  email,
  name,
}: {
  email: string
  name: string | null
}) {
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  function fetchLink() {
    setError(null)
    setLink(null)
    setCopied(false)
    startTransition(async () => {
      const res = await generateSignInLink(email)
      if (res.ok) setLink(res.link)
      else setError(res.error)
    })
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select and copy manually.')
    }
  }

  function clear() {
    setLink(null)
    setError(null)
    setCopied(false)
  }

  return (
    <div className="border border-white/10 bg-white/[0.015] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="md:flex-1 min-w-0">
        <div className="font-sans text-[14px] text-white truncate">
          {name || <span className="text-white/40">— no name —</span>}
        </div>
        <div className="font-mono text-[12px] text-white/50 truncate">
          {email}
        </div>
      </div>

      {link ? (
        <div className="flex items-center gap-2 md:max-w-xl w-full md:w-auto">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className="flex-1 bg-black border border-yellow/30 rounded-md px-3 py-2 font-mono text-[11px] text-blue truncate focus:border-yellow focus:outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="bg-yellow text-black font-sans text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-2 rounded-md hover:bg-yellow/90 transition shrink-0"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={clear}
            className="font-sans text-[11px] uppercase tracking-[0.12em] text-white/40 hover:text-white/70 px-2 py-2 shrink-0"
          >
            Clear
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={fetchLink}
          disabled={pending}
          className="bg-transparent border border-white/20 text-white/70 font-sans text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-2 rounded-md hover:border-yellow/50 hover:text-yellow transition disabled:opacity-50 shrink-0"
        >
          {pending ? 'Generating…' : 'Get sign-in link'}
        </button>
      )}

      {error && (
        <span className="font-sans text-[12px] text-red-400 md:ml-2">
          {error}
        </span>
      )}
    </div>
  )
}
