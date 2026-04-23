// Rewards: one per session. Students unlock a reward by submitting that
// session, then "claim" it to reveal the URL (or trigger a visit).

export type Reward = {
  id: number
  session_id: number
  title: string
  description: string | null
  url: string | null
  updated_at?: string
}

export type RewardClaim = {
  user_id: string
  reward_id: number
  claimed_at: string
}

export type RewardStatus = 'claimed' | 'unlocked' | 'locked'

export type RewardWithStatus = Reward & {
  status: RewardStatus
  claimed_at: string | null
}

// Default reward metadata (matches the seed). Used as a client-side fallback
// when the `rewards` table hasn't been seeded yet.
export const DEFAULT_REWARDS: Reward[] = [
  { id: 1, session_id: 1, title: 'Idea Validation Toolkit',    description: 'Templates + tweet scripts for validating problems fast.',                 url: null },
  { id: 2, session_id: 2, title: 'Template Starter Pack',      description: '3 proven $99 template skeletons from LTL alumni.',                         url: null },
  { id: 3, session_id: 3, title: 'Launch Checklist + Stack',   description: 'Pre-flight checklist + vetted tech stack for going live.',                 url: null },
  { id: 4, session_id: 4, title: 'Offer Stack Blueprint',      description: 'Bonus-stacking framework to turn $99 → $350.',                             url: null },
  { id: 5, session_id: 5, title: 'AI Course Prompt Library',   description: '20 prompts to go from blank page to full course outline.',                url: null },
  { id: 6, session_id: 6, title: 'Evergreen Marketing Swipes', description: 'Ready-to-customize launch emails + social templates.',                    url: null },
]

export function statusFor(
  reward: Reward,
  completedSessionIds: Set<number>,
  claimedRewardIds: Set<number>
): RewardStatus {
  if (claimedRewardIds.has(reward.id)) return 'claimed'
  if (completedSessionIds.has(reward.session_id)) return 'unlocked'
  return 'locked'
}
