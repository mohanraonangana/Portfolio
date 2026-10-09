// Supabase client for the shared vault.
//
// IMPORTANT: this app uses no Supabase Auth. Supabase is the single source of
// truth for personal details and documents, and access relies on public
// (publishable/anon) Storage + table RLS policies. Treat the vault as
// effectively public: anyone with the site/key can read it.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SYNC_BUCKET = 'vault-documents'

// When env vars are absent the vault UI cannot reach Supabase.
export const isSyncEnabled = Boolean(url && key)

export const supabase = isSyncEnabled ? createClient(url, key) : null
