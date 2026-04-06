import { BrandHeader } from '@/components/BrandHeader'
import { LoginForm } from './login-form'
import { SESSIONS } from '@/lib/sessions'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader />

      <main className="flex-1 flex items-center justify-center px-5 py-16 md:py-24">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-4">
              For Low-Ticket Launchpad LIVE Students
            </p>
            <h1 className="font-display text-[clamp(40px,6vw,72px)] text-white uppercase leading-[0.95] tracking-tight mb-6">
              Build It. Ship It.<br />
              <span className="text-yellow">Earn Points.</span>
            </h1>
            <p className="font-sans text-[16px] text-white/55 leading-relaxed max-w-[520px] mx-auto">
              6 sessions. 6 deliverables. Submit proof, earn points, and unlock
              tier rewards as you build and sell your first $350 digital product.
            </p>
          </div>

          {/* Login form */}
          <div className="max-w-md mx-auto mb-16">
            <LoginForm />
          </div>

          {/* Mini pipeline preview */}
          <div className="border-t border-white/10 pt-10">
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-6 text-center">
              The 6 Challenges
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SESSIONS.map((s) => (
                <div
                  key={s.id}
                  className="border border-white/10 rounded-lg p-4 bg-dark/50"
                >
                  <span className="font-sans text-[10px] font-bold text-yellow uppercase tracking-wider">
                    Session {s.number}
                  </span>
                  <p className="font-display text-[14px] text-white uppercase mt-1 leading-tight">
                    {s.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center">
        <p className="font-sans text-[12px] text-white/30">
          &copy; 2026 Low-Ticket Launchpad. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
