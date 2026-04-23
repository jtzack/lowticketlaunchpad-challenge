import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { ProofCard } from '@/components/ProofCard'
import { SubmitForm } from './submit-form'
import { MySubmissionCard } from './my-submission-card'
import { getSessionByIdFromDb } from '@/lib/sessions'
import type { Submission } from '@/lib/points'

export const dynamic = 'force-dynamic'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sessionId = parseInt(id, 10)
  if (Number.isNaN(sessionId)) notFound()

  const supabase = await createClient()
  const session = await getSessionByIdFromDb(supabase, sessionId)
  if (!session) notFound()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Has the current user already submitted?
  const { data: mySubmission } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .maybeSingle()

  // Other people's public submissions for this session
  const { data: peerSubmissions } = await supabase
    .from('submissions')
    .select('*, profiles(name)')
    .eq('session_id', sessionId)
    .eq('is_public', true)
    .neq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-8 py-12">
        <Link
          href="/dashboard"
          className="font-sans text-[12px] text-white/40 hover:text-yellow transition uppercase tracking-wider mb-6 inline-block"
        >
          &larr; Dashboard
        </Link>

        {/* Session header */}
        <div className="mb-10">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-3">
            Session {session.number}
          </p>
          <h1 className="font-display text-[clamp(32px,4.5vw,52px)] text-white uppercase leading-[0.95] mb-4">
            {session.title}
          </h1>
          <p className="font-sans text-[15px] text-white/60 leading-relaxed">
            {session.description}
          </p>
        </div>

        {/* Homework prompt */}
        <div className="border-l-4 border-yellow pl-5 mb-10">
          <p className="font-sans text-[11px] font-bold text-yellow uppercase tracking-[0.2em] mb-2">
            Your Homework
          </p>
          <p className="font-sans text-[15px] text-white/80 leading-relaxed">
            {session.homework_prompt}
          </p>
        </div>

        {/* Submission */}
        <div className="mb-12">
          {mySubmission ? (
            <MySubmissionCard
              sessionId={sessionId}
              userId={user.id}
              submission={{
                id: mySubmission.id,
                proof_type: mySubmission.proof_type,
                proof_url: mySubmission.proof_url,
                proof_text: mySubmission.proof_text,
                notes: mySubmission.notes,
              }}
              pointsAwarded={mySubmission.points_awarded}
              submittedAt={mySubmission.submitted_at}
            />
          ) : (
            <SubmitForm sessionId={sessionId} userId={user.id} />
          )}
        </div>

        {/* Peer submissions */}
        {peerSubmissions && peerSubmissions.length > 0 && (
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-4">
              What Others Submitted
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {peerSubmissions.map((sub) => {
                // Supabase join returns profiles as object or array — normalize
                const profile = Array.isArray(sub.profiles)
                  ? sub.profiles[0]
                  : sub.profiles
                return (
                  <ProofCard
                    key={sub.id}
                    submission={sub as Submission}
                    studentName={profile?.name || null}
                  />
                )
              })}
            </div>
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
