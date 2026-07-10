-- =================================================================
-- PHASE 6: PUBLIC READ ACCESS
-- Run in Supabase Dashboard -> SQL Editor
--
-- LESSON: Supabase requests carry one of two roles:
--   anon          = visitor who is not logged in
--   authenticated = logged-in user
-- Until now every SELECT policy was "to authenticated", so
-- logged-out visitors saw nothing. These policies open READ access
-- to everyone. All INSERT/UPDATE/DELETE policies stay
-- authenticated-only — visitors can look, never touch.
-- =================================================================
do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'hobbies', 'jobs', 'travels', 'projects', 'blogs', 'media']
  loop
    execute format(
      'create policy "Public read access" on public.%I
       for select to anon using (true)', t);
  end loop;
end $$;

-- Let visitors use the search engine too
grant execute on function public.search_directory(text) to anon;
