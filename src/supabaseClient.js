// ---------------------------------------------------------------
// LESSON: This is the ONLY place your app talks to the backend from.
// createClient() gives you one object that handles auth, database
// queries, and sessions — no need to write your own server (yet).
// ---------------------------------------------------------------
import { createClient } from '@supabase/supabase-js'

// import.meta.env reads variables from your .env file.
// Vite only exposes variables that start with VITE_ (a safety feature).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing .env values! Copy .env.example to .env and fill it in.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
