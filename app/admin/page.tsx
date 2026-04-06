import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import type { Submission } from '@/lib/points'
import { getSessionById } from '@/lib/sessions'

export const dynamic = 'force-dynamic'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (!isAdmin(user.email)) {
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

  // Pull all submissions with profile + counts
  const { data: subs } = await supabase
    .from('submissions')
    .select('*, profiles(name, email)')
    .order('submitted_at', { ascending: false })
    .limit(200)

  const submissions = subs || []

  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
        <div className="mb-10">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
            Admin
          </p>
          <h1 className="font-display text-[clamp(36px,5vw,56px)] text-white uppercase leading-[0.95]">
            All Submissions
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          <StatBlock label="Total Students" value={String(totalStudents || 0)} />
          <StatBlock label="Total Submissions" value={String(submissions.length)} />
          <StatBlock
            label="Avg / Student"
            value={
              totalStudents && totalStudents > 0
                ? (submissions.length / totalStudents).toFixed(1)
                : '0'
            }
          />
        </div>

        <div className="border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark/50 border-b border-white/10">
              <tr>
                <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-left px-4 py-3">
                  Date
                </th>
                <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-left px-4 py-3">
                  Student
                </th>
                <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-left px-4 py-3">
                  Session
                </th>
                <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-left px-4 py-3">
                  Proof
                </th>
                <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-right px-4 py-3">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center font-sans text-[14px] text-white/40"
                  >
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const profile = Array.isArray(sub.profiles)
                    ? sub.profiles[0]
                    : sub.profiles
                  const session = getSessionById(sub.session_id)
                  const date = new Date(sub.submitted_at).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric' }
                  )
                  const typedSub = sub as Submission
                  return (
                    <tr
                      key={typedSub.id}
                      className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-sans text-[12px] text-white/40">
                        {date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-sans text-[13px] text-white">
                          {profile?.name || 'Anonymous'}
                        </div>
                        <div className="font-sans text-[11px] text-white/40">
                          {profile?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-sans text-[12px] text-blue">
                          #{typedSub.session_id}
                        </span>
                        <div className="font-sans text-[11px] text-white/40">
                          {session?.title.slice(0, 28)}...
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {typedSub.proof_type === 'link' && typedSub.proof_url ? (
                          <a
                            href={typedSub.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-[12px] text-blue hover:text-yellow underline truncate block"
                          >
                            {typedSub.proof_url}
                          </a>
                        ) : (
                          <span className="font-sans text-[12px] text-white/60 truncate block">
                            {typedSub.proof_text?.slice(0, 60)}...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-sans text-[13px] text-yellow font-bold">
                          {typedSub.points_awarded}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="font-sans text-[12px] text-white/30">
          &copy; 2026 Low-Ticket Launchpad. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 rounded-lg p-5 bg-dark/30">
      <div className="font-display text-[28px] text-white leading-none">
        {value}
      </div>
      <div className="font-sans text-[10px] text-white/40 uppercase tracking-wider mt-2">
        {label}
      </div>
    </div>
  )
}
