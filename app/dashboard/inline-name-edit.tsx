'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileName } from './actions'

export function InlineNameEdit({
  initialName,
  needsSetup = false,
}: {
  initialName: string
  needsSetup?: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialName)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startEdit() {
    setDraft(name)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setDraft(name)
    setEditing(false)
    setError(null)
  }

  function save() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === name) {
      cancel()
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await updateProfileName(trimmed)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setName(res.name)
      setEditing(false)
      // Refresh so header initials + any other name-derived UI updates too.
      router.refresh()
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  const headingCls =
    'font-display text-[clamp(36px,5vw,56px)] uppercase leading-[0.95] mb-3'

  if (editing) {
    return (
      <div>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={onKeyDown}
          disabled={pending}
          maxLength={60}
          placeholder="Your name"
          className={`${headingCls} text-white bg-transparent border-b-2 border-yellow outline-none w-full max-w-full disabled:opacity-60`}
        />
        {error && (
          <p className="font-sans text-[12px] text-red-400 mt-1">{error}</p>
        )}
      </div>
    )
  }

  // When the student hasn't set a real name yet, the heading still falls
  // back to their email prefix — but we surface a pulsing "Set name" pill
  // so they actually notice the editor and put a friendlier name in.
  return (
    <div>
      <button
        type="button"
        onClick={startEdit}
        title="Click to edit your name"
        className={`${headingCls} text-white text-left group inline-flex items-baseline gap-2 hover:text-yellow transition cursor-text`}
      >
        <span>{name}</span>
        <span
          aria-hidden
          className={
            needsSetup
              ? 'font-sans text-[12px] font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-full bg-yellow/15 border border-yellow/50 text-yellow animate-pulse'
              : 'font-sans text-[13px] font-bold tracking-[0.1em] uppercase text-white/30 opacity-0 group-hover:opacity-100 transition'
          }
        >
          {needsSetup ? 'Set name' : 'Edit'}
        </span>
      </button>
      {needsSetup && (
        <p className="font-sans text-[12px] text-white/55 mt-2 max-w-md">
          Heads up — that&apos;s your email prefix. Click your name above to
          set the one you want the cohort to see.
        </p>
      )}
    </div>
  )
}
