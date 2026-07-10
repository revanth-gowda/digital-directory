# Digital Directory — Phase 1

A SaaS directory where people build rich profiles (hobbies, jobs, travel,
projects) and discover each other via fast search.

**Stack:** React (Vite) + Supabase (Postgres, Auth, full-text search) — all free tier.

## Setup (do these in order)

### 1. Install Node.js
Install the LTS version from https://nodejs.org if you don't have it.
Check: `node -v` in a terminal.

### 2. Install project dependencies
```bash
cd digital-directory
npm install
```

### 3. Create your Supabase project (free)
1. Go to https://supabase.com → Start your project → sign up with GitHub.
2. New project → name it `digital-directory`, set a strong DB password, pick a region near you.
3. Wait ~2 min for it to provision.

### 4. Run the Phase 1 SQL
1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of `supabase/phase1.sql` and click **Run**.
3. You should see "Success. No rows returned".

### 5. Connect the app to Supabase
1. Dashboard → **Project Settings → API**. Copy the **Project URL** and **anon public** key.
2. Copy `.env.example` to a new file named `.env` and paste those two values in.

### 6. Run it
```bash
npm run dev
```
Open http://localhost:5173 — sign up, confirm via the email you receive, sign in. 🎉

## Reading order (to learn, not just run)
1. `index.html` — the single page everything mounts into
2. `src/main.jsx` — the entry point
3. `src/supabaseClient.js` — the backend connection
4. `src/App.jsx` — session state + auth listener (core concept!)
5. `src/pages/AuthPage.jsx` — forms, controlled inputs, calling Supabase
6. `supabase/phase1.sql` — tables, RLS policies, triggers

## Roadmap
- ✅ Phase 1: Setup + authentication
- ✅ Phase 2: Profile builder (hobbies, jobs, travel, projects) + RLS
- ✅ Phase 3: Search engine (Postgres full-text search + GIN indexes)
- ✅ Phase 4: Routing + free deployment (Vercel)

## Deploying to the internet (free)

### 1. Put the code on GitHub
1. Create a free account at https://github.com, then a new empty repository
   named `digital-directory` (no README).
2. In your project folder:
   ```bash
   git init
   git add .
   git commit -m "Digital Directory v1"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/digital-directory.git
   git push -u origin main
   ```
   (`.gitignore` already keeps `.env` and `node_modules` out — never commit secrets.)

### 2. Deploy on Vercel
1. Sign up at https://vercel.com with your GitHub account.
2. Add New -> Project -> import `digital-directory`. Vercel auto-detects Vite.
3. Before deploying, open Environment Variables and add BOTH values from
   your local `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. You get a live URL like `https://digital-directory-xyz.vercel.app`.

`vercel.json` handles one gotcha: it rewrites every URL to `index.html`
so React Router (not Vercel's file server) handles routes like `/profile`.

### 3. Tell Supabase about your new URL
Dashboard -> Authentication -> URL Configuration:
- Site URL: your Vercel URL
- Add it to Redirect URLs too.
Without this, confirmation-email links point to localhost.

### 4. From here to a real SaaS (ideas, in rough order)
- Public profile pages at `/u/username` (React Router URL params)
- Avatars via Supabase Storage (free tier includes 1 GB)
- Pagination for search results past 20
- Filters (search only hobbies, only travel...) — add a parameter to `search_directory`
- Custom domain (Vercel supports free)
- Payments with Stripe when you have something worth charging for
