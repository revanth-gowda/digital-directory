# Digital Directory — Technical Documentation

**Live site:** https://digital-directory-omega.vercel.app
**Stack:** React 18 (Vite) · Supabase (PostgreSQL, Auth, Storage) · Leaflet/OpenStreetMap · Vercel
**Cost:** $0 — every service runs on a permanent free tier.

---

## 1. What the product is

Digital Directory is a people-discovery SaaS platform. Users build rich personal
profiles — hobbies, work history, projects, travel history on an interactive world
map, a photo/video gallery, and blog posts — and discover other users through a
ranked full-text search engine that indexes every part of every profile.

### Use cases

**Community discovery.** A user searches "chess" and finds everyone who lists chess
as a hobby, mentions it in a blog post, or built a chess project — ranked by how
strongly their profile matches. This works for any interest, skill, place, or topic.

**Professional networking.** Because jobs, companies, and projects are indexed,
searches like "react developer" or a company name surface relevant people. Blog
posts let users demonstrate expertise, and writing about a topic makes them
discoverable for it.

**Travel matching.** Every visited city is stored with coordinates and searchable
by name. Searching "Tokyo" finds everyone who has marked Tokyo on their map —
useful for trip advice, meetups, or finding people with shared experiences.

**Personal portfolio.** Each profile aggregates a user's identity in one place:
avatar, bio, gallery, writing, work, and travels — a richer alternative to a
static personal site, with discovery built in.

The same architecture generalizes to niche directories (alumni networks, hobby
clubs, professional guilds, local communities) by changing only the profile
sections and seed data.

---

## 2. Architecture

```
┌────────────────────────┐         ┌───────────────────────────────┐
│  Browser               │  HTTPS  │  Supabase (managed cloud)     │
│  React SPA (Vite)      │ ──────► │  ├─ Auth (GoTrue): sessions,  │
│  served as static      │         │  │   JWT, email confirmation  │
│  files by Vercel CDN   │         │  ├─ PostgreSQL + RLS          │
│                        │         │  ├─ PostgREST: tables/RPC     │
│  react-leaflet ────────┼──────►  │  │   exposed as REST API      │
│  (map tiles from       │         │  └─ Storage: images/videos    │
│   OpenStreetMap)       │         │      in 'media' bucket        │
└────────────────────────┘         └───────────────────────────────┘
```

There is **no custom backend server**. The browser talks directly to Supabase's
auto-generated REST API (PostgREST) using the `@supabase/supabase-js` client.
Security is enforced *inside the database* via Row Level Security (RLS), which is
what makes the serverless-client architecture safe: the publishable `anon` key can
ship to every browser because the database itself refuses unauthorized operations.

**Request flow example (adding a hobby):**
1. React component calls `supabase.from('hobbies').insert({...})`
2. supabase-js attaches the user's JWT (from the auth session) to the HTTP request
3. PostgREST translates the request to SQL
4. Postgres checks the RLS policy (`auth.uid() = user_id`) before executing
5. The new row returns as JSON; React updates local state; UI re-renders

---

## 3. Data model

All tables live in the `public` schema. `auth.users` is Supabase-managed
(credentials, sessions) and is never touched directly.

| Table      | Purpose                    | Key columns                                            |
|------------|----------------------------|--------------------------------------------------------|
| `profiles` | 1:1 mirror of auth.users   | `id` (PK, FK→auth.users), `username` (unique), `full_name`, `bio`, `avatar_url`, `fts` |
| `hobbies`  | many per user              | `id`, `user_id` (FK→profiles), `name`, `detail`, `fts` |
| `jobs`     | work history               | `id`, `user_id`, `title`, `company`, `detail`, `fts`   |
| `travels`  | visited places             | `id`, `user_id`, `place`, `detail`, `lat`, `lng`, `fts`|
| `projects` | portfolio items            | `id`, `user_id`, `name`, `detail`, `url`, `fts`        |
| `blogs`    | long-form posts            | `id`, `user_id`, `title`, `content`, `fts`             |
| `media`    | gallery metadata           | `id`, `user_id`, `kind` (image/video), `url`, `path`   |

