// Points scoring for submissions.
// Two axes multiplied together:
//   1. Base points by submission quality (URL + notes ≥ URL alone ≥ text).
//   2. Time decay: 10% per calendar day late (UTC), floor at 50%.
// Kept as pure functions so the client submit form can show a live preview
// and the server action can enforce the same number on insert/update.

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const MAX_POINTS = 100
export const MIN_MULTIPLIER = 0.5
export const DAILY_DECAY = 0.1

export type ScoringInput = {
  hasUrl: boolean
  hasNotes: boolean
  submittedAt: Date | string
  dueAt: Date | string | null
}

export type ScoringBreakdown = {
  base: number
  baseReason: string
  daysLate: number
  multiplier: number
  total: number
}

function toUtcDayNumber(d: Date): number {
  return Math.floor(d.getTime() / MS_PER_DAY)
}

function baseForProof(hasUrl: boolean, hasNotes: boolean) {
  if (hasUrl) {
    return hasNotes
      ? { points: 100, reason: 'Link + notes' }
      : { points: 90, reason: 'Link only (add notes for +10)' }
  }
  if (hasNotes) {
    return { points: 80, reason: 'Notes only (add a link for +10)' }
  }
  return { points: 0, reason: 'Add a link or notes to submit' }
}

function asDate(value: Date | string): Date {
  return typeof value === 'string' ? new Date(value) : value
}

export function computePointsBreakdown(input: ScoringInput): ScoringBreakdown {
  const base = baseForProof(input.hasUrl, input.hasNotes)
  let daysLate = 0
  if (input.dueAt) {
    const due = asDate(input.dueAt)
    const submitted = asDate(input.submittedAt)
    if (!Number.isNaN(due.getTime()) && !Number.isNaN(submitted.getTime())) {
      daysLate = Math.max(0, toUtcDayNumber(submitted) - toUtcDayNumber(due))
    }
  }
  const multiplier = daysLate > 0
    ? Math.max(MIN_MULTIPLIER, 1 - DAILY_DECAY * daysLate)
    : 1
  const total = Math.max(0, Math.round(base.points * multiplier))
  return {
    base: base.points,
    baseReason: base.reason,
    daysLate,
    multiplier,
    total,
  }
}

export function computePoints(input: ScoringInput): number {
  return computePointsBreakdown(input).total
}
