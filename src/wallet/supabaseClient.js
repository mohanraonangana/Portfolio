// Supabase client used for encrypted document sync only.
//
// IMPORTANT: no Supabase Auth is used here. Access relies on Storage RLS policies
// granted to the public (publishable/anon) key, so treat the bucket as effectively
// public and rely purely on client-side encryption. Only AES-GCM ciphertext is
// ever uploaded; Supabase never receives plaintext or meaningful metadata.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SYNC_BUCKET = 'vault-documents'

// When env vars are absent the wallet keeps working fully offline/local.
export const isSyncEnabled = Boolean(url && key)

export const supabase = isSyncEnabled ? createClient(url, key) : null
