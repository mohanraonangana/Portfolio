// Shared document classification + Supabase-row mapping.
//
// Used by both WalletApp (loading the whole vault) and DocumentsSection (the
// documents UI) so a public.wallet_documents row is turned into the same UI
// document object on both sides.

export const KNOWN = [
  { match: /driving|licen[cs]e/i, name: 'Driving Licence', cat: 'Identity', replace: true },
  { match: /adhar/i, name: 'Aadhaar Card', cat: 'Identity' },
  { match: /pan/i, name: 'PAN Card', cat: 'Identity' },
  { match: /btech/i, name: 'B.Tech Documents', cat: 'Education' },
  { match: /10|12|tenth|twelfth/i, name: '10th & 12th Documents', cat: 'Education' },
  { match: /photo/i, name: 'Personal Photo', cat: 'Personal' },
  { match: /resume|cv/i, name: 'Resume', cat: 'Career' },
]

export const CATEGORIES = ['Identity', 'Education', 'Personal', 'Career']
export const ORDER = ['Identity', 'Education', 'Personal', 'Career']

// Fallback extension for records that never stored the original name.
export const EXT_BY_MIME = {
  'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
  'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf',
}
export const extFor = t => EXT_BY_MIME[t] || ''

const TYPE_LABEL = {
  'application/pdf': 'PDF', 'image/jpeg': 'JPEG', 'image/jpg': 'JPG',
  'image/png': 'PNG', 'image/webp': 'WEBP', 'image/gif': 'GIF',
}
export const typeLabel = t => TYPE_LABEL[t] || (t && t.includes('/') ? t.split('/').pop().toUpperCase() : 'FILE')

// Metadata rows don't carry a category, so derive it from the name.
export const deriveCat = label => {
  const k = KNOWN.find(x => x.match.test(label || ''))
  return k ? k.cat : 'Personal'
}

export const fmtSize = n => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1024).toFixed(0) + ' KB')
export const isImage = t => (t || '').startsWith('image/')

// public.wallet_documents row -> UI document object.
export function rowToDoc(r) {
  const label = r.display_name || r.original_name
  return {
    id: r.id,
    name: label,
    cat: deriveCat(label),
    type: r.mime_type || 'application/octet-stream',
    size: Number(r.size) || 0,
    addedAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    originalName: r.original_name,
    storagePath: r.storage_path,
    bucket: r.bucket,
    sha256: r.sha256,
  }
}

// UI document object -> public.wallet_documents row (for inserts / backups).
export function docToRow(d) {
  return {
    id: d.id,
    display_name: d.name,
    original_name: d.originalName || d.name,
    mime_type: d.type,
    size: d.size,
    bucket: d.bucket || 'vault-documents',
    storage_path: d.storagePath,
    sha256: d.sha256 || null,
    created_at: d.addedAt ? new Date(d.addedAt).toISOString() : new Date().toISOString(),
  }
}
