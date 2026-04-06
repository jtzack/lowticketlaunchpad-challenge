import Link from 'next/link'

export function BrandHeader() {
  return (
    <header className="border-b border-white/10 bg-black">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-blue group-hover:fill-yellow transition"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="font-display text-[15px] uppercase tracking-[0.05em] text-white">
            The Launchpad <span className="text-yellow">Challenge</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 md:gap-7">
          <Link
            href="/dashboard"
            className="font-sans text-[13px] text-white/60 hover:text-yellow transition uppercase tracking-wider"
          >
            Dashboard
          </Link>
          <Link
            href="/showcase"
            className="font-sans text-[13px] text-white/60 hover:text-yellow transition uppercase tracking-wider"
          >
            Showcase
          </Link>
          <Link
            href="/leaderboard"
            className="font-sans text-[13px] text-white/60 hover:text-yellow transition uppercase tracking-wider"
          >
            Leaderboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
