-- =================================================================
-- PHASE 5: MEDIA (images/videos), BLOGS, TRAVEL MAP
-- Run in Supabase Dashboard -> SQL Editor
-- =================================================================

-- 1. Profiles get an avatar --------------------------------------
alter table public.profiles add column avatar_url text;

-- 2. Travels get map coordinates ---------------------------------
alter table public.travels add column lat double precision;
alter table public.travels add column lng double precision;

-- 3. Media table (photos + short videos) -------------------------
-- LESSON: files do NOT go in the database. They go to Supabase
-- STORAGE (a file service); the table only stores the URL + path
-- so we can list and delete them. Rule of thumb: databases hold
-- data, storage holds files.
create table public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  url text not null,
  path text not null,       -- storage path, needed for deletion
  caption text,
  created_at timestamptz default now()
);

-- 4. Blogs table --------------------------------------------------
create table public.blogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  -- blogs are searchable, same pattern as phase 3
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored
);
create index blogs_fts_idx on public.blogs using gin (fts);

-- 5. RLS for both new tables (same pattern as phase 2) ------------
do $$
declare
  t text;
begin
  foreach t in array array['media', 'blogs']
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

-- 6. Storage bucket + its own security policies -------------------
-- LESSON: storage has RLS too, on the storage.objects table.
-- Files are uploaded to paths like "<user_id>/photo.jpg";
-- storage.foldername(name)[1] extracts that first folder, so
-- "only write inside a folder named after your own user id".
insert into storage.buckets (id, name, public) values ('media', 'media', true);

create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Users upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 7. Search v2: now also searches blogs, returns avatars ----------
-- (drop first: the return type is changing)
drop function if exists public.search_directory(text);

create function public.search_directory(term text)
returns table (
  id uuid,
  username text,
  full_name text,
  bio text,
  avatar_url text,
  rank real,
  matched_in text[]
)
language sql
stable
as $$
  with q as (
    select websearch_to_tsquery('english', term) as query
  ),
  hits as (
    select p.id as user_id, ts_rank(p.fts, q.query) as r, 'profile' as src
      from public.profiles p, q where p.fts @@ q.query
    union all
    select h.user_id, ts_rank(h.fts, q.query), 'hobbies'
      from public.hobbies h, q where h.fts @@ q.query
    union all
    select j.user_id, ts_rank(j.fts, q.query), 'jobs'
      from public.jobs j, q where j.fts @@ q.query
    union all
    select t.user_id, ts_rank(t.fts, q.query), 'travel'
      from public.travels t, q where t.fts @@ q.query
    union all
    select pr.user_id, ts_rank(pr.fts, q.query), 'projects'
      from public.projects pr, q where pr.fts @@ q.query
    union all
    select b.user_id, ts_rank(b.fts, q.query), 'blogs'
      from public.blogs b, q where b.fts @@ q.query
  )
  select p.id, p.username, p.full_name, p.bio, p.avatar_url,
         sum(hits.r)::real as rank,
         array_agg(distinct hits.src) as matched_in
  from hits
  join public.profiles p on p.id = hits.user_id
  group by p.id, p.username, p.full_name, p.bio, p.avatar_url
  order by rank desc
  limit 20;
$$;
