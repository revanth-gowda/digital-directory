-- =================================================================
-- PHASE 3: FULL-TEXT SEARCH ENGINE
-- Run in Supabase Dashboard -> SQL Editor
-- =================================================================

-- LESSON: Why not just `WHERE name LIKE '%gaming%'`?
-- LIKE scans every row (slow at scale) and can't rank results or
-- match word variants (gamer/gaming). Postgres full-text search:
--   tsvector = a text column pre-chopped into searchable words
--   tsquery  = the parsed search input
--   GIN index = a word -> rows lookup table, like a book index.
-- Result: millisecond search over millions of rows. This is the
-- same tech many "search startups" charge for.

-- "generated always as ... stored" = Postgres keeps the tsvector
-- up to date automatically on every insert/update. Zero app code.
alter table public.profiles add column fts tsvector
  generated always as (
    to_tsvector('english',
      coalesce(username, '') || ' ' || coalesce(full_name, '') || ' ' || coalesce(bio, ''))
  ) stored;

alter table public.hobbies add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(detail, ''))
  ) stored;

alter table public.jobs add column fts tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(detail, ''))
  ) stored;

alter table public.travels add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(place, '') || ' ' || coalesce(detail, ''))
  ) stored;

alter table public.projects add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(detail, ''))
  ) stored;

-- The GIN indexes: this is what makes search "blazing fast"
create index profiles_fts_idx on public.profiles using gin (fts);
create index hobbies_fts_idx  on public.hobbies  using gin (fts);
create index jobs_fts_idx     on public.jobs     using gin (fts);
create index travels_fts_idx  on public.travels  using gin (fts);
create index projects_fts_idx on public.projects using gin (fts);

-- LESSON: An RPC function = custom SQL your app calls like an API
-- endpoint: supabase.rpc('search_directory', { term: 'gaming' }).
-- It searches all 5 tables, merges hits per user, sums the
-- relevance scores, and says WHERE each match came from.
create or replace function public.search_directory(term text)
returns table (
  id uuid,
  username text,
  full_name text,
  bio text,
  rank real,
  matched_in text[]
)
language sql
stable  -- promises "no data changes", lets Postgres optimize
as $$
  with q as (
    -- websearch_to_tsquery understands human input:
    -- "gaming tokyo" = both words, "chess OR go", "-beginner"
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
  )
  select p.id, p.username, p.full_name, p.bio,
         sum(hits.r)::real as rank,
         array_agg(distinct hits.src) as matched_in
  from hits
  join public.profiles p on p.id = hits.user_id
  group by p.id, p.username, p.full_name, p.bio
  order by rank desc
  limit 20;
$$;
-- Note: this runs as the calling user ("security invoker" default),
-- so your RLS policies still apply. Search can never leak data
-- the user isn't allowed to see.
