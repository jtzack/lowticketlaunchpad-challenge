import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { ProofCard } from '@/components/ProofCard'
import type { Submission } from '@/lib/points'
import { SESSIONS } from '@/lib/sessions'

export const dynamic = 'force-dynamic'

export default async function ShowcasePage() {
  const supabase = await createClient()

  const { data: submissionsData } = await supabase
    .from('submissions')
    .select('*, profiles(name)')
    .eq('is_public', true)
    .order('submitted_at', { ascending: false })
    .limit(60)

  const submissions = submissionsData || []

  // Group counts per session for the filter row
  const countsBySession: Record<number, number> = {}
  for (const s of submissions) {
    countsBySession[s.session_id] = (countsBySession[s.session_id] || 0) + 1
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

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
            templates, products, courses, and outlines that come out of Low-Ticket
            Launchpad LIVE.
          </p>
        </div>

        {/* Session filter row */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SESSIONS.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-dark/30"
            >
              <span className="font-sans text-[10px] font-bold text-blue uppercase tracking-wider">
                Session {s.number}
              </span>
              <span className="font-sans text-[11px] text-white/40">
                {countsBySession[s.id] || 0}
              </span>
            </div>
          ))}
        </div>

        {submissions.length === 0 ? (
          <div className="border border-white/10 rounded-lg p-12 text-center bg-dark/30">
            <p className="font-display text-[24px] text-white uppercase mb-2">
              Nothing Yet
            </p>
            <p className="font-sans text-[14px] text-white/50">
              Be the first to submit. Sign in and complete a session.
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
                />
              )
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="font-sans text-[12px] text-white/30">
          &copy; 2026 Low-Ticket Launchpad. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
