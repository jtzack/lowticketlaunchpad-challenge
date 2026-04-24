// Points, streaks, and tier calculations
// Computed at read-time from the submissions array — no separate column needed.

import type { SupabaseClient } from '@supabase/supabase-js'

export type Tier = {
  name: string
  min: number
  max: number | null
  unlock: string
  color: string
}

export const TIERS: Tier[] = [
  {
    name: 'Starter',
    min: 0,
    max: 199,
    unlock: 'Welcome to the challenge.',
    color: '#5F85B6',
  },
  {
    name: 'Builder',
    min: 200,
    max: 449,
    unlock: 'Bonus template pack unlocked.',
    color: '#87B8F8',
  },
  {
    name: 'Launcher',
    min: 450,
    max: 699,
    unlock: 'Featured spot on the showcase.',
    color: '#F9E35D',
  },
  {
    name: 'Master',
    min: 700,
    max: null,
    unlock: 'Discount on the next product launch.',
    color: '#F9E35D',
  },
]

export type Submission = {
  id: string
  user_id: string
  session_id: number
  proof_type: 'link' | 'text'
  proof_url: string | null
  proof_text: string | null
  notes: string | null
  points_awarded: number
  is_public: boolean
  submitted_at: string
}

const STREAK_BONUS_PER_SESSION = 25

/**
 * Compute the streak — number of consecutive sessions completed starting from session 1.
 * Session 1 → 2 → 3 in a row = streak of 3. Skip session 2 = streak of 1.
 */
export function computeStreak(submissions: Submission[]): number {
  const completed = new Set(submissions.map((s) => s.session_id))
  let streak = 0
  for (let i = 1; i <= 6; i++) {
    if (completed.has(i)) streak++
    else break
  }
  return streak
}

/**
 * Compute total points: base (sum of points_awarded) + streak bonus.
 */
export function computeTotalPoints(submissions: Submission[]): number {
  const base = submissions.reduce((sum, s) => sum + (s.points_awarded || 0), 0)
  const streak = computeStreak(submissions)
  const streakBonus = streak * STREAK_BONUS_PER_SESSION
  return base + streakBonus
}

/**
 * Get the current tier for a given points total.
 */
export function getTier(points: number, tiers: Tier[] = TIERS): Tier {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (points >= tiers[i].min) return tiers[i]
  }
  return tiers[0]
}

/**
 * Get the next tier (or null if already at the top).
 */
export function getNextTier(points: number, tiers: Tier[] = TIERS): Tier | null {
  const current = getTier(points, tiers)
  const idx = tiers.findIndex((t) => t.min === current.min)
  return tiers[idx + 1] || null
}

/**
 * Progress percentage towards the next tier (0–100).
 */
export function getProgressToNextTier(
  points: number,
  tiers: Tier[] = TIERS
): number {
  const current = getTier(points, tiers)
  const next = getNextTier(points, tiers)
  if (!next) return 100
  const range = next.min - current.min
  const earned = points - current.min
  return Math.min(100, Math.round((earned / range) * 100))
}

// Admin-editable tier names live in the `tiers` table. Thresholds, colors,
// and unlock copy stay hardcoded in TIERS — we just swap the display name.
// Falls back silently to TIERS if the table is missing or empty.
export async function getTiersFromDb(
  supabase: SupabaseClient
): Promise<Tier[]> {
  try {
    const { data } = await supabase
      .from('tiers')
      .select('rank, name')
      .order('rank', { ascending: true })
    if (!data || data.length === 0) return TIERS
    const byRank = new Map<number, string>(
      data.map((r) => [r.rank, r.name])
    )
    return TIERS.map((t, i) => {
      const rank = i + 1
      const name = byRank.get(rank)
      return name ? { ...t, name } : t
    })
  } catch {
    return TIERS
  }
}
