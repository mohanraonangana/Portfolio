// Vault backup / restore.
//
// A backup file contains your Personal record and document *metadata*, sealed
// with AES-256-GCM under a key derived (PBKDF2-SHA256) from a backup passphrase
// you choose at export time (not your PIN). Document bytes are NOT included —
// they live in Supabase Storage and are referenced by path. Importing merges
// metadata into Supabase without creating duplicates.
import { listDocuments, upsertDocumentMeta, savePersonal } from './vaultSync.js'
import { rowToDoc, docToRow } from './vaultData.js'

const FORMAT = 'mohanrao-vault-backup'
const VERSION = 2
const ITERATIONS = 250000

const toB64 = buf => {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))

async function backupKey(passphrase, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
}

async function sealBytes(key, buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer)
  return { iv: toB64(iv), ct: toB64(ct) }
}
async function openBytes(key, { iv, ct }) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct))
}

export async function createBackup({ data, passphrase }) {
  const payload = {
    createdAt: Date.now(),
    personal: data.personal || [],
    documents: (data.documents || []).map(docToRow),
  }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await backupKey(passphrase, salt)
  const sealed = await sealBytes(key, new TextEncoder().encode(JSON.stringify(payload)))
  return JSON.stringify({ format: FORMAT, version: VERSION, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toB64(salt), ...sealed })
}

// Merge a backup into the vault (Supabase). Documents are deduped by storage
// path; the Personal record is only taken if the vault has none yet.
export async function restoreBackup({ text, passphrase, data, onDataChange }) {
  let file
  try { file = JSON.parse(text) } catch { throw new Error('This is not a valid backup file.') }
  if (file.format !== FORMAT) throw new Error('This is not a valid backup file.')

  let payload
  try {
    const key = await backupKey(passphrase, fromB64(file.salt))
    payload = JSON.parse(new TextDecoder().decode(await openBytes(key, file)))
  } catch { throw new Error('Wrong passphrase, or the backup file is damaged.') }

  const existing = await listDocuments().catch(() => [])
  const knownPaths = new Set((existing || []).map(r => r.storage_path))
  const next = [...(data.documents || [])]
  const summary = { added: [], skipped: [], personal: false }

  for (const row of payload.documents || []) {
    if (!row || !row.storage_path) continue
    const name = row.original_name || row.display_name || row.storage_path
    if (knownPaths.has(row.storage_path) || next.some(d => d.storagePath === row.storage_path)) {
      summary.skipped.push(name)
      continue
    }
    try {
      await upsertDocumentMeta(row)
      next.push(rowToDoc(row))
      knownPaths.add(row.storage_path)
      summary.added.push(name)
    } catch {
      summary.skipped.push(name)
    }
  }

  let personal = data.personal || []
  if (!personal[0] && payload.personal && payload.personal[0]) {
    personal = payload.personal
    summary.personal = true
    try { await savePersonal(personal[0]) } catch { /* ignore */ }
  }

  if (summary.added.length || summary.personal) {
    await onDataChange({ ...data, personal, documents: next })
  }
  return summary
}
