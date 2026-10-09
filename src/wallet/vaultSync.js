// Supabase-backed storage for the single shared vault.
//
// Supabase is the ONLY source of truth. There is no Supabase Auth and no
// per-user isolation: access relies on public (anon/publishable) RLS policies,
// so treat this vault as effectively public. Never store anything here that
// must stay secret.
//
// Layout:
//   shared/{docId}/{originalName}  - the original file bytes, real content-type
//
// Document metadata lives in public.wallet_documents; personal information is a
// single row in public.vault_personal. Nothing is kept in localStorage,
// sessionStorage or IndexedDB.
import { supabase, isSyncEnabled, SYNC_BUCKET } from './supabaseClient.js'

const DOCS_TABLE = 'wallet_documents'
const PERSONAL_TABLE = 'vault_personal'
const PERSONAL_ID = 'default'

// Fixed namespace for all objects, so nothing depends on a device-specific id.
export const DOC_NAMESPACE = 'shared'

// Keep object keys flat and filesystem-safe while preserving the extension.
export function safeName(name) {
  return String(name || 'file')
    .replace(/[\\/]+/g, '_')
    .replace(/^\.+/, '')
    .trim() || 'file'
}

// Build the canonical storage path for a document.
export function docPath(docId, originalName) {
  return `${DOC_NAMESPACE}/${docId}/${safeName(originalName)}`
}

// --- documents: bytes in Storage --------------------------------------------

// Upload the original File/Blob unchanged, preserving bytes + content type.
export async function uploadDocument(docId, originalName, file) {
  if (!isSyncEnabled) throw new Error('Cloud storage is not configured.')
  const path = docPath(docId, originalName)
  const { error } = await supabase.storage
    .from(SYNC_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' })
  if (error) throw error
  return path
}

// Signed URL for a private object. Pass `download` (filename) to force a
// Content-Disposition: attachment response; omit it for inline preview.
export async function createSignedUrl(path, { expiresIn = 600, download } = {}) {
  if (!isSyncEnabled || !path) return null
  const { data, error } = await supabase.storage
    .from(SYNC_BUCKET)
    .createSignedUrl(path, expiresIn, download ? { download } : undefined)
  if (error) throw error
  return data?.signedUrl || null
}

export async function removeObject(path) {
  if (!isSyncEnabled || !path) return
  const { error } = await supabase.storage.from(SYNC_BUCKET).remove([path])
  if (error) throw error
}

// --- documents: metadata in Postgres ----------------------------------------

export async function listDocuments() {
  if (!isSyncEnabled) return []
  const { data, error } = await supabase.from(DOCS_TABLE).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function upsertDocumentMeta(row) {
  if (!isSyncEnabled || !row) return
  const { error } = await supabase.from(DOCS_TABLE).upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteDocumentMeta(id) {
  if (!isSyncEnabled || !id) return
  const { error } = await supabase.from(DOCS_TABLE).delete().eq('id', id)
  if (error) throw error
}

// --- personal information (single row, plaintext jsonb) ----------------------

export async function getPersonal() {
  if (!isSyncEnabled) return null
  const { data, error } = await supabase.from(PERSONAL_TABLE).select('data').eq('id', PERSONAL_ID).maybeSingle()
  if (error) throw error
  return data?.data || null
}

export async function savePersonal(record) {
  if (!isSyncEnabled) return
  const { error } = await supabase.from(PERSONAL_TABLE).upsert(
    { id: PERSONAL_ID, data: record || {}, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  if (error) throw error
}

// --- destructive reset (Settings -> Danger Zone) -----------------------------

export async function wipeAllCloud(documents) {
  if (!isSyncEnabled) return
  const docs = documents || []
  const paths = docs.map(d => d.storagePath).filter(Boolean)
  if (paths.length) { try { await supabase.storage.from(SYNC_BUCKET).remove(paths) } catch { /* ignore */ } }
  const ids = docs.map(d => d.id).filter(Boolean)
  if (ids.length) { try { await supabase.from(DOCS_TABLE).delete().in('id', ids) } catch { /* ignore */ } }
  try { await supabase.from(PERSONAL_TABLE).delete().eq('id', PERSONAL_ID) } catch { /* ignore */ }
}
