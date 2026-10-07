import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Eye, Download, Trash2, Plus, Search, X, ZoomIn, ZoomOut, Maximize2, FolderLock } from 'lucide-react'
import { get, set as dbSet, del as dbDel } from './vaultDb.js'

// Encrypt raw file bytes with the existing vault key before persisting.
async function encryptBytes(key, buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer)
  const toB64 = buf => {
    const bytes = new Uint8Array(buf)
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
    }
    return btoa(binary)
  }
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
  return { iv: toB64(iv.buffer), ct: toB64(ct) }
}
async function decryptBytes(key, { iv, ct }) {
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct))
}

const KNOWN = [
  { match: /driving|licen[cs]e/i, name: 'Driving Licence', cat: 'Identity', replace: true },
  { match: /adhar/i, name: 'Aadhaar Card', cat: 'Identity' },
  { match: /pan/i, name: 'PAN Card', cat: 'Identity' },
  { match: /btech/i, name: 'B.Tech Documents', cat: 'Education' },
  { match: /10|12|tenth|twelfth/i, name: '10th & 12th Documents', cat: 'Education' },
  { match: /photo/i, name: 'Personal Photo', cat: 'Personal' },
  { match: /resume|cv/i, name: 'Resume', cat: 'Career' },
]
const CATEGORIES = ['Identity', 'Education', 'Personal', 'Career']
const ORDER = ['Identity', 'Education', 'Personal', 'Career']

const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : (n / 1024).toFixed(0) + ' KB'
const isImage = t => t.startsWith('image/')

