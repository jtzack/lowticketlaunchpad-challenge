'use client'

import { useMemo, useState, useTransition } from 'react'
import { SESSIONS } from '@/lib/sessions'
import { FeatureToggle } from './feature-toggle'
import {
  deleteSubmission,
  deleteSubmissions,
  setSubmissionVisibility,
  setSubmissionsVisibility,
} from './actions'

export type AdminSubmission = {
  id: string
  session_id: number
  proof_type: 'link' | 'text'
  proof_url: string | null
  proof_text: string | null
  notes: string | null
  is_public: boolean
  is_featured: boolean
  submitted_at: string
  user_id: string
  student_name: string | null
  student_email: string | null
}

type Filter = 'all' | 'featured' | 'hidden' | `session-${number}`

export function SubmissionsTable({
  initial,
}: {
  initial: AdminSubmission[]
}) {
  const [rows, setRows] = useState<AdminSubmission[]>(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('all')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const featuredCount = rows.filter((r) => r.is_featured).length
  const hiddenCount = rows.filter((r) => !r.is_public).length
  const countsBySession: Record<number, number> = {}
  for (const r of rows) {
    countsBySession[r.session_id] = (countsBySession[r.session_id] || 0) + 1
  }

  const visibleRows = useMemo(() => {
    if (filter === 'all') return rows
    if (filter === 'featured') return rows.filter((r) => r.is_featured)
    if (filter === 'hidden') return rows.filter((r) => !r.is_public)
    const m = filter.match(/^session-(\d+)$/)
    if (m) {
      const sid = parseInt(m[1], 10)
      return rows.filter((r) => r.session_id === sid)
    }
    return rows
  }, [rows, filter])

  const visibleIds = useMemo(() => visibleRows.map((r) => r.id), [visibleRows])
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someSelected =
    visibleIds.some((id) => selected.has(id)) && !allSelected

  function changeFilter(next: Filter) {
    setFilter(next)
    setSelected(new Set())
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      // Deselect only the currently-visible rows; leave any other
      // selections untouched (defensive — we also reset selection on
      // filter changes so this should be rare).
      setSelected((prev) => {
        const next = new Set(prev)
        for (const id of visibleIds) next.delete(id)
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const id of visibleIds) next.add(id)
        return next
      })
    }
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function handleHide(ids: string[], isPublic: boolean) {
    if (ids.length === 0) return
    setError(null)
    const prevRows = rows
    setRows((rs) =>
      rs.map((r) =>
        ids.includes(r.id)
          ? {
              ...r,
              is_public: isPublic,
              is_featured: isPublic ? r.is_featured : false,
            }
          : r
      )
    )
    startTransition(async () => {
      const res =
        ids.length === 1
          ? await setSubmissionVisibility(ids[0], isPublic)
          : await setSubmissionsVisibility(ids, isPublic)
      if (!res.ok) {
        setRows(prevRows)
        setError(res.error)
      } else {
        clearSelection()
      }
    })
  }

  function handleDelete(ids: string[]) {
    if (ids.length === 0) return
    const label =
      ids.length === 1 ? 'this submission' : `${ids.length} submissions`
    if (
      !confirm(
        `Permanently delete ${label}? This can't be undone and removes points from the leaderboard.`
      )
    ) {
      return
    }
    setError(null)
    const prevRows = rows
    setRows((rs) => rs.filter((r) => !ids.includes(r.id)))
    startTransition(async () => {
      const res =
        ids.length === 1
          ? await deleteSubmission(ids[0])
          : await deleteSubmissions(ids)
      if (!res.ok) {
        setRows(prevRows)
        setError(res.error)
      } else {
        clearSelection()
      }
    })
  }

  const selectedIds = Array.from(selected)
  const selectedHasVisible = selectedIds.some(
    (id) => rows.find((r) => r.id === id)?.is_public
  )
  const selectedHasHidden = selectedIds.some(
    (id) => rows.find((r) => r.id === id)?.is_public === false
  )

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Chip
          label={`ALL · ${rows.length}`}
          active={filter === 'all'}
          onClick={() => changeFilter('all')}
        />
        <Chip
          label={`★ FEATURED · ${featuredCount}`}
          active={filter === 'featured'}
          onClick={() => changeFilter('featured')}
        />
        <Chip
          label={`HIDDEN · ${hiddenCount}`}
          active={filter === 'hidden'}
          onClick={() => changeFilter('hidden')}
        />
        <span className="w-px h-5 bg-white/10 mx-1" />
        {SESSIONS.map((s) => (
          <Chip
            key={s.id}
            label={`S0${s.number} · ${countsBySession[s.id] || 0}`}
            active={filter === `session-${s.id}`}
            onClick={() => changeFilter(`session-${s.id}`)}
          />
        ))}
      </div>

      {/* Bulk action bar */}
      <div
        className={`flex flex-wrap items-center gap-3 mb-3 px-4 py-3 rounded-lg border transition ${
          selected.size > 0
            ? 'border-yellow/40 bg-yellow/[0.06]'
            : 'border-white/10 bg-dark/30'
        }`}
      >
        <label className="flex items-center gap-2 font-sans text-[12px] text-white/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected
            }}
            onChange={toggleAll}
            className="w-4 h-4 accent-yellow cursor-pointer"
          />
          <span className="uppercase tracking-[0.14em] text-[11px] font-bold">
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </span>
        </label>

        <div className="flex-1" />

        {selected.size > 0 && (
          <>
            {selectedHasVisible && (
              <BulkButton
                onClick={() => handleHide(selectedIds, false)}
                disabled={pending}
                variant="warn"
              >
                Hide selected
              </BulkButton>
            )}
            {selectedHasHidden && (
              <BulkButton
                onClick={() => handleHide(selectedIds, true)}
                disabled={pending}
                variant="default"
              >
                Show selected
              </BulkButton>
            )}
            <BulkButton
              onClick={() => handleDelete(selectedIds)}
              disabled={pending}
              variant="danger"
            >
              Delete selected
            </BulkButton>
            <button
              type="button"
              onClick={clearSelection}
              disabled={pending}
              className="font-sans text-[11px] uppercase tracking-[0.12em] text-white/40 hover:text-white/70 px-2 py-2 disabled:opacity-50"
            >
              Clear
            </button>
          </>
        )}

        {selected.size === 0 && (
          <span className="font-sans text-[11px] text-white/40 uppercase tracking-[0.14em]">
            Select rows to hide or delete in bulk
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 px-4 py-2 rounded-md border border-red-400/30 bg-red-400/10 font-sans text-[12px] text-red-300">
          {error}
        </div>
      )}

      {/* Submissions table */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[36px_70px_minmax(0,1.6fr)_minmax(0,1.2fr)_120px_140px] md:grid-cols-[36px_80px_minmax(0,1.6fr)_minmax(0,1.2fr)_100px_100px_260px] px-5 py-3 bg-[#0f0f0f] font-sans text-[10px] text-white/45 uppercase tracking-[0.14em]">
          <span />
          <span>Session</span>
          <span>Student &amp; Proof</span>
          <span>Note</span>
          <span className="hidden md:block">Tier</span>
          <span>Time</span>
          <span className="text-right">Actions</span>
        </div>

        {visibleRows.length === 0 ? (
          <div className="px-5 py-12 text-center font-sans text-[14px] text-white/40">
            {rows.length === 0
              ? 'No submissions yet.'
              : 'No submissions match this filter.'}
          </div>
        ) : (
          visibleRows.map((sub) => {
            const initials = (sub.student_name || sub.student_email || '—')
              .split(/[\s@]+/)
              .map((s: string) => s[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
            const time = new Date(sub.submitted_at).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric' }
            )
            const isSelected = selected.has(sub.id)
            const hidden = !sub.is_public
            return (
              <div
                key={sub.id}
                className={`grid grid-cols-[36px_70px_minmax(0,1.6fr)_minmax(0,1.2fr)_120px_140px] md:grid-cols-[36px_80px_minmax(0,1.6fr)_minmax(0,1.2fr)_100px_100px_260px] px-5 py-4 border-t border-white/10 items-center ${
                  isSelected
                    ? 'bg-yellow/[0.06]'
                    : sub.is_featured
                      ? 'bg-yellow/[0.04]'
                      : ''
                } ${hidden ? 'opacity-60' : ''}`}
              >
                <label className="flex items-center justify-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(sub.id)}
                    className="w-4 h-4 accent-yellow cursor-pointer"
                    aria-label={`Select submission by ${sub.student_name || 'student'}`}
                  />
                </label>
                <span className="font-mono text-[11px] text-yellow tracking-[0.12em]">
                  S0{sub.session_id}
                </span>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue/15 border border-blue/40 text-blue flex items-center justify-center font-display text-[11px] shrink-0">
                    {initials || '—'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-sans text-[13px] text-white truncate flex items-center gap-2">
                      {sub.student_name || 'Anonymous'}
                      {hidden && (
                        <span className="font-sans text-[9px] text-white/50 uppercase tracking-[0.14em] border border-white/20 rounded px-1.5 py-0.5">
                          Hidden
                        </span>
                      )}
                    </div>
                    {sub.proof_type === 'link' && sub.proof_url ? (
                      <a
                        href={sub.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-[12px] text-blue hover:text-yellow underline truncate block"
                      >
                        {sub.proof_url}
                      </a>
                    ) : (
                      <span className="font-sans text-[12px] text-white/40 truncate block">
                        — text submission —
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-sans text-[12px] text-white/55 truncate">
                  {sub.notes || sub.proof_text?.slice(0, 80) || '—'}
                </div>
                <span className="hidden md:block font-sans text-[12px] text-white/55">
                  {sub.proof_type === 'text' ? 'Text' : 'Link'}
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  {time}
                </span>
                <div className="flex justify-end items-center gap-2">
                  <FeatureToggle
                    submissionId={sub.id}
                    initial={Boolean(sub.is_featured)}
                  />
                  <RowButton
                    onClick={() => handleHide([sub.id], hidden)}
                    disabled={pending}
                    title={hidden ? 'Show submission' : 'Hide submission'}
                    variant={hidden ? 'default' : 'warn'}
                  >
                    {hidden ? 'Show' : 'Hide'}
                  </RowButton>
                  <RowButton
                    onClick={() => handleDelete([sub.id])}
                    disabled={pending}
                    title="Delete submission"
                    variant="danger"
                  >
                    Delete
                  </RowButton>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function RowButton({
  onClick,
  disabled,
  title,
  variant,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title?: string
  variant: 'default' | 'warn' | 'danger'
  children: React.ReactNode
}) {
  const styles =
    variant === 'danger'
      ? 'border-red-400/30 text-red-300 hover:border-red-400/60 hover:text-red-200'
      : variant === 'warn'
        ? 'border-white/20 text-white/60 hover:border-yellow/50 hover:text-yellow'
        : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2.5 py-2 rounded-md border bg-transparent font-sans text-[11px] font-bold uppercase tracking-[0.1em] transition disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  )
}

function BulkButton({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  variant: 'default' | 'warn' | 'danger'
  children: React.ReactNode
}) {
  const styles =
    variant === 'danger'
      ? 'border-red-400/40 text-red-200 bg-red-400/10 hover:bg-red-400/20'
      : variant === 'warn'
        ? 'border-yellow/40 text-yellow bg-yellow/10 hover:bg-yellow/20'
        : 'border-white/30 text-white bg-white/5 hover:bg-white/10'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-md border font-sans text-[11px] font-bold uppercase tracking-[0.1em] transition disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick?: () => void
}) {
  const base =
    'inline-flex items-center px-3 py-1.5 rounded-full font-sans text-[11px] font-bold uppercase tracking-wider transition'
  const classes = active
    ? `${base} bg-yellow text-black border border-yellow`
    : `${base} border border-white/10 bg-dark/30 text-white/55 hover:text-yellow hover:border-white/30`
  return (
    <button type="button" onClick={onClick} className={classes}>
      {label}
    </button>
  )
}
