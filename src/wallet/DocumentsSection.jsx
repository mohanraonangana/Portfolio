import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Eye, Download, Trash2, Plus, Search, X, ZoomIn, ZoomOut, Maximize2, FolderLock, RefreshCw, AlertTriangle } from 'lucide-react'
import { isSyncEnabled, SYNC_BUCKET } from './supabaseClient.js'
import { uploadDocument, createSignedUrl, removeObject, upsertDocumentMeta, deleteDocumentMeta, listDocuments } from './vaultSync.js'
import { KNOWN, CATEGORIES, ORDER, extFor, typeLabel, fmtSize, isImage, rowToDoc, docToRow } from './vaultData.js'

// SHA-256 of raw bytes, hex-encoded. Used to record byte-for-byte integrity.
async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function DocumentsSection({ items, onChange }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [preview, setPreview] = useState(null) // {doc, url, state, error}
  const [zoom, setZoom] = useState(1)
  const [thumbUrls, setThumbUrls] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const thumbRef = useRef(thumbUrls)
  thumbRef.current = thumbUrls

  const flash = msg => { setNotice(msg); setTimeout(() => setNotice(''), 4000) }

  // Pull document metadata from Supabase and merge it into the list so files
  // appear after a refresh and stay in sync across devices.
  const loadRemote = async () => {
    if (!isSyncEnabled) return
    setLoading(true); setLoadError('')
    try {
      const rows = await listDocuments()
      const remote = (rows || []).map(rowToDoc)
      const byId = new Map()
      for (const d of itemsRef.current) byId.set(d.id, d)
      for (const r of remote) byId.set(r.id, { ...(byId.get(r.id) || {}), ...r })
      const merged = [...byId.values()].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      const sig = xs => JSON.stringify(xs.map(d => [d.id, d.storagePath || '', d.size, d.type, d.originalName || '']))
      if (sig(merged) !== sig(itemsRef.current)) await onChangeRef.current(merged)
    } catch {
      setLoadError('Could not load documents from Supabase.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadRemote() }, [])

  // Generate (and refresh) signed thumbnails for image documents.
  const thumbSig = items.filter(d => isImage(d.type) && d.storagePath).map(d => d.id + '|' + d.storagePath).join(';')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isSyncEnabled) return
    let cancelled = false
    ;(async () => {
      for (const d of itemsRef.current) {
        if (!isImage(d.type) || !d.storagePath || thumbRef.current[d.id]) continue
        try {
          const url = await createSignedUrl(d.storagePath, { expiresIn: 900 })
          if (url && !cancelled) { thumbRef.current = { ...thumbRef.current, [d.id]: url }; setThumbUrls(thumbRef.current) }
        } catch { /* keep the icon fallback */ }
      }
    })()
    return () => { cancelled = true }
  }, [thumbSig])

  const refreshThumb = async doc => {
    if (!doc.storagePath) return
    try {
      const url = await createSignedUrl(doc.storagePath, { expiresIn: 900 })
      if (url) { thumbRef.current = { ...thumbRef.current, [doc.id]: url }; setThumbUrls(thumbRef.current) }
    } catch { /* ignore */ }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    let list = items.filter(d =>
      (filter === 'All' || d.cat === filter) &&
      (d.name || '').toLowerCase().includes(q)
    )
    list = [...list].sort((a, b) =>
      sort === 'name' ? (a.name || '').localeCompare(b.name || '') :
      sort === 'size' ? b.size - a.size :
      sort === 'date' ? b.addedAt - a.addedAt :
      ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat)
    )
    return list
  }, [items, filter, query, sort])

  const importFiles = async files => {
    const next = [...items]
    const revoke = [] // superseded docs whose stored copies should be removed
    for (const file of files) {
      const known = KNOWN.find(k => k.match.test(file.name))
      const id = crypto.randomUUID()
      const originalName = file.name
      const mime = file.type || 'application/octet-stream'
      const displayName = known ? known.name : file.name.replace(/\.[^.]+$/, '')
      const sha256 = await sha256Hex(await file.arrayBuffer())

      // Supabase is the only store: upload the original bytes unchanged with the
      // real content type, then record the metadata row.
      let storagePath
      try {
        storagePath = await uploadDocument(id, originalName, file)
        await upsertDocumentMeta({
          id, display_name: displayName, original_name: originalName,
          mime_type: mime, size: file.size, bucket: SYNC_BUCKET,
          storage_path: storagePath, sha256,
        })
      } catch {
        flash(`Upload failed for "${originalName}". Check your connection and try again.`)
        continue
      }

      // Documents flagged `replace` (Driving Licence) keep a single current copy:
      // drop the old entry and remove its stored file.
      if (known && known.replace) {
        for (const old of next.filter(d => d.name === known.name)) revoke.push(old)
        for (let i = next.length - 1; i >= 0; i--) if (next[i].name === known.name) next.splice(i, 1)
      }
      next.unshift({
        id, name: displayName, cat: known ? known.cat : 'Personal', type: mime,
        size: file.size, addedAt: Date.now(),
        originalName, storagePath, bucket: SYNC_BUCKET, sha256,
      })
    }
    await onChange(next)
    for (const old of revoke) {
      try { if (old.storagePath) await removeObject(old.storagePath) } catch { /* ignore */ }
      try { await deleteDocumentMeta(old.id) } catch { /* ignore */ }
    }
  }

  // Resolve a viewable URL via a fresh signed URL.
  const resolveUrl = async doc => {
    if (!isSyncEnabled || !doc.storagePath) throw new Error('missing')
    const url = await createSignedUrl(doc.storagePath, { expiresIn: 900 })
    if (!url) throw new Error('missing')
    return url
  }

  const openPreview = async doc => {
    setZoom(1)
    setPreview({ doc, url: null, state: 'loading', error: '' })
    try {
      const url = await resolveUrl(doc)
      setPreview(p => (p && p.doc.id === doc.id ? { ...p, url, state: 'ready' } : p))
    } catch {
      setPreview(p => (p && p.doc.id === doc.id
        ? { ...p, state: 'error', error: 'Could not load this file. It may have been deleted or moved.' }
        : p))
    }
  }

  const retryPreview = () => { if (preview) openPreview(preview.doc) }

  // If a signed URL expires while the viewer is open, transparently re-sign once.
  const onMediaError = async () => {
    if (!preview || preview.state !== 'ready') return
    try {
      const url = await resolveUrl(preview.doc)
      setPreview(p => (p ? { ...p, url, state: 'ready' } : p))
    } catch {
      setPreview(p => (p ? { ...p, state: 'error', error: 'The preview link expired and could not be refreshed.' } : p))
    }
  }

  const triggerDownload = (url, filename, revoke) => {
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.rel = 'noopener'
    document.body.appendChild(a); a.click(); a.remove()
    if (revoke) setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const download = async doc => {
    const filename = doc.originalName || (doc.name + extFor(doc.type))
    try {
      const url = await createSignedUrl(doc.storagePath, { expiresIn: 300, download: filename })
      if (!url) throw new Error('missing')
      triggerDownload(url, filename, false)
    } catch {
      flash('Download failed — the file may have been deleted.')
    }
  }

  const removeDoc = async doc => {
    if (!window.confirm(`Delete "${doc.name}" from your vault?`)) return
    onChange(items.filter(d => d.id !== doc.id))
    try { if (doc.storagePath) await removeObject(doc.storagePath) } catch { /* ignore */ }
    try { await deleteDocumentMeta(doc.id) } catch { /* ignore */ }
  }

  const closePreview = () => {
    if (preview?.url?.startsWith('blob:')) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  // Revoke any blob URL when the preview changes or the section unmounts (lock).
  useEffect(() => () => { if (preview?.url?.startsWith('blob:')) URL.revokeObjectURL(preview.url) }, [preview])

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
        {isSyncEnabled && (
          <button className="icon-btn" title="Refresh from Supabase" onClick={loadRemote} disabled={loading} style={{ padding: '0 12px', height: 40 }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        )}
        <button className="btn btn-primary doc-add" onClick={() => fileRef.current.click()}><Plus size={16} /> Add Document</button>
        <input ref={fileRef} type="file" multiple accept=".pdf,image/*" hidden onChange={e => { importFiles([...e.target.files]); e.target.value = '' }} />
      </div>

      <div className="doc-chips">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} className={`doc-chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {notice && <div className="doc-toast"><AlertTriangle size={15} /> {notice}</div>}

      {loadError && (
        <div className="doc-loaderr">
          <AlertTriangle size={16} />
          <span>{loadError}</span>
          <button className="icon-btn" onClick={loadRemote}><RefreshCw size={14} /><span className="act-label">Retry</span></button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="empty-note" style={{ textAlign: 'center', padding: '50px 0' }}>
          <div className="spinner" />
          <p style={{ marginTop: 14 }}>Loading your documents…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-note" style={{ textAlign: 'center', padding: '50px 0' }}>
          <FolderLock size={40} style={{ opacity: 0.5, marginBottom: 12 }} />
          <p>No documents yet.</p>
          <button className="btn btn-primary" onClick={() => fileRef.current.click()}>Import Documents</button>
          <p style={{ fontSize: '0.8rem', marginTop: 8 }}>{isSyncEnabled ? 'Files are stored in your Supabase vault in their original format.' : 'Cloud storage is not configured.'}</p>
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
                      <div className="doc-thumb">
                        {isImage(doc.type) && thumbUrls[doc.id]
                          ? <img src={thumbUrls[doc.id]} alt={doc.originalName || doc.name} loading="lazy" onError={() => refreshThumb(doc)} />
                          : isImage(doc.type)
                            ? <ImageIcon size={26} color="#b07cff" />
                            : <FileText size={26} color="#7da2ff" />}
                      </div>
                      <div className="doc-card-title">
                        <h4 style={{ margin: 0 }}>{doc.name}</h4>
                        <span className="chip chip-login">{doc.cat}</span>
                      </div>
                    </div>
                    {doc.originalName && <div className="doc-file" title={doc.originalName}>{doc.originalName}</div>}
                    <div className="field-row"><span className="fl">Type</span><span className="fv">{typeLabel(doc.type)}</span></div>
                    <div className="field-row"><span className="fl">Size</span><span className="fv">{fmtSize(doc.size)}</span></div>
                    <div className="field-row"><span className="fl">Added</span><span className="fv">{new Date(doc.addedAt).toLocaleDateString()}</span></div>
                    <div className="record-actions">
                      <button className="icon-btn" title="View" onClick={() => openPreview(doc)}><Eye size={16} /><span className="act-label">View</span></button>
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
        <div className="modal-backdrop" onClick={closePreview}>
          <div className="doc-viewer" onClick={e => e.stopPropagation()}>
            <div className="doc-viewer-head">
              <h3 title={preview.doc.originalName || preview.doc.name}>{preview.doc.originalName || preview.doc.name}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {preview.state === 'ready' && !isImage(preview.doc.type) && (<>
                  <button className="icon-btn" title="Zoom in" onClick={() => setZoom(z => Math.min(z + 0.25, 3))}><ZoomIn size={18} /></button>
                  <button className="icon-btn" title="Zoom out" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}><ZoomOut size={18} /></button>
                </>)}
                <button className="icon-btn" title="Fullscreen" onClick={() => document.querySelector('.doc-viewer')?.requestFullscreen?.()}><Maximize2 size={18} /></button>
                <button className="icon-btn" title="Download" onClick={() => download(preview.doc)}><Download size={18} /></button>
                <button className="icon-btn" title="Close" onClick={closePreview}><X size={18} /></button>
              </div>
            </div>
            <div className="doc-viewer-body" style={{ zoom }}>
              {preview.state === 'loading' && (
                <div className="doc-viewer-msg"><div className="spinner" /><p>Loading preview…</p></div>
              )}
              {preview.state === 'error' && (
                <div className="doc-viewer-msg">
                  <AlertTriangle size={28} />
                  <p>{preview.error}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={retryPreview}><RefreshCw size={14} /> Retry</button>
                    <button className="btn btn-ghost" onClick={closePreview}>Close</button>
                  </div>
                </div>
              )}
              {preview.state === 'ready' && (isImage(preview.doc.type)
                ? <img src={preview.url} alt={preview.doc.originalName || preview.doc.name} onError={onMediaError} />
                : <iframe title={preview.doc.name} src={preview.url} onError={onMediaError} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