export default function DocumentsSection({ vaultKey, items, onChange }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [preview, setPreview] = useState(null) // {doc, url}
  const [zoom, setZoom] = useState(1)
  const fileRef = useRef(null)

  const filtered = useMemo(() => {
    let list = items.filter(d =>
      (filter === 'All' || d.cat === filter) &&
      d.name.toLowerCase().includes(query.toLowerCase())
    )
    list = [...list].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) :
      sort === 'size' ? b.size - a.size :
      sort === 'date' ? b.addedAt - a.addedAt :
      ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat)
    )
    return list
  }, [items, filter, query, sort])

  const importFiles = async files => {
    const next = [...items]
    const revoke = [] // old encrypted files to delete once the new list is saved
    for (const file of files) {
      const known = KNOWN.find(k => k.match.test(file.name))
      const buf = await file.arrayBuffer()
      const enc = await encryptBytes(vaultKey, buf)
      const id = crypto.randomUUID()
      await dbSet('doc_' + id, enc)
      // Documents flagged `replace` (Driving Licence) keep a single current copy:
      // drop the old entry and revoke its encrypted file from storage.
      if (known && known.replace) {
        for (const old of next.filter(d => d.name === known.name)) revoke.push('doc_' + old.id)
        for (let i = next.length - 1; i >= 0; i--) if (next[i].name === known.name) next.splice(i, 1)
      }
      next.unshift({
        id, name: known ? known.name : file.name.replace(/\.[^.]+$/, ''),
        cat: known ? known.cat : 'Personal', type: file.type || 'application/pdf',
        size: file.size, addedAt: Date.now(),
      })
    }
    await onChange(next)
    for (const key of revoke) await dbDel(key)
  }

  const openPreview = async doc => {
    const enc = await get('doc_' + doc.id)
    if (!enc) return
    const plain = await decryptBytes(vaultKey, enc)
    const url = URL.createObjectURL(new Blob([plain], { type: doc.type }))
    setZoom(1)
    setPreview({ doc, url })
  }

  const download = async doc => {
    const enc = await get('doc_' + doc.id)
    if (!enc) return
    const plain = await decryptBytes(vaultKey, enc)
    const url = URL.createObjectURL(new Blob([plain], { type: doc.type }))
    const a = document.createElement('a')
    a.href = url; a.download = doc.name + (isImage(doc.type) ? '.jpg' : '.pdf'); a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const removeDoc = async doc => {
    if (!window.confirm(`Delete "${doc.name}" from your vault?`)) return
    onChange(items.filter(d => d.id !== doc.id))
  }

  // Clear any open preview when unmounting (vault lock)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])

  return (
    <div>
      <div className="doc-toolbar">
        <div className="doc-search">
          <Search size={15} style={{ position: 'absolute', left: 12, top: 14, color: '#8f97b8' }} />
          <input style={{ paddingLeft: 36 }} placeholder="Search documents..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="doc-sort" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="date">Sort: Date Added</option>
          <option value="size">Sort: File Size</option>
          <option value="cat">Sort: Category</option>
        </select>
        <button className="btn btn-primary doc-add" onClick={() => fileRef.current.click()}><Plus size={16} /> Add Document</button>
        <input ref={fileRef} type="file" multiple accept=".pdf,image/*" hidden onChange={e => importFiles([...e.target.files])} />
      </div>

      <div className="doc-chips">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} className={`doc-chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty-note" style={{ textAlign: 'center', padding: '50px 0' }}>
          <FolderLock size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
          <p>No documents yet.</p>
          <button className="btn btn-primary" onClick={() => fileRef.current.click()}>Import Documents</button>
          <p style={{ fontSize: '0.8rem', marginTop: 8 }}>Choose files from this device. They are encrypted in this browser and never uploaded anywhere.</p>
        </div>
      ) : (
        <>
        {filtered.length === 0 && <p className="empty-note doc-none">No documents match your search or filter.</p>}
        {ORDER.filter(c => filter === 'All' || filter === c).map(cat => {
          const group = filtered.filter(d => d.cat === cat)
          if (!group.length) return null
          return (
            <div key={cat} className="doc-group">
              <h3 style={{ color: '#8ba2ff', letterSpacing: '0.16em', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 14 }}>{cat}</h3>
              <div className="record-grid">
                {group.map(doc => (
                  <div className="record" key={doc.id}>
                    <div className="doc-card-head">
                      {isImage(doc.type)
                        ? <ImageIcon size={26} color="#b07cff" />
                        : <FileText size={26} color="#7da2ff" />}
                      <div className="doc-card-title">
                        <h4 style={{ margin: 0 }}>{doc.name}</h4>
                        <span className="chip chip-login">{doc.cat}</span>
                      </div>
                    </div>
                    <div className="field-row"><span className="fl">Type</span><span className="fv">{isImage(doc.type) ? 'Image' : 'PDF'}</span></div>
                    <div className="field-row"><span className="fl">Size</span><span className="fv">{fmtSize(doc.size)}</span></div>
                    <div className="field-row"><span className="fl">Added</span><span className="fv">{new Date(doc.addedAt).toLocaleDateString()}</span></div>
                    <div className="record-actions">
                      <button className="icon-btn" title="Open" onClick={() => openPreview(doc)}><Eye size={16} /><span className="act-label">View</span></button>
                      <button className="icon-btn" title="Download" onClick={() => download(doc)}><Download size={16} /><span className="act-label">Download</span></button>
                      <button className="icon-btn" title="Delete" style={{ color: '#ff9aa8' }} onClick={() => removeDoc(doc)}><Trash2 size={16} /><span className="act-label">Delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        </>
      )}

      {preview && (
        <div className="modal-backdrop" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null) }}>
          <div className="doc-viewer" onClick={e => e.stopPropagation()}>
            <div className="doc-viewer-head">
              <h3>{preview.doc.name}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {!isImage(preview.doc.type) && (<>
                  <button className="icon-btn" title="Zoom in" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}><ZoomIn size={18} /></button>
                  <button className="icon-btn" title="Zoom out" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}><ZoomOut size={18} /></button>
                </>)}
                <button className="icon-btn" title="Fullscreen" onClick={() => document.querySelector('.doc-viewer').requestFullscreen?.()}><Maximize2 size={18} /></button>
                <button className="icon-btn" title="Download" onClick={() => download(preview.doc)}><Download size={18} /></button>
                <button className="icon-btn" title="Close" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null) }}><X size={18} /></button>
              </div>
            </div>
            <div className="doc-viewer-body" style={{ zoom }}>
              {isImage(preview.doc.type)
                ? <img src={preview.url} alt={preview.doc.name} />
                : <iframe title={preview.doc.name} src={preview.url} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
