import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { SESSIONS } from '@/lib/sessions'
import { isAdmin } from '@/lib/admin'
import { AdminHeader } from './admin-header'
import { FeatureToggle } from './feature-toggle'

export const dynamic = 'force-dynamic'

export default async function AdminShowcasePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) return <NotAuthorized />

  const { data: subs } = await supabase
    .from('submissions')
    .select('*, profiles(name, email)')
    .order('submitted_at', { ascending: false })
    .limit(200)

  const submissions = subs || []
  const featuredCount = submissions.filter((s) => s.is_featured).length

  const { count: cohortSize } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const countsBySession: Record<number, number> = {}
  for (const s of submissions) {
    countsBySession[s.session_id] = (countsBySession[s.session_id] || 0) + 1
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AdminHeader tab="showcase" adminEmail={user.email || 'admin'} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-10">
        {/* Title + stats */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-7">
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
              Moderation · Showcase
            </p>
            <h1 className="font-display text-[clamp(36px,5vw,48px)] text-white uppercase leading-[0.95]">
              All submissions.
            </h1>
            <p className="font-sans text-[14px] text-white/55 mt-2 max-w-[640px]">
              Every submission is live on the public showcase. Toggle{' '}
              <span className="text-yellow">★ Feature</span> to promote the best
              ones.
            </p>
          </div>
          <div className="flex gap-6">
            <Stat value={submissions.length} label="Total" color="#fff" />
            <Stat value={featuredCount} label="Featured" color="#F9E35D" />
            <Stat value={cohortSize || 0} label="Cohort size" color="#87B8F8" />
          </div>
        </div>

        {/* Filter summary chips (read-only, matches design) */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Chip label={`ALL · ${submissions.length}`} accent="yellow" />
          <Chip label={`★ FEATURED · ${featuredCount}`} />
          <span className="w-px h-5 bg-white/10 mx-1" />
          {SESSIONS.map((s) => (
            <Chip
              key={s.id}
              label={`S0${s.number} · ${countsBySession[s.id] || 0}`}
            />
          ))}
        </div>

        {/* Submissions table */}
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[70px_minmax(0,1.6fr)_minmax(0,1.2fr)_120px_140px] md:grid-cols-[80px_minmax(0,1.6fr)_minmax(0,1.2fr)_100px_100px_140px] px-5 py-3 bg-[#0f0f0f] font-sans text-[10px] text-white/45 uppercase tracking-[0.14em]">
            <span>Session</span>
            <span>Student &amp; Proof</span>
            <span>Note</span>
            <span className="hidden md:block">Tier</span>
            <span>Time</span>
            <span className="text-right">Feature</span>
          </div>

          {submissions.length === 0 ? (
            <div className="px-5 py-12 text-center font-sans text-[14px] text-white/40">
              No submissions yet.
            </div>
          ) : (
            submissions.map((sub) => {
              const profile = Array.isArray(sub.profiles)
                ? sub.profiles[0]
                : sub.profiles
              const initials = (profile?.name || profile?.email || '—')
                .split(/[\s@]+/)
                .map((s: string) => s[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const time = new Date(sub.submitted_at).toLocaleDateString(
                'en-US',
                { month: 'short', day: 'numeric' }
              )
              return (
                <div
                  key={sub.id}
                  className={`grid grid-cols-[70px_minmax(0,1.6fr)_minmax(0,1.2fr)_120px_140px] md:grid-cols-[80px_minmax(0,1.6fr)_minmax(0,1.2fr)_100px_100px_140px] px-5 py-4 border-t border-white/10 items-center ${
                    sub.is_featured ? 'bg-yellow/[0.04]' : ''
                  }`}
                >
                  <span className="font-mono text-[11px] text-yellow tracking-[0.12em]">
                    S0{sub.session_id}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue/15 border border-blue/40 text-blue flex items-center justify-center font-display text-[11px] shrink-0">
                      {initials || '—'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-sans text-[13px] text-white truncate">
                        {profile?.name || 'Anonymous'}
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
                  <div className="flex justify-end">
                    <FeatureToggle
                      submissionId={sub.id}
                      initial={Boolean(sub.is_featured)}
                    />
                  </div>
                </div>
              )
            })
          )}
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

function Stat({
  value,
  label,
  color,
}: {
  value: number
  label: string
  color: string
}) {
  return (
    <div>
      <div
        className="font-display leading-none"
        style={{ color, fontSize: 'clamp(32px, 4vw, 44px)' }}
      >
        {value}
      </div>
      <div className="font-sans text-[10px] text-white/40 uppercase tracking-[0.18em] mt-1.5">
        {label}
      </div>
    </div>
  )
}

function Chip({ label, accent }: { label: string; accent?: 'yellow' }) {
  if (accent === 'yellow') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow text-black font-sans text-[11px] font-bold uppercase tracking-wider">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-dark/30 text-white/55 font-sans text-[11px] font-bold uppercase tracking-wider">
      {label}
    </span>
  )
}

function NotAuthorized() {
  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />
      <main className="flex-1 flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="font-display text-[32px] text-white uppercase mb-2">
            Not Authorized
          </h1>
          <p className="font-sans text-[14px] text-white/50">
            This page is for admins only.
          </p>
        </div>
      </main>
    </div>
  )
}
