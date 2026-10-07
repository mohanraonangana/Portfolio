// Web Crypto API only. Keys are derived client-side and never persisted.
const PBKDF2_ITERATIONS = 250000

function toB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function fromB64(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

export function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n))
}

export async function deriveKey(password, saltB64) {
  const base = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  )
}

export async function encryptObject(key, obj) {
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))
  )
  return { iv: toB64(iv), ct: toB64(ct) }
}

export async function decryptObject(key, payload) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.ct)
  )
  return JSON.parse(new TextDecoder().decode(pt))
}

export const EMPTY_VAULT = {
  personal: [], identity: [], addresses: [], emergency: [],
  finances: [], accounts: [], notes: [], documents: [],
}

export function generatePassword(length = 18) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  const buf = randomBytes(length)
  return Array.from(buf, b => chars[b % chars.length]).join('')
}
