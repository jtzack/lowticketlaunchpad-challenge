import { BrandHeader } from '@/components/BrandHeader'
import { LoginForm } from './login-form'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <BrandHeader />

      <main className="flex-1 relative overflow-hidden">
        {/* Ascending brand chart line — brand signature */}
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-[55%] h-full opacity-[0.22] pointer-events-none"
        >
          <polyline
            points="0,360 120,280 200,330 360,180 500,240 680,120 820,160 1000,30"
            fill="none"
            stroke="#87B8F8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="relative max-w-6xl mx-auto w-full px-5 md:px-8 py-16 md:py-20 grid gap-12 lg:gap-16 lg:grid-cols-[1.35fr_1fr] items-center">
          {/* Left: headline + meta */}
          <div>
            <p className="font-sans text-[11px] font-bold text-blue uppercase tracking-[0.2em] mb-5">
              For Low-Ticket Launchpad LIVE Students
            </p>
            <h1 className="font-display text-[clamp(56px,9vw,92px)] text-white uppercase leading-[0.95] tracking-tight">
              Build it.
              <br />
              Ship it.
              <br />
              <span className="text-yellow">Earn points.</span>
            </h1>
            <p className="font-sans text-[16px] text-white/55 leading-[1.55] max-w-[520px] mt-6">
              Six sessions. Six deliverables. Submit proof of the work, climb
              the tiers, and finish with a shipped $350 digital product.
            </p>

            <dl className="flex flex-wrap gap-6 md:gap-8 mt-8 font-sans text-[12px] text-white/40 uppercase tracking-[0.12em]">
              <div>
                <span className="text-yellow font-display text-[14px] mr-1.5">
                  6
                </span>
                Sessions
              </div>
              <div>
                <span className="text-yellow font-display text-[14px] mr-1.5">
                  6
                </span>
                Tier rewards
              </div>
              <div>
                <span className="text-yellow font-display text-[14px] mr-1.5">
                  1
                </span>
                Shipped product
              </div>
            </dl>
          </div>

          {/* Right: sign-in card + single proof */}
          <div className="w-full max-w-md lg:max-w-none lg:w-auto mx-auto lg:mx-0">
            <LoginForm />

            <div className="mt-5 rounded-xl border border-white/10 bg-blue/[0.04] p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-yellow/15 border border-yellow/40 text-yellow flex items-center justify-center font-display text-[13px]">
                  MG
                </div>
                <div>
                  <div className="font-sans text-[13px] font-semibold text-white">
                    Maya G.
                  </div>
                  <div className="font-mono text-[10px] text-white/40 tracking-[0.1em]">
                    SHIPPED DAY 9 · $4,200 WEEKEND
                  </div>
                </div>
              </div>
              <p className="font-sans text-[13px] text-white/60 leading-[1.45]">
                &ldquo;I finally stopped rewriting and actually shipped. The
                accountability is the whole product.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-5 text-center">
        <p className="font-sans text-[11px] text-white/30">
          © 2026 Low-Ticket Launchpad · Low-Ticket Launchpad LIVE
        </p>
      </footer>
    </div>
  )
}
