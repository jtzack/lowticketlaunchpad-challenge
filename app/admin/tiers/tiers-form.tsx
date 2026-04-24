'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateTierNames } from '../actions'

export type TierEdit = {
  rank: number
  name: string
  min: number
  unlock: string
}

export function TiersForm({ initial }: { initial: TierEdit[] }) {
  const [names, setNames] = useState<string[]>(initial.map((t) => t.name))
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  )

  const dirty = useMemo(
    () => names.some((n, i) => n !== initial[i].name),
    [names, initial]
  )

  function save() {
    setMsg(null)
    const updates = initial.map((t, i) => ({
      rank: t.rank,
      name: names[i].trim(),
    }))
    if (updates.some((u) => !u.name)) {
      setMsg({ kind: 'err', text: 'Tier names can’t be empty.' })
      return
    }
    startTransition(async () => {
      const res = await updateTierNames(updates)
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Saved' })
      } else {
        setMsg({ kind: 'err', text: res.error })
      }
    })
  }

  return (
    <div className="grid gap-3">
      {initial.map((tier, i) => (
        <div
          key={tier.rank}
          className="grid grid-cols-1 md:grid-cols-[80px_minmax(0,1fr)_minmax(0,1.4fr)] gap-4 md:gap-5 p-5 border border-white/10 bg-white/[0.015] rounded-xl items-end"
        >
          <div className="font-display text-[24px] text-yellow leading-none md:pb-2">
            T0{tier.rank}
          </div>
          <div>
            <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mb-1.5">
              TIER NAME
            </label>
            <input
              type="text"
              value={names[i]}
              onChange={(e) => {
                const next = [...names]
                next[i] = e.target.value
                setNames(next)
              }}
              maxLength={40}
              className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-sans text-[14px] text-white focus:border-blue focus:outline-none"
            />
          </div>
          <div className="font-sans text-[12px] text-white/45 leading-[1.4]">
            <div className="font-mono text-[10px] text-white/35 tracking-[0.14em] uppercase mb-1">
              Threshold
            </div>
            {tier.min === 0
              ? 'Starting tier'
              : `Unlocks at ${tier.min} points`}
            <div className="text-white/35 mt-0.5">{tier.unlock}</div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="bg-yellow text-black font-sans text-[12px] font-bold uppercase tracking-[0.08em] px-5 py-2.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Saving…' : 'Save tier names'}
        </button>
        {msg && (
          <span
            className={`font-sans text-[12px] ${
              msg.kind === 'ok' ? 'text-white/50' : 'text-red-400'
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
