import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { isAdmin } from '@/lib/admin'
import { AdminHeader } from './admin-header'
import { SubmissionsTable, type AdminSubmission } from './submissions-table'

export const dynamic = 'force-dynamic'

export default async function AdminShowcasePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) return <NotAuthorized />

  // Fetch submissions and their student profiles in separate queries. A
  // PostgREST resource embed for profiles has been flaky since we added
  // the submission_likes table (stale schema cache), so we merge in JS
  // instead.
  const { data: subs } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(200)

  const rawSubs = subs ?? []
  const userIds = Array.from(
    new Set(rawSubs.map((s) => s.user_id).filter(Boolean))
  )
  const profileByUserId = new Map<
    string,
    { name: string | null; email: string | null }
  >()
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds)
    for (const p of profilesData ?? []) {
      profileByUserId.set(p.id, { name: p.name ?? null, email: p.email ?? null })
    }
  }

  const submissions: AdminSubmission[] = rawSubs.map((s) => {
    const profile = profileByUserId.get(s.user_id)
    return {
      id: s.id,
      session_id: s.session_id,
      proof_type: s.proof_type,
      proof_url: s.proof_url,
      proof_text: s.proof_text,
      notes: s.notes,
      is_public: s.is_public,
      is_featured: s.is_featured,
      submitted_at: s.submitted_at,
      user_id: s.user_id,
      student_name: profile?.name ?? null,
      student_email: profile?.email ?? null,
    }
  })
  const featuredCount = submissions.filter((s) => s.is_featured).length
  const hiddenCount = submissions.filter((s) => !s.is_public).length

  const { count: cohortSize } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

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
              Toggle <span className="text-yellow">★ Feature</span> to promote
              the best ones. Use <span className="text-white">Hide</span> to
              remove a submission from the public showcase and leaderboard
              without deleting it, or <span className="text-red-300">Delete</span>{' '}
              to remove it permanently. Select multiple rows for bulk actions.
            </p>
          </div>
          <div className="flex gap-6">
            <Stat value={submissions.length} label="Total" color="#fff" />
            <Stat value={featuredCount} label="Featured" color="#F9E35D" />
            <Stat value={hiddenCount} label="Hidden" color="#87B8F8" />
            <Stat value={cohortSize || 0} label="Cohort size" color="#87B8F8" />
          </div>
        </div>

        <SubmissionsTable initial={submissions} />
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
