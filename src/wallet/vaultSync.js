// Document sync against Supabase Storage + metadata table.
//
// NOTE: documents are NOT encrypted before upload. The original file bytes are
// uploaded verbatim with their real MIME type so they can be previewed and
// downloaded byte-for-byte via signed URLs. This is a deliberate product
// decision (see the vault UI warning). Supabase can read every document.
//
// Layout:
//   {vaultId}/meta.json                - non-secret vault sync metadata (salt)
//   {vaultId}/{docId}/{originalName}   - the original file, real content-type
//
// Metadata (filename, mime, size, bucket, path, sha256) lives in the
// public.wallet_documents table; bytes live only in Storage.
import { supabase, isSyncEnabled, SYNC_BUCKET } from './supabaseClient.js'

const META = 'meta.json'
const DOCS_TABLE = 'wallet_documents'

// Keep object keys flat and filesystem-safe while preserving the extension.
export function safeName(name) {
  return String(name || 'file')
    .replace(/[\\/]+/g, '_')
    .replace(/^\.+/, '')
    .trim() || 'file'
}

// Build the canonical storage path for a document.
export function docPath(vaultId, docId, originalName) {
  return `${vaultId}/${docId}/${safeName(originalName)}`
}

// --- vault metadata (salt only; never the key or any personal data) ----------

export async function putMeta(vaultId, meta) {
  if (!isSyncEnabled || !vaultId) return
  const { error } = await supabase.storage
    .from(SYNC_BUCKET)
    .upload(
      `${vaultId}/${META}`,
      new Blob([JSON.stringify({ ...meta, updatedAt: Date.now() })], { type: 'application/json' }),
      { upsert: true, contentType: 'application/json' },
    )
  if (error) throw error
}

export async function getMeta(vaultId) {
  if (!isSyncEnabled || !vaultId) return null
  const { data, error } = await supabase.storage.from(SYNC_BUCKET).download(`${vaultId}/${META}`)
  if (error || !data) return null
  try { return JSON.parse(await data.text()) } catch { return null }
}

// --- documents: bytes in Storage --------------------------------------------

// Upload the original File/Blob unchanged, preserving bytes + content type.
export async function uploadDocument(vaultId, docId, originalName, file) {
  if (!isSyncEnabled || !vaultId) return null
  const path = docPath(vaultId, docId, originalName)
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

// --- documents: legacy encrypted payloads (read-only, for old records) -------

// Old records stored `{ iv, ct }` as JSON. Kept so pre-existing documents keep
// working locally/remotely without migration.
export async function getLegacyDoc(vaultId, docId) {
  if (!isSyncEnabled || !vaultId) return null
  const { data, error } = await supabase.storage.from(SYNC_BUCKET).download(`${vaultId}/${docId}`)
  if (error || !data) return null
  try { return JSON.parse(await data.text()) } catch { return null }
}

// --- documents: metadata in Postgres ----------------------------------------

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

export async function listDocumentMeta(vaultId) {
  if (!isSyncEnabled || !vaultId) return []
  const { data, error } = await supabase.from(DOCS_TABLE).select('*').eq('vault_id', vaultId)
  if (error) return []
  return data || []
}
