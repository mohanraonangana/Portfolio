import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Eye, Download, Trash2, Plus, Search, X, ZoomIn, ZoomOut, Maximize2, FolderLock } from 'lucide-react'
import { get, set as dbSet } from './vaultDb.js'
import adharUrl from '../assets/documents/Nangana_Mohanrao_Adhar.pdf?url'
import btechUrl from '../assets/documents/Nangana_Mohanrao_Btech.pdf?url'
import panUrl from '../assets/documents/Nangana_Mohanrao_PanCard.pdf?url'
import photoUrl from '../assets/documents/Nangana_Mohanrao_Photo.jpeg?url'
import resumeUrl from '../assets/documents/Nangana_MohanRo_Resume.pdf?url'
import tenUrl from '../assets/documents/NanganaMohanrao_10&12.pdf?url'
import drivingLicenceUrl from '../assets/documents/Driving_licence.pdf?url'

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
  const [seedError, setSeedError] = useState('')
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
    for (const file of files) {
      const known = KNOWN.find(k => k.match.test(file.name))
      const buf = await file.arrayBuffer()
      const enc = await encryptBytes(vaultKey, buf)
      const id = crypto.randomUUID()
      await dbSet('doc_' + id, enc)
      next.unshift({
        id, name: known ? known.name : file.name.replace(/\.[^.]+$/, ''),
        cat: known ? known.cat : 'Personal', type: file.type || 'application/pdf',
        size: file.size, addedAt: Date.now(),
      })
    }
    onChange(next)
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

  // Seed the 6 initial documents from src/assets/documents on first use.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (items.length > 0 || (await get('docsSeeded2'))) return
        const entries = [
          ['Nangana_Mohanrao_Adhar.pdf', adharUrl],
          ['Nangana_Mohanrao_Btech.pdf', btechUrl],
          ['Nangana_Mohanrao_PanCard.pdf', panUrl],
          ['Nangana_Mohanrao_Photo.jpeg', photoUrl],
          ['Nangana_MohanRo_Resume.pdf', resumeUrl],
          ['NanganaMohanrao_10&12.pdf', tenUrl],
        ]
        const seeded = []
        for (const [fname, url] of entries) {
          const known = KNOWN.find(k => k.match.test(fname))
          const res = await fetch(url)
          if (!res.ok) throw new Error('Failed to load ' + fname + ' (' + res.status + ')')
          const blob = await res.blob()
          if (blob.size === 0) throw new Error('Empty file: ' + fname)
          const buf = await blob.arrayBuffer()
          const enc = await encryptBytes(vaultKey, buf)
          const id = crypto.randomUUID()
          await dbSet('doc_' + id, enc)
          seeded.push({
            id, name: known ? known.name : fname, cat: known ? known.cat : 'Personal',
            type: blob.type || (fname.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            size: blob.size, addedAt: Date.now(),
          })
        }
        if (!cancelled && seeded.length) { onChange(seeded); await dbSet('docsSeeded2', true) }
      } catch (err) {
        console.error('Document seeding failed', err)
        if (!cancelled) setSeedError(err.message || 'Seeding failed')
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One-time seed for the Driving Licence (added after initial seeding).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (await get('docsSeededLicence')) return
        if (items.some(d => d.name === 'Driving Licence')) { await dbSet('docsSeededLicence', true); return }
        const res = await fetch(drivingLicenceUrl)
        if (!res.ok) return
        const buf = await (await res.blob()).arrayBuffer()
        const enc = await encryptBytes(vaultKey, buf)
        const id = crypto.randomUUID()
        await dbSet('doc_' + id, enc)
        if (!cancelled) onChange([...items, { id, name: 'Driving Licence', cat: 'Identity', type: 'application/pdf', size: buf.byteLength, addedAt: Date.now() }])
        await dbSet('docsSeededLicence', true)
      } catch (err) {
        console.error('Licence seeding failed', err)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear any open preview when unmounting (vault lock)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 14, color: '#8f97b8' }} />
          <input style={{ paddingLeft: 36 }} placeholder="Search documents..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="name">Sort: Name</option>
          <option value="date">Sort: Date Added</option>
          <option value="size">Sort: File Size</option>
          <option value="cat">Sort: Category</option>
        </select>
        <button className="btn btn-primary" onClick={() => fileRef.current.click()}><Plus size={16} /> Add Document</button>
        <input ref={fileRef} type="file" multiple accept=".pdf,image/*" hidden onChange={e => importFiles([...e.target.files])} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {['All', ...CATEGORIES].map(c => (
          <button key={c} className={`doc-chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {seedError && <p style={{ color: '#ff9aa8' }}>Document loading error: {seedError}</p>}
      {items.length === 0 ? (
        <div className="empty-note" style={{ textAlign: 'center', padding: '50px 0' }}>
          <FolderLock size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
          <p>No documents yet.</p>
          <button className="btn btn-primary" onClick={() => fileRef.current.click()}>Import Documents</button>
          <p style={{ fontSize: '0.8rem', marginTop: 8 }}>Select the 6 files from Desktop → Mine to import them.</p>
        </div>
      ) : (
        ORDER.filter(c => filter === 'All' || filter === c).map(cat => {
          const group = filtered.filter(d => d.cat === cat)
          if (!group.length) return null
          return (
            <div key={cat} style={{ marginBottom: 26 }}>
              <h3 style={{ color: '#8ba2ff', letterSpacing: '0.16em', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 14 }}>{cat}</h3>
              <div className="record-grid">
                {group.map(doc => (
                  <div className="record" key={doc.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      {isImage(doc.type)
                        ? <ImageIcon size={26} color="#b07cff" />
                        : <FileText size={26} color="#7da2ff" />}
                      <div>
                        <h4 style={{ margin: 0 }}>{doc.name}</h4>
                        <span className="chip chip-login">{doc.cat}</span>
                      </div>
                    </div>
                    <div className="field-row"><span className="fl">Type</span><span className="fv">{isImage(doc.type) ? 'Image' : 'PDF'}</span></div>
                    <div className="field-row"><span className="fl">Size</span><span className="fv">{fmtSize(doc.size)}</span></div>
                    <div className="field-row"><span className="fl">Added</span><span className="fv">{new Date(doc.addedAt).toLocaleDateString()}</span></div>
                    <div className="record-actions">
                      <button className="icon-btn" title="Open" onClick={() => openPreview(doc)}><Eye size={16} /></button>
                      <button className="icon-btn" title="Download" onClick={() => download(doc)}><Download size={16} /></button>
                      <button className="icon-btn" title="Delete" style={{ color: '#ff9aa8' }} onClick={() => removeDoc(doc)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
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
