import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SESSIONS } from '@/lib/sessions'
import { isAdmin } from '@/lib/admin'
import { AdminHeader } from '../admin-header'
import { SessionRow } from './session-row'

export const dynamic = 'force-dynamic'

type SessionRowData = {
  id: number
  number: number
  title: string
  description: string
  due_at: string | null
}

export default async function AdminSessionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) redirect('/')

  const { data: sessionsData } = await supabase
    .from('sessions')
    .select('id, number, title, description, due_at')
    .order('id', { ascending: true })

  // Fall back to hardcoded metadata if the DB hasn't been updated yet.
  const rows: SessionRowData[] =
    sessionsData && sessionsData.length > 0
      ? (sessionsData as SessionRowData[])
      : SESSIONS.map((s) => ({
          id: s.id,
          number: s.number,
          title: s.title,
          description: s.description,
          due_at: null,
        }))

  const now = Date.now()

  // A session opens on the previous session's due date. Session 1 (no
  // predecessor) is always open. Drives live/upcoming/closed states on
  // both the timeline bubbles and the edit rows below.
  function opensAtFor(sessionId: number): number | null {
    const prev = rows.find((r) => r.id === sessionId - 1)
    if (!prev?.due_at) return null
    const t = new Date(prev.due_at).getTime()
    return Number.isNaN(t) ? null : t
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AdminHeader tab="sessions" adminEmail={user.email || 'admin'} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-7">
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
              Cohort schedule
            </p>
            <h1 className="font-display text-[clamp(36px,5vw,48px)] text-white uppercase leading-[0.95]">
              Homework &amp; due dates.
            </h1>
            <p className="font-sans text-[14px] text-white/55 mt-2 max-w-[640px]">
              Edit the title, subtitle, and deadline for each of the 6
              sessions. Students see these immediately across the dashboard,
              session detail, and showcase.
            </p>
          </div>
        </div>

        {/* Timeline preview */}
        <div className="border border-white/10 rounded-xl bg-[#0f0f0f] px-6 py-5 mb-6">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.18em] mb-4">
            Cohort timeline
          </p>
          <div className="relative h-10">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2" />
            {/* Progress line up to the latest closed session */}
            <ProgressLine rows={rows} now={now} />
            <div className="grid grid-cols-6">
              {rows.map((r) => {
                const due = r.due_at ? new Date(r.due_at).getTime() : null
                const opens = opensAtFor(r.id)
                const closed = due !== null && due < now
                // Session is "live" when its unlock has passed (or it has
                // no predecessor → always open) and it isn't closed yet.
                const live = !closed && (opens === null || opens <= now)
                const color = closed
                  ? '#F9E35D'
                  : live
                    ? '#87B8F8'
                    : '#333333'
                const fill = closed ? '#F9E35D' : 'transparent'
                return (
                  <div
                    key={r.id}
                    className="flex flex-col items-center relative -top-[7px]"
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ background: fill, border: `2px solid ${color}` }}
                    />
                    <div className="font-mono text-[10px] text-white/40 tracking-[0.14em] mt-2.5">
                      {r.due_at
                        ? new Date(r.due_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC',
                          })
                        : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Edit rows */}
        <div className="grid gap-3">
          {rows.map((r) => {
            const due = r.due_at ? new Date(r.due_at).getTime() : null
            const opens = opensAtFor(r.id)
            const closed = due !== null && due < now
            const live = !closed && (opens === null || opens <= now)
            const status = closed ? 'closed' : live ? 'live' : 'upcoming'
            const opensLabel = opens
              ? new Date(opens).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'UTC',
                })
              : null
            return (
              <SessionRow
                key={r.id}
                sessionId={r.id}
                number={r.number}
                initialTitle={r.title}
                initialDescription={r.description || ''}
                initialDueAt={r.due_at}
                status={status}
                opensLabel={opensLabel}
              />
            )
          })}
        </div>
      </main>

      <footer className="border-t border-white/10 py-5 text-center">
        <p className="font-sans text-[11px] text-white/30">
          © 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
        </p>
      </footer>
    </div>
  )
}

function ProgressLine({
  rows,
  now,
}: {
  rows: { due_at: string | null }[]
  now: number
}) {
  const closed = rows.filter(
    (r) => r.due_at && new Date(r.due_at).getTime() < now
  ).length
  if (closed === 0) return null
  const pct = Math.min(100, ((closed - 0.5) / rows.length) * 100 + 100 / rows.length / 2)
  return (
    <div
      className="absolute top-1/2 left-0 h-[2px] bg-yellow -translate-y-1/2"
      style={{ width: `${pct}%` }}
    />
  )
}
