import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type NavKey = 'dashboard' | 'showcase' | 'leaderboard' | 'rewards' | 'admin'

type NavItem = { key: NavKey; href: string; label: string }

const NAV: NavItem[] = [
  { key: 'dashboard',   href: '/dashboard',   label: 'Dashboard' },
  { key: 'showcase',    href: '/showcase',    label: 'Showcase' },
  { key: 'leaderboard', href: '/leaderboard', label: 'Leaderboard' },
  { key: 'rewards',     href: '/rewards',     label: 'Rewards' },
]

export async function BrandHeader({
  active,
  points,
  initials,
}: {
  active?: NavKey
  points?: number
  initials?: string
} = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = Boolean(user)

  return (
    <header className="border-b border-white/10 bg-black">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-blue group-hover:fill-yellow transition"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-display text-[15px] uppercase tracking-[0.05em] text-white whitespace-nowrap">
            The Launchpad <span className="text-yellow">Challenge</span>
          </span>
        </Link>
        {isLoggedIn && (
          <nav className="flex items-center gap-5 md:gap-7">
            {NAV.map((item) => {
              const on = active === item.key
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`font-sans text-[13px] uppercase tracking-wider transition ${
                    on
                      ? 'text-yellow'
                      : 'text-white/60 hover:text-yellow'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {typeof points === 'number' && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-yellow/40 bg-yellow/10 text-yellow font-sans text-[11px] font-bold uppercase tracking-wider">
              ★ {points} pts
            </span>
          )}
          {initials && (
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/15 flex items-center justify-center font-display text-[12px] text-white uppercase">
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
