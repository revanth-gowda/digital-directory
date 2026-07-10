-- =================================================================
-- PHASE 2: PROFILE DATA TABLES
-- Run in Supabase Dashboard -> SQL Editor (same as phase 1)
-- =================================================================

-- LESSON: Relational design. Instead of cramming hobbies/jobs/travel
-- into one giant profiles row, each gets its OWN table where every
-- row "belongs" to a user via user_id. This is a one-to-many
-- relationship: one user -> many hobbies. It scales, and later
-- lets us search each type independently.

create table public.hobbies (
  -- gen_random_uuid() = database generates the id for you
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  detail text,          -- e.g. "playing 5 years, tournament level"
  created_at timestamptz default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  company text,
  detail text,          -- e.g. "2021-2024, led a team of 3"
  created_at timestamptz default now()
);

create table public.travels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place text not null,  -- e.g. "Tokyo, Japan"
  detail text,          -- e.g. "3 months in 2023, food tour"
  created_at timestamptz default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  detail text,          -- what it does / tech used
  url text,
  created_at timestamptz default now()
);

-- LESSON: Same RLS pattern as profiles, now for 4 tables.
-- Everyone logged in can READ (it's a directory).
-- Only the owner can INSERT / UPDATE / DELETE their rows.
-- A do-block loops so we don't paste the same policy 16 times.
do $$
declare
  t text;
begin
  foreach t in array array['hobbies', 'jobs', 'travels', 'projects']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Viewable by authenticated" on public.%I
       for select to authenticated using (true)', t);
    execute format(
      'create policy "Insert own rows" on public.%I
       for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "Update own rows" on public.%I
       for update to authenticated using ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "Delete own rows" on public.%I
       for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
