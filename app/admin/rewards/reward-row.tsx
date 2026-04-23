'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateReward } from '../actions'

export function RewardRow({
  rewardId,
  sessionTag,
  sessionNumber,
  initialTitle,
  initialDescription,
  initialUrl,
  stats,
}: {
  rewardId: number
  sessionTag: string
  sessionNumber: number
  initialTitle: string
  initialDescription: string
  initialUrl: string | null
  stats: { unlocks: number; claimed: number; updatedAt: string | null }
}) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [url, setUrl] = useState(initialUrl ?? '')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  )
  const [pending, startTransition] = useTransition()

  const empty = !url.trim()

  const dirty = useMemo(() => {
    return (
      title !== initialTitle ||
      description !== initialDescription ||
      (url || null) !== (initialUrl || null)
    )
  }, [title, description, url, initialTitle, initialDescription, initialUrl])

  function save() {
    setMsg(null)
    startTransition(async () => {
      const res = await updateReward(
        rewardId,
        title.trim(),
        description.trim() || null,
        url.trim() || null
      )
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Saved' })
      } else {
        setMsg({ kind: 'err', text: res.error })
      }
    })
  }

  return (
    <div
      className={`border rounded-xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-[90px_minmax(0,1.1fr)_minmax(0,1.3fr)_130px] gap-5 items-end ${
        empty
          ? 'border-red-400/25 bg-red-400/[0.03]'
          : 'border-white/10 bg-white/[0.015]'
      }`}
    >
      {/* Index */}
      <div>
        <div className="w-[50px] h-[50px] rounded-xl bg-yellow/10 border-2 border-yellow text-yellow flex items-center justify-center font-display text-[22px]">
          {String(rewardId).padStart(2, '0')}
        </div>
        <div className="font-mono text-[9px] text-white/40 tracking-[0.14em] mt-2">
          S0{sessionNumber} · {sessionTag}
        </div>
      </div>

      {/* Name + subtitle */}
      <div>
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mb-1.5">
          REWARD NAME
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
          placeholder="Short description students see on the rewards page"
          className="w-full bg-[#0b0b0b] border border-white/15 rounded-md px-3 py-2.5 font-sans text-[12px] text-white/90 leading-[1.5] focus:border-blue focus:outline-none resize-y"
        />
        <div className="font-sans text-[11px] text-white/40 mt-2">
          {stats.unlocks} unlocked · {stats.claimed} claimed
          {stats.updatedAt && (
            <>
              {' · '}
              updated{' '}
              {new Date(stats.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </>
          )}
        </div>
      </div>

      {/* URL */}
      <div>
        <label className="block font-mono text-[10px] text-white/40 tracking-[0.14em] mb-1.5">
          REWARD URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className={`w-full bg-[#0b0b0b] border rounded-md px-3 py-2.5 font-mono text-[12px] text-white focus:border-blue focus:outline-none ${
            empty ? 'border-red-400/40' : 'border-white/15'
          }`}
        />
        {empty && (
          <div className="font-sans text-[11px] text-red-300/80 mt-2">
            ⚠ No link set — students can&apos;t claim yet
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending || !title.trim()}
          className="bg-yellow text-black font-sans text-[12px] font-bold uppercase tracking-[0.08em] py-2.5 rounded-md hover:bg-yellow/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {msg && (
          <p
            className={`text-[11px] text-center ${
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
