import React, { useRef, useState } from 'react'
import { createBackup, restoreBackup } from './vaultBackup.js'

export default function BackupSection({ data, onDataChange }) {
  const [exportPass, setExportPass] = useState('')
  const [importPass, setImportPass] = useState('')
  const [fileText, setFileText] = useState('')
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // {ok, text}
  const fileRef = useRef(null)

  const doExport = async () => {
    setBusy(true); setMsg(null)
    try {
      const json = await createBackup({ data, passphrase: exportPass })
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `vault-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setExportPass('')
      setMsg({ ok: true, text: 'Encrypted backup exported. Keep the passphrase safe; it cannot be recovered.' })
    } catch (e) {
      setMsg({ ok: false, text: 'Export failed: ' + (e.message || 'unknown error') })
    } finally { setBusy(false) }
  }

  const pickFile = async e => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setFileName(f.name)
    setFileText(await f.text())
  }

  const doImport = async () => {
    setBusy(true); setMsg(null)
    try {
      const s = await restoreBackup({ text: fileText, passphrase: importPass, data, onDataChange })
      const parts = []
      if (s.added.length) parts.push(`added: ${s.added.join(', ')}`)
      if (s.personal) parts.push('personal information restored')
      if (s.skipped.length) parts.push(`already present: ${s.skipped.join(', ')}`)
      setMsg({ ok: true, text: 'Restore complete. ' + (parts.join(' · ') || 'Nothing to import.') })
      setImportPass(''); setFileText(''); setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Restore failed.' })
    } finally { setBusy(false) }
  }

  return (
    <div className="record-form">
      <h4>Backup &amp; Restore</h4>
      <p style={{ color: '#7a7f7a', fontSize: '0.88rem' }}>
        Export your personal details and document metadata as one encrypted file, protected by a
        passphrase you choose (not your PIN). Document files themselves stay in your Supabase vault.
        Import merges metadata back in without creating duplicates.
      </p>

      <input type="password" placeholder="Backup passphrase (min 8 characters)" autoComplete="new-password" value={exportPass} onChange={e => setExportPass(e.target.value)} />
      <button className="btn btn-primary" disabled={busy || exportPass.length < 8} onClick={doExport}>Export Encrypted Backup</button>

      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }} />

      <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={pickFile} />
      <button className="btn btn-ghost" disabled={busy} onClick={() => fileRef.current.click()}>{fileName ? `Selected: ${fileName}` : 'Choose Backup File'}</button>
      <input type="password" placeholder="Backup passphrase" autoComplete="off" value={importPass} onChange={e => setImportPass(e.target.value)} />
      <button className="btn btn-primary" disabled={busy || !fileText || !importPass} onClick={doImport}>Import &amp; Merge Backup</button>

      {msg && <div style={{ color: msg.ok ? '#4ade80' : '#ff9aa8', fontSize: '0.85rem' }}>{msg.text}</div>}
    </div>
  )
}
