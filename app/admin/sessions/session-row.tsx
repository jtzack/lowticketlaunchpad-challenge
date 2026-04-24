'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateSession } from '../actions'

type Status = 'closed' | 'live' | 'upcoming'

// All due-date handling uses UTC so the calendar date the admin picks is
// the same calendar date every student sees, regardless of the admin's
// or student's local timezone.
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function SessionRow({
  sessionId,
  number,
  initialTitle,
  initialDescription,
  initialHomework,
  initialSessionUrl,
  initialDueAt,
  status,
  opensLabel,
}: {
  sessionId: number
  number: number
  initialTitle: string
  initialDescription: string
  initialHomework: string
  initialSessionUrl: string
  initialDueAt: string | null
  status: Status
  opensLabel: string | null
}) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [homework, setHomework] = useState(initialHomework)
  const [sessionUrl, setSessionUrl] = useState(initialSessionUrl)
  const [date, setDate] = useState(toDateInput(initialDueAt))
  const [time, setTime] = useState(toTimeInput(initialDueAt) || '23:59')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  )
  const [pending, startTransition] = useTransition()

  const dirty = useMemo(() => {
    return (
      title !== initialTitle ||
      description !== initialDescription ||
      homework !== initialHomework ||
      sessionUrl !== initialSessionUrl ||
      date !== toDateInput(initialDueAt) ||
      time !== (toTimeInput(initialDueAt) || '23:59')
    )
  }, [
    title,
    description,
    homework,
    sessionUrl,
    date,
    time,
    initialTitle,
    initialDescription,
    initialHomework,
    initialSessionUrl,
    initialDueAt,
  ])

  function save() {
    setMsg(null)
    let dueIso: string | null = null
    if (date) {
      const hm = time || '23:59'
      const utc = new Date(`${date}T${hm}:00.000Z`)
      if (!Number.isNaN(utc.getTime())) dueIso = utc.toISOString()
    }
    const urlToSave = sessionUrl.trim() || null
    startTransition(async () => {
      const res = await updateSession(
        sessionId,
        title,
        description,
        homework,
        urlToSave,
        dueIso
      )
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Saved' })
      } else {
        setMsg({ kind: 'err', text: res.error })
      }
    })
  }

  const numberColor =
    status === 'closed'
      ? 'text-yellow'
      : status === 'live'
        ? 'text-blue'
        : 'text-white'
  const borderClass =
    status === 'live' ? 'border-blue/35 bg-blue/[0.04]' : 'border-white/10 bg-white/[0.015]'

  const statusLine =
    status === 'closed'
      ? '✓ CLOSED'
      : status === 'live'
        ? '● LIVE · ACCEPTING SUBMISSIONS'
        : opensLabel
          ? `Opens ${opensLabel}`
          : 'Upcoming'

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[70px_minmax(0,1fr)_180px_140px_140px] gap-4 md:gap-5 p-5 border ${borderClass} rounded-xl`}
    >
      <div className={`font-display text-[28px] ${numberColor} leading-none md:self-end md:pb-2`}>
        S0{number}
      </div>

      <div>
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mb-1.5">
          SESSION TITLE
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-sans text-[13px] text-white focus:border-blue focus:outline-none"
        />
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mt-3 mb-1.5">
          SUBTITLE
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-sans text-[13px] text-white/90 leading-[1.5] focus:border-blue focus:outline-none resize-y"
        />
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mt-3 mb-1.5">
          HOMEWORK PROMPT
        </label>
        <textarea
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          rows={3}
          placeholder="What should students submit for this session?"
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-sans text-[13px] text-white/90 leading-[1.5] focus:border-blue focus:outline-none resize-y"
        />
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mt-3 mb-1.5">
          SESSION URL
        </label>
        <input
          type="url"
          value={sessionUrl}
          onChange={(e) => setSessionUrl(e.target.value)}
          placeholder="https://… (link to the session video or doc)"
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-mono text-[12px] text-white focus:border-blue focus:outline-none"
        />
        <div className="font-sans text-[11px] text-white/40 mt-2 uppercase tracking-[0.1em]">
          {statusLine}
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mb-1.5">
          DUE DATE
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-mono text-[12px] text-white focus:border-blue focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mb-1.5">
          TIME
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-mono text-[12px] text-white focus:border-blue focus:outline-none"
        />
      </div>

      <div className="flex flex-col justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="bg-yellow text-black font-sans text-[12px] font-bold uppercase tracking-[0.08em] py-2.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {msg && (
          <p
            className={`mt-1.5 text-[11px] text-center ${
              msg.kind === 'ok' ? 'text-white/50' : 'text-red-400'
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  )
}
