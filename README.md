# The Launchpad Challenge

A 6-session accountability app for **Low-Ticket Launchpad LIVE** students. Submit proof of completed homework, earn points, climb tiers, and see what other students are building on the public showcase.

Built with Next.js 16 (App Router), Supabase, and Tailwind v4.

## Features

- **Magic link auth** — no passwords, students sign in with email
- **Personal dashboard** — pipeline of 6 sessions with status (locked / active / submitted)
- **Submit proof** — link or text paste per homework
- **Auto-verified** — instant points on submit
- **Tier system** — Starter → Builder → Launcher → Master with point thresholds and unlock rewards
- **Streak bonuses** — +25 points per consecutive session completed
- **Public showcase** — see all students' submissions filterable by session
- **Leaderboard** — ranked by total points
- **Admin view** — table of all submissions, gated by `ADMIN_EMAILS` env var

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 (`@theme` directive in CSS)
- Supabase (Postgres + Auth + RLS)
- Fjalla One + Inter via `next/font/google`
- Deploys to Vercel

## Setup

### 1. Clone and install

```bash
git clone https://github.com/jtzack/lowticketlaunchpad-challenge.git
cd lowticketlaunchpad-challenge
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **SQL Editor**, paste the contents of `supabase/seed.sql` and run it. This creates the tables, RLS policies, the `handle_new_user` trigger, and seeds the 6 sessions.
3. Go to **Authentication → URL Configuration** and add your local + production URLs to "Redirect URLs":
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=you@example.com,partner@example.com
```

Find your URL + anon key in Supabase under **Settings → API**.

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Landing + magic link sign-in |
| `/dashboard` | Required | Student's personal pipeline + stats |
| `/session/[id]` | Required | Session detail + submit form + peer submissions |
| `/showcase` | Public | Grid of all public submissions |
| `/leaderboard` | Public | Ranked list of students by points |
| `/admin` | Email-gated | All submissions table |
| `/auth/callback` | — | Supabase magic link handler |

## Points System

- **Base:** 100 points per submission
- **Streak bonus:** +25 points per consecutive completed session (computed at read-time)
- **Tiers:**
  - 0–199 → **Starter**
  - 200–449 → **Builder** (bonus template pack)
  - 450–699 → **Launcher** (featured spot on showcase)
  - 700+ → **Master** (discount on next product)

Points and tiers are computed in `lib/points.ts` — no separate columns to maintain.

## Deploying to Vercel

1. Push to GitHub (already done — repo is `jtzack/lowticketlaunchpad-challenge`)
2. Import the project into Vercel
3. Add the same environment variables from `.env.local` in the Vercel dashboard
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain
5. Add the production redirect URL to Supabase auth settings
6. Deploy

## File Structure

```
.
├── app/
│   ├── layout.tsx              # Root layout, fonts
│   ├── globals.css             # Tailwind v4 + brand tokens
│   ├── page.tsx                # Landing + magic link
│   ├── login-form.tsx          # Client component
│   ├── auth/callback/route.ts  # Magic link handler
│   ├── dashboard/page.tsx      # Student dashboard
│   ├── session/[id]/
│   │   ├── page.tsx            # Session detail
│   │   └── submit-form.tsx     # Submit form (client)
│   ├── showcase/page.tsx       # Public showcase
│   ├── leaderboard/page.tsx    # Leaderboard
│   └── admin/page.tsx          # Admin table
├── components/
│   ├── BrandHeader.tsx
│   ├── SessionCard.tsx
│   ├── TierBadge.tsx
│   └── ProofCard.tsx
├── lib/
│   ├── sessions.ts             # Hardcoded session metadata
│   ├── points.ts               # Tier + streak math
│   └── supabase/
│       ├── client.ts           # Browser client
│       └── server.ts           # Server client
├── proxy.ts                    # Auth session refresh (was middleware in older Next)
├── supabase/
│   └── seed.sql                # Schema + RLS + 6 sessions
└── .env.local.example
```
