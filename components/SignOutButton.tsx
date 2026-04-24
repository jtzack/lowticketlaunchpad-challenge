import { signOut } from '@/app/auth/actions'

// Progressive-enhancement form: works without JS and doesn't need to become
// a client component. Styling matches the small muted links elsewhere in
// the header (Exit admin, etc.).
export function SignOutButton() {
  return (
    <form action={signOut} className="inline-flex">
      <button
        type="submit"
        className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/50 hover:text-yellow transition border border-white/15 hover:border-yellow/50 rounded-full px-3 py-1.5"
      >
        Sign out
      </button>
    </form>
  )
}
