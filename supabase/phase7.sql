-- =================================================================
-- PHASE 7: SEARCH v3 — typo tolerance + partial matching
-- Run in Supabase Dashboard -> SQL Editor
--
-- LESSON: pg_trgm breaks text into 3-letter chunks (trigrams).
-- "tokyo" and "tokio" share most trigrams, so similarity() scores
-- them close — that's typo tolerance without any external service.
-- Strategy: exact full-text hits rank first (weight 1.0); fuzzy
-- trigram hits are a fallback layer at half weight, so typos find
-- people but never outrank exact matches.
-- =================================================================
create extension if not exists pg_trgm with schema extensions;

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
  fts_hits as (
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
  ),
  fuzzy_hits as (
    -- typo tolerance: word_similarity handles "tokio" -> Tokyo;
    -- ilike handles partial words: "photo" -> photography
    select p.id as user_id,
           greatest(word_similarity(term, coalesce(p.username, '')),
                    word_similarity(term, coalesce(p.full_name, ''))) * 0.5 as r,
           'profile' as src
      from public.profiles p
     where word_similarity(term, coalesce(p.username, '')) > 0.42
        or word_similarity(term, coalesce(p.full_name, '')) > 0.42
        or p.full_name ilike '%' || term || '%'
        or p.username ilike '%' || term || '%'
    union all
    select h.user_id, word_similarity(term, h.name) * 0.5, 'hobbies'
      from public.hobbies h
     where word_similarity(term, h.name) > 0.42 or h.name ilike '%' || term || '%'
    union all
    select t.user_id, word_similarity(term, t.place) * 0.5, 'travel'
      from public.travels t
     where word_similarity(term, t.place) > 0.42 or t.place ilike '%' || term || '%'
    union all
    select j.user_id, word_similarity(term, j.title) * 0.5, 'jobs'
      from public.jobs j
     where word_similarity(term, j.title) > 0.42 or j.title ilike '%' || term || '%'
  ),
  hits as (
    select * from fts_hits
    union all
    -- fuzzy only fills the gap: skip users who already have exact hits
    select f.* from fuzzy_hits f
     where not exists (select 1 from fts_hits x where x.user_id = f.user_id)
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

grant execute on function public.search_directory(text) to anon, authenticated;
