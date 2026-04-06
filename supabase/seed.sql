-- ═══════════════════════════════════════════════════════════
-- The Launchpad Challenge — Schema + Seed Data
-- Run this in your Supabase SQL Editor (one time)
-- ═══════════════════════════════════════════════════════════

-- ─── Profiles (linked to auth.users) ───
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- ─── Sessions (6 hardcoded) ───
create table if not exists public.sessions (
  id int primary key,
  number int not null,
  title text not null,
  description text not null,
  homework_prompt text not null,
  points_value int default 100
);

-- ─── Submissions ───
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id int references public.sessions(id) not null,
  proof_type text check (proof_type in ('link', 'text')) not null,
  proof_url text,
  proof_text text,
  notes text,
  points_awarded int default 100,
  is_public boolean default true,
  submitted_at timestamptz default now(),
  unique (user_id, session_id)
);

create index if not exists submissions_user_idx on public.submissions(user_id);
create index if not exists submissions_session_idx on public.submissions(session_id);

-- ─── Row Level Security ───
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.submissions enable row level security;

-- Profiles: anyone can read (for public showcase / leaderboard names),
-- only the owner can insert/update their own
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Sessions: read-only for everyone
drop policy if exists "Sessions are viewable by everyone" on public.sessions;
create policy "Sessions are viewable by everyone"
  on public.sessions for select
  using (true);

-- Submissions: public ones viewable by everyone, owner can manage their own
drop policy if exists "Public submissions viewable by everyone" on public.submissions;
create policy "Public submissions viewable by everyone"
  on public.submissions for select
  using (is_public = true OR auth.uid() = user_id);

drop policy if exists "Users can insert own submissions" on public.submissions;
create policy "Users can insert own submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own submissions" on public.submissions;
create policy "Users can update own submissions"
  on public.submissions for update
  using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ───
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- Seed: 6 Sessions
-- ═══════════════════════════════════════════════════════════

insert into public.sessions (id, number, title, description, homework_prompt, points_value) values
  (1, 1, 'How To Make Your First $1 Online',
   'Stop overthinking and start selling. Identify a profitable problem your audience needs solved — and why the first dollar is the hardest and most important one you''ll ever make.',
   'Extract one validated problem your target reader needs help solving. Use existing content (posts, newsletters, threads) or the prompt provided in the session. Submit a clear one-sentence statement of the problem and a link or paste of where you found the signal.',
   100),
  (2, 2, 'Building A "Template" Worth $99',
   'Take the problem you identified and turn it into a simple, actionable template your audience will pay for. No courses, no ebooks — just a clean deliverable.',
   'Build a $99 digital template that solves the problem from Session 1. Submit a link to the template (Google Doc, Notion, Figma, or wherever it lives) or paste the outline.',
   100),
  (3, 3, 'Tech Stack & Going Live',
   'Get your product listed, your checkout working, and your first marketing assets in place. Pin it to your social profiles, set up your evergreen CTA, and send the launch.',
   'Put your $99 template up for sale. Submit the live product link (Gumroad, Stripe, Lemonsqueezy, etc.) plus one piece of marketing you''ve deployed (pinned post, email, etc.).',
   100),
  (4, 4, 'Offer Creation & Bonus Bundling',
   'Turn the problem from your $99 template into a full digital course. Stack bonuses, create irresistible offers, and price your course so it feels like a no-brainer.',
   'Submit your $350 course concept with a complete offer stack: main course, bonuses, and one-liner pitch. Paste the offer or link to the doc.',
   100),
  (5, 5, 'Outline Your Course In 1 Hour',
   'Use a proven AI-assisted framework to go from a blank page to a full course outline in a single session.',
   'Submit your complete course outline — every module and lesson mapped. Paste the outline or link to the doc.',
   100),
  (6, 6, 'Evergreen Marketing & Launch',
   'Build the system that keeps your products selling long after launch day.',
   'Submit your evergreen marketing strategy and revenue tracking setup. Include your traffic plan, email opt-in flow, and KPI tracking sheet.',
   100)
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      homework_prompt = excluded.homework_prompt;
