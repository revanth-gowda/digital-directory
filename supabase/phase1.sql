-- =================================================================
-- PHASE 1 DATABASE SETUP
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- =================================================================

-- LESSON: Supabase stores login credentials in a hidden, managed
-- table (auth.users). You never touch it directly. Instead, you
-- create a public "profiles" table that mirrors it 1-to-1 and holds
-- everything ELSE about a user (name, bio, and later: hobbies, jobs...).

create table public.profiles (
  -- Same id as auth.users. "references" makes it a foreign key;
  -- "on delete cascade" = if the auth user is deleted, delete the profile too.
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  bio text,
  created_at timestamptz default now()
);

-- LESSON: Row Level Security (RLS) is THE most important Supabase concept.
-- Your anon key ships to every browser, so the DATABASE must enforce
-- who can read/write what. Without RLS, anyone could edit anyone's data.
alter table public.profiles enable row level security;

-- Policy 1: anyone logged in can VIEW all profiles (it's a directory!)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Policy 2: you can only INSERT a profile whose id matches YOUR user id
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Policy 3: you can only UPDATE your own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id);

-- LESSON: A trigger = code the database runs automatically.
-- This one creates a profile row the moment someone signs up,
-- so you never have "users without profiles".
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
