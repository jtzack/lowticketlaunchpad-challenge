// Hardcoded session data — used for static rendering and fallback
// Source of truth lives in Supabase, but this matches the seed.

export type SessionInfo = {
  id: number
  number: number
  title: string
  description: string
  homework_prompt: string
  points_value: number
  due_at?: string | null
  opens_at?: string | null
}

// Short tag shown on chips/cards — VALIDATE, BUILD, SHIP, OFFER, OUTLINE, LAUNCH
export const SESSION_TAGS: Record<number, string> = {
  1: 'VALIDATE',
  2: 'BUILD',
  3: 'SHIP',
  4: 'OFFER',
  5: 'OUTLINE',
  6: 'LAUNCH',
}

export const SESSIONS: SessionInfo[] = [
  {
    id: 1,
    number: 1,
    title: 'How To Make Your First $1 Online',
    description:
      'Stop overthinking and start selling. Identify a profitable problem your audience needs solved.',
    homework_prompt:
      'Extract one validated problem your target reader needs help solving. Submit a clear one-sentence statement of the problem and a link or paste of where you found the signal.',
    points_value: 100,
  },
  {
    id: 2,
    number: 2,
    title: 'Building A "Template" Worth $99',
    description:
      'Take the problem you identified and turn it into a simple, actionable template your audience will pay for.',
    homework_prompt:
      'Build a $99 digital template that solves the problem from Session 1. Submit a link to the template or paste the outline.',
    points_value: 100,
  },
  {
    id: 3,
    number: 3,
    title: 'Tech Stack & Going Live',
    description:
      'Get your product listed, your checkout working, and your first marketing assets in place.',
    homework_prompt:
      'Put your $99 template up for sale. Submit the live product link plus one piece of marketing you\u2019ve deployed.',
    points_value: 100,
  },
  {
    id: 4,
    number: 4,
    title: 'Offer Creation & Bonus Bundling',
    description:
      'Turn the problem from your $99 template into a full digital course with an irresistible offer stack.',
    homework_prompt:
      'Submit your $350 course concept with a complete offer stack: main course, bonuses, and one-liner pitch.',
    points_value: 100,
  },
  {
    id: 5,
    number: 5,
    title: 'Outline Your Course In 1 Hour',
    description:
      'Use a proven AI-assisted framework to go from a blank page to a full course outline in a single session.',
    homework_prompt:
      'Submit your complete course outline \u2014 every module and lesson mapped. Paste the outline or link to the doc.',
    points_value: 100,
  },
  {
    id: 6,
    number: 6,
    title: 'Evergreen Marketing & Launch',
    description:
      'Build the system that keeps your products selling long after launch day.',
    homework_prompt:
      'Submit your evergreen marketing strategy and revenue tracking setup. Include traffic plan, email opt-in flow, and KPI tracking sheet.',
    points_value: 100,
  },
]

export function getSessionById(id: number): SessionInfo | undefined {
  return SESSIONS.find((s) => s.id === id)
}