Design decisions worth noting:

**One-to-many over JSON blobs.** Each profile section is its own table with a
`user_id` foreign key rather than a JSON column on profiles. This enables per-table
indexing, per-table search sources, and clean cascading deletes
(`on delete cascade` — deleting a user removes all their data automatically).

**Profile auto-creation trigger.** A Postgres trigger (`on_auth_user_created`)
inserts a `profiles` row the moment a user signs up, guaranteeing no user ever
exists without a profile.

**Files never live in the database.** Uploads go to the Supabase Storage bucket
`media`; the `media` table stores only the public URL plus the storage `path`
(needed for deletion). The city list for the travel map is a static JS module
(`src/data/cities.js`, ~100 cities) — reference data identical for all users
doesn't justify a database round-trip.

---

## 4. Security model

**Authentication** is email + password with email confirmation, handled entirely
by Supabase Auth. Sessions are JWTs stored by supabase-js; `onAuthStateChange`
keeps React state in sync so login/logout flips the UI without page reloads.
Password hashing, token refresh, and confirmation emails are never hand-rolled.

**Authorization is Row Level Security.** Every table enables RLS with the same
four-policy pattern:

- SELECT: any authenticated user (it's a directory — profiles are visible to members)
- INSERT: only rows where `auth.uid() = user_id`
- UPDATE: only your own rows
- DELETE: only your own rows

**Storage has parallel policies** on `storage.objects`: public read (so images
render without signed URLs), but write/delete only inside a folder named after
your own user id — upload paths are always `<user_id>/<filename>`, and
`(storage.foldername(name))[1] = auth.uid()::text` enforces ownership.

**Search respects RLS.** The `search_directory` function runs as `security invoker`
(the caller's permissions), so search can never return data the caller couldn't
query directly.

**Secrets hygiene.** The Supabase URL and anon key live in `.env`
(git-ignored) locally and in Vercel environment variables in production. The anon
key is designed to be public; RLS is the actual security boundary.

---

## 5. The search engine

Search is native PostgreSQL full-text search — no external service (Algolia,
Elasticsearch) and no cost.

**Indexing.** Every searchable table has a generated column:
`fts tsvector generated always as (to_tsvector('english', ...)) stored`.
Postgres maintains it automatically on every write. `to_tsvector` normalizes text
(stemming: "gaming"/"gamer" → "game"; stop-word removal), so searches match word
variants. Each `fts` column has a GIN index — an inverted word→rows map that makes
lookups independent of table size.

**Querying.** The `search_directory(term)` RPC function:
1. Parses input with `websearch_to_tsquery` — understands quoted phrases,
   `OR`, and `-exclusions` like a web search box
2. Searches all six sources (profiles, hobbies, jobs, travels, projects, blogs)
   with `fts @@ query`, collecting a `ts_rank` relevance score per hit
3. Merges hits per user (`UNION ALL` + `GROUP BY`), summing scores — a user
   matching in three sections outranks a user matching in one
4. Returns the top 20 with `matched_in` (which sections hit) and `avatar_url`

**Frontend behavior.** The search box debounces input (300 ms `setTimeout` with
`useEffect` cleanup), calls `supabase.rpc('search_directory', {term})`, and
renders result cards. Full profile details (all sections + up to 4 photos) are
lazy-loaded only when a card is expanded, via `Promise.all` of parallel queries.

---

## 6. Frontend structure

```
src/
├─ main.jsx                 entry: React root + BrowserRouter
├─ App.jsx                  session state, auth listener, routes, nav
├─ supabaseClient.js        single Supabase connection (env-driven)
├─ index.css                design system (tokens + components)
├─ data/cities.js           ~100 major cities with coordinates
├─ pages/
│  ├─ AuthPage.jsx          sign in/up, split-panel layout
│  ├─ ProfilePage.jsx       profile editor: composes all sections
│  └─ SearchPage.jsx        debounced search + expandable results
└─ components/
   ├─ ListSection.jsx       generic CRUD list (hobbies/jobs/projects)
   ├─ MediaGallery.jsx      upload/list/delete images & videos
   ├─ BlogSection.jsx       write/read/delete posts
   └─ TravelMap.jsx         Leaflet map, clickable city dots
```

**Routing:** React Router — `/` (Discover), `/profile` (own profile), wildcard
redirect. `vercel.json` rewrites all paths to `index.html` so direct URL loads
reach the SPA instead of 404ing.

**Recurring patterns:**
- *State-driven UI:* components never manipulate the DOM; they update state and
  React re-renders (e.g. `setItems([...items, newRow])` after an insert —
  optimistic local update, no refetch)
- *Reusable configured components:* `ListSection` powers three different profile
  sections purely through props (`table`, `fields`, `title`)
- *Thin pages, working components:* `ProfilePage` is mostly composition;
  each feature owns its data fetching and mutations
- *Controlled inputs everywhere:* every form value lives in state

**Design system:** ~15 CSS custom properties (`--brand`, `--ink`, `--line`,
`--radius`, `--shadow`...) define the whole visual identity; components reference
tokens, never raw values. Inter font, sticky blurred top bar, focus rings,
responsive breakpoint at 720 px (auth brand panel hides, layouts stack).

**Map:** react-leaflet with OpenStreetMap tiles (free, no API key). Cities render
as SVG `CircleMarker`s (gray = clickable, indigo = visited, matched by coordinate
proximity), avoiding Leaflet's image-based default markers which break under
bundlers. Clicking a city pre-fills a confirm form; saving inserts a `travels`
row with real coordinates, which also feeds the search index.

**Media uploads:** file → Storage (`upload`), URL (`getPublicUrl`), metadata row
(`insert`) — in that order. Videos capped at 25 MB client-side. Avatars overwrite
a fixed path (`<uid>/avatar`) with `upsert: true` plus a cache-busting query param.

---

## 7. Deployment & operations

**Pipeline:** git push to GitHub → Vercel auto-builds (`vite build`) → static
files on Vercel's global CDN. Environment variables (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) are set in Vercel project settings. Supabase's
Auth URL configuration points at the production domain so confirmation emails
link correctly.

**Free-tier limits to know:**

| Service | Limit | Impact when exceeded |
|---|---|---|
| Supabase DB | 500 MB | ~hundreds of thousands of profiles — far away |
| Supabase Storage | 1 GB | ~40–100 users with heavy media; first real constraint |
| Supabase | pauses after 7 days inactivity | dashboard click to restore (dev-stage only) |
| Vercel | 100 GB bandwidth/month | plenty for early traffic |
| OpenStreetMap tiles | fair-use | fine at this scale; swap tile provider if traffic grows |

**Database migrations** are the numbered SQL files in `supabase/`
(`phase1.sql` … `phase5.sql`), run in order in the SQL Editor — a manual but
auditable migration history.

---

## 8. Limitations & roadmap

Known limitations: search is English-stemmed only (`'english'` config); no
pagination past 20 results; no image compression before upload; usernames are
not yet enforced as URL-safe; no rate limiting beyond Supabase defaults; city
list is fixed (~100 cities).

Natural next steps, in rough order of value:
public profile pages at `/u/username` (React Router URL params + a public RLS
read policy), image compression before upload (canvas resize — stretches the
1 GB much further), search filters (extend the RPC with a `sources text[]`
parameter), pagination (offset parameter on the RPC), avatars/thumbnails via
Supabase image transformations, follow/connect between users, and Stripe
subscriptions when a paid tier is justified.

---

## 9. Skills this project demonstrates

Authentication and session management; relational schema design with foreign
keys, cascades, triggers, and generated columns; Row Level Security as an
authorization model; full-text search with ranking and inverted indexes;
serverless architecture trade-offs; React state, effects, props, composition,
and controlled forms; client-side routing; file/object storage patterns;
debouncing and lazy loading; design tokens and responsive CSS; and a
git-to-CDN continuous deployment pipeline.
