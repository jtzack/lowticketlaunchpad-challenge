import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { ProofCard } from '@/components/ProofCard'
import type { Submission } from '@/lib/points'
import { SESSIONS } from '@/lib/sessions'

export const dynamic = 'force-dynamic'

type Filter = 'all' | 'featured' | `session-${number}`

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; session?: string }>
}) {
  const sp = await searchParams
  const sessionFilter = sp?.session ? parseInt(sp.session, 10) : null
  const wantsFeatured = sp?.filter === 'featured'
  const activeFilter: Filter = wantsFeatured
    ? 'featured'
    : sessionFilter && !Number.isNaN(sessionFilter)
      ? (`session-${sessionFilter}` as const)
      : 'all'

  const supabase = await createClient()

  // Full counts (unfiltered) for chip labels
  const { data: allSubs } = await supabase
    .from('submissions')
    .select('session_id, is_featured')
    .eq('is_public', true)

  const countsBySession: Record<number, number> = {}
  let featuredCount = 0
  for (const s of allSubs || []) {
    countsBySession[s.session_id] = (countsBySession[s.session_id] || 0) + 1
    if (s.is_featured) featuredCount++
  }
  const totalCount = (allSubs || []).length

  // Filtered query for the grid
  let query = supabase
    .from('submissions')
    .select('*, profiles(name)')
    .eq('is_public', true)
    .order('submitted_at', { ascending: false })
    .limit(60)

  if (wantsFeatured) query = query.eq('is_featured', true)
  if (sessionFilter && !wantsFeatured)
    query = query.eq('session_id', sessionFilter)

  const { data: submissionsData } = await query
  const submissions = submissionsData || []

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader active="showcase" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
        <div className="mb-10">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
            What Students Are Building
          </p>
          <h1 className="font-display text-[clamp(36px,5vw,56px)] text-white uppercase leading-[0.95]">
            The Showcase
          </h1>
          <p className="font-sans text-[15px] text-white/55 mt-3 max-w-[640px]">
            Real proof from real students completing the challenge. The
            templates, products, courses, and outlines that come out of
            Low-Ticket Launchpad LIVE.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <FilterChip
            href="/showcase"
            active={activeFilter === 'all'}
            label="All"
            count={totalCount}
          />
          <FilterChip
            href="/showcase?filter=featured"
            active={activeFilter === 'featured'}
            label="★ Featured"
            count={featuredCount}
            accent="yellow"
          />
          <span className="w-px h-5 bg-white/10 mx-1" />
          {SESSIONS.map((s) => (
            <FilterChip
              key={s.id}
              href={`/showcase?session=${s.id}`}
              active={activeFilter === `session-${s.id}`}
              label={`S0${s.number}`}
              count={countsBySession[s.id] || 0}
            />
          ))}
        </div>

        {submissions.length === 0 ? (
          <div className="border border-white/10 rounded-lg p-12 text-center bg-dark/30">
            <p className="font-display text-[24px] text-white uppercase mb-2">
              Nothing Yet
            </p>
            <p className="font-sans text-[14px] text-white/50">
              {activeFilter === 'featured'
                ? 'No featured submissions yet. Admins can promote standout work from the admin page.'
                : 'Be the first to submit. Sign in and complete a session.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((sub) => {
              const profile = Array.isArray(sub.profiles)
                ? sub.profiles[0]
                : sub.profiles
              return (
                <ProofCard
                  key={sub.id}
                  submission={sub as Submission}
                  studentName={profile?.name || null}
                  showSession
                  featured={Boolean(sub.is_featured)}
                />
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="font-sans text-[12px] text-white/30">
          &copy; 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
        </p>
      </footer>
    </div>
  )
}

function FilterChip({
  href,
  active,
  label,
  count,
  accent,
}: {
  href: string
  active: boolean
  label: string
  count: number
  accent?: 'yellow'
}) {
  const base =
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-sans text-[11px] font-bold uppercase tracking-wider transition'
  if (active && accent === 'yellow') {
    return (
      <Link
        href={href}
        className={`${base} bg-yellow text-black border-yellow`}
      >
        <span>{label}</span>
        <span className="opacity-70">·</span>
        <span>{count}</span>
      </Link>
    )
  }
  if (active) {
    return (
      <Link
        href={href}
        className={`${base} bg-white/10 text-white border-white/20`}
      >
        <span>{label}</span>
        <span className="opacity-50">·</span>
        <span>{count}</span>
      </Link>
    )
  }
  return (
    <Link
      href={href}
      className={`${base} border-white/10 bg-dark/30 text-white/60 hover:text-yellow hover:border-white/30`}
    >
      <span className={accent === 'yellow' ? 'text-yellow' : ''}>{label}</span>
      <span className="opacity-50">·</span>
      <span className="opacity-70">{count}</span>
    </Link>
  )
}
