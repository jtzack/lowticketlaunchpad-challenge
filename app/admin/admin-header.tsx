import Link from 'next/link'

type Tab = 'showcase' | 'sessions' | 'rewards'

const TABS: { key: Tab; href: string; label: string }[] = [
  { key: 'showcase', href: '/admin',          label: 'Showcase' },
  { key: 'sessions', href: '/admin/sessions', label: 'Sessions' },
  { key: 'rewards',  href: '/admin/rewards',  label: 'Rewards' },
]

export function AdminHeader({
  tab,
  adminEmail,
}: {
  tab: Tab
  adminEmail: string
}) {
  const initials = adminEmail.slice(0, 2).toUpperCase()
  return (
    <header className="border-b border-white/10 bg-black">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between gap-4">
        <Link href="/admin" className="flex items-center gap-3 group shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-yellow"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-display text-[15px] uppercase tracking-[0.05em] text-white whitespace-nowrap">
            Launchpad <span className="text-yellow">Admin</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 md:gap-7">
          {TABS.map((t) => {
            const on = tab === t.key
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`font-sans text-[13px] uppercase tracking-wider transition ${
                  on ? 'text-yellow' : 'text-white/60 hover:text-yellow'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 hover:text-yellow transition border border-white/15 hover:border-yellow/50 rounded-full px-3 py-1.5"
          >
            ← Exit admin
          </Link>
          <span className="hidden md:inline font-sans text-[11px] text-white/40 uppercase tracking-[0.12em]">
            Admin · {initials}
          </span>
          <div className="w-7 h-7 rounded-full bg-yellow text-black flex items-center justify-center font-display text-[12px] uppercase">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
