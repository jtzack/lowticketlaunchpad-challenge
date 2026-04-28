// Display name resolution shared across the showcase, leaderboard, admin
// table, and any other place a student's row appears for someone else.
// Order: their saved name → the email prefix → "Anonymous" as last resort.
export function displayNameOf(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmed = name?.trim()
  if (trimmed) return trimmed
  if (email) {
    const prefix = email.split('@')[0]?.trim()
    if (prefix) return prefix
  }
  return 'Anonymous'
}
