import { createClient } from '@/lib/supabase/server'
import { BrandHeader } from '@/components/BrandHeader'
import { TierBadge } from '@/components/TierBadge'
import { computeStreak, computeTotalPoints, type Submission } from '@/lib/points'

export const dynamic = 'force-dynamic'

type LeaderboardRow = {
  user_id: string
  name: string | null
  total_points: number
  submissions_count: number
  streak: number
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Pull all public submissions joined to profiles
  const { data: subs } = await supabase
    .from('submissions')
    .select('*, profiles(name)')
    .eq('is_public', true)

  // Aggregate by user
  const byUser = new Map<
    string,
    { name: string | null; submissions: Submission[] }
  >()

  for (const sub of subs || []) {
    const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles
    const existing = byUser.get(sub.user_id)
    if (existing) {
      existing.submissions.push(sub as Submission)
    } else {
      byUser.set(sub.user_id, {
        name: profile?.name || null,
        submissions: [sub as Submission],
      })
    }
  }

  const rows: LeaderboardRow[] = Array.from(byUser.entries())
    .map(([user_id, { name, submissions }]) => ({
      user_id,
      name,
      total_points: computeTotalPoints(submissions),
      submissions_count: submissions.length,
      streak: computeStreak(submissions),
    }))
    .sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-8 py-12">
        <div className="mb-10">
          <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-2">
            Top Builders
          </p>
          <h1 className="font-display text-[clamp(36px,5vw,56px)] text-white uppercase leading-[0.95]">
            Leaderboard
          </h1>
          <p className="font-sans text-[15px] text-white/55 mt-3">
            Ranked by total points (base + streak bonus).
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="border border-white/10 rounded-lg p-12 text-center bg-dark/30">
            <p className="font-display text-[24px] text-white uppercase mb-2">
              No Rankings Yet
            </p>
            <p className="font-sans text-[14px] text-white/50">
              Be the first to submit and claim the top spot.
            </p>
          </div>
        ) : (
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark/50 border-b border-white/10">
                <tr>
                  <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-left px-4 py-3">
                    Rank
                  </th>
                  <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-left px-4 py-3">
                    Builder
                  </th>
                  <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-center px-4 py-3 hidden md:table-cell">
                    Sessions
                  </th>
                  <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-center px-4 py-3 hidden md:table-cell">
                    Streak
                  </th>
                  <th className="font-sans text-[10px] font-bold text-white/40 uppercase tracking-wider text-right px-4 py-3">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.user_id}
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`font-display text-[20px] ${
                          i === 0
                            ? 'text-yellow'
                            : i < 3
                              ? 'text-blue'
                              : 'text-white/40'
                        }`}
                      >
                        #{i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-[14px] text-white">
                          {row.name || 'Anonymous'}
                        </span>
                        <TierBadge points={row.total_points} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center hidden md:table-cell font-sans text-[13px] text-white/60">
                      {row.submissions_count} / 6
                    </td>
                    <td className="px-4 py-4 text-center hidden md:table-cell font-sans text-[13px] text-white/60">
                      {row.streak}&times;
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-display text-[20px] text-yellow">
                        {row.total_points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
