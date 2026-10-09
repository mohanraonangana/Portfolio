// Encrypted vault backup / restore (client-side only, nothing is ever uploaded).
//
// A backup file contains the Personal record + all Documents (metadata AND file bytes),
// sealed with AES-256-GCM under a key derived (PBKDF2-SHA256) from a *backup passphrase*
// that you choose at export time. It is independent of the device PIN/salt, so the file
// can be moved between devices (AirDrop, cloud drive, ...) and merged into another vault.
import { get, set as dbSet, del as dbDel } from './vaultDb.js'

const FORMAT = 'mohanrao-vault-backup'
const VERSION = 1
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

// Same {iv, ct} AES-GCM layout the Documents section already uses for stored files.
async function sealBytes(key, buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer)
  return { iv: toB64(iv), ct: toB64(ct) }
}
async function openBytes(key, { iv, ct }) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct))
}

export async function createBackup({ vaultKey, data, passphrase, vaultId }) {
  const files = {}
  const documents = []
  for (const d of data.documents || []) {
    const enc = await get('doc_' + d.id)
    if (!enc) continue
    files[d.id] = toB64(await openBytes(vaultKey, enc))
    documents.push(d)
  }
  const payload = { createdAt: Date.now(), vaultId: vaultId || null, personal: data.personal || [], documents, files }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await backupKey(passphrase, salt)
  const sealed = await sealBytes(key, new TextEncoder().encode(JSON.stringify(payload)))
  return JSON.stringify({ format: FORMAT, version: VERSION, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toB64(salt), ...sealed })
}

// Merges a backup into the current vault. Never removes anything that isn't superseded:
//  - documents are matched by name; identical (same name + size) or older ones are skipped,
//    a newer one replaces the old entry and the old encrypted file is revoked (no duplicates)
//  - the Personal record is only taken if this vault has none yet
export async function restoreBackup({ text, passphrase, vaultKey, data, onDataChange }) {
  let file
  try { file = JSON.parse(text) } catch { throw new Error('This is not a valid backup file.') }
  if (file.format !== FORMAT || file.version !== VERSION) throw new Error('This is not a valid backup file.')

  let payload
  try {
    const key = await backupKey(passphrase, fromB64(file.salt))
    payload = JSON.parse(new TextDecoder().decode(await openBytes(key, file)))
  } catch { throw new Error('Wrong passphrase, or the backup file is damaged.') }

  const next = [...(data.documents || [])]
  const revoke = []
  const summary = { added: [], replaced: [], skipped: [], personal: false }

  for (const doc of payload.documents || []) {
    const b64 = payload.files && payload.files[doc.id]
    if (!b64) continue
    const same = next.filter(d => d.name === doc.name)
    if (same.some(d => d.size === doc.size)) { summary.skipped.push(doc.name); continue }
    if (same.length && same.every(d => (d.addedAt || 0) >= (doc.addedAt || 0))) { summary.skipped.push(doc.name); continue }

    const id = crypto.randomUUID()
    await dbSet('doc_' + id, await sealBytes(vaultKey, fromB64(b64)))
    if (same.length) {
      for (const old of same) { revoke.push('doc_' + old.id); next.splice(next.indexOf(old), 1) }
      summary.replaced.push(doc.name)
    } else summary.added.push(doc.name)
    next.push({ ...doc, id })
  }

  let personal = data.personal || []
  if (!personal[0] && payload.personal && payload.personal[0]) { personal = payload.personal; summary.personal = true }

  // Carry the cloud sync id across devices so restored documents continue to sync.
  if (payload.vaultId && !(await get('vaultId'))) {
    await dbSet('vaultId', payload.vaultId)
    summary.vaultId = true
  }

  if (summary.added.length || summary.replaced.length || summary.personal) {
    await onDataChange({ ...data, personal, documents: next })
    for (const key of revoke) await dbDel(key) // only after the new list is saved
  }
  return summary
}
