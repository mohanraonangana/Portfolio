import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './wallet.css'
import VaultBackground from './VaultBackground.jsx'
import VaultIntro from './VaultIntro.jsx'
import VaultAuth from './VaultAuth.jsx'
import VaultDashboard from './VaultDashboard.jsx'
import { isSyncEnabled } from './supabaseClient.js'
import { listDocuments, getPersonal, savePersonal, wipeAllCloud } from './vaultSync.js'
import { rowToDoc } from './vaultData.js'

const AUTO_LOCK_MS = 5 * 60 * 1000
const EMPTY_VAULT = { personal: [], documents: [] }

export default function WalletApp() {
  const [stage, setStage] = useState('intro') // intro | auth | vault
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  // Fetch the whole vault from Supabase. This is the only source of truth.
  const loadFromCloud = async () => {
    const [rows, personal] = await Promise.all([
      listDocuments().catch(() => []),
      getPersonal().catch(() => null),
    ])
    return {
      personal: personal ? [personal] : [],
      documents: (rows || []).map(rowToDoc),
    }
  }

  const goAuth = () => setStage('auth')

  const unlock = async () => {
    const next = isSyncEnabled ? await loadFromCloud() : EMPTY_VAULT
    setData(next)
    setStage('vault')
  }

  // Keep Supabase in sync with the in-memory vault. Documents persist their own
  // metadata rows from DocumentsSection, so only personal info is written here.
  const persist = async next => {
    setData(next)
    if (!isSyncEnabled) return
    try {
      const record = next.personal && next.personal[0]
      const hadRecord = data && data.personal && data.personal[0]
      // Write only when a record actually exists, or when the user is explicitly
      // clearing a record that was previously loaded. This stops an empty or
      // not-yet-loaded vault from overwriting saved personal info with {}.
      if (record) await savePersonal(record)
      else if (hadRecord) await savePersonal({})
    } catch { /* stays in memory for this session */ }
  }

  const wipe = async () => {
    setBusy(true)
    try { await wipeAllCloud(data?.documents || []) } finally { setBusy(false) }
    setData(EMPTY_VAULT)
    setStage('vault')
  }

  const lock = () => { setData(null); setStage('intro') }

  // Auto-lock on inactivity
  useEffect(() => {
    if (stage !== 'vault') return
    let timer = setTimeout(lock, AUTO_LOCK_MS)
    const reset = () => { clearTimeout(timer); timer = setTimeout(lock, AUTO_LOCK_MS) }
    const events = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach(e => addEventListener(e, reset))
    return () => { clearTimeout(timer); events.forEach(e => removeEventListener(e, reset)) }
  }, [stage])

  return (
    <div className="wallet-root">
      <div className="wallet-glow" />
      <VaultBackground />
      <div className="wallet-content">
        {stage === 'intro' && <VaultIntro onEnter={goAuth} />}
        {stage === 'auth' && (
          <VaultAuth onBack={() => setStage('intro')} onUnlock={unlock} />
        )}
        {stage === 'vault' && data && (
          <VaultDashboard data={data} onDataChange={persist} onLock={lock} onWipe={wipe} busy={busy} />
        )}
        {stage !== 'vault' && (
          <div style={{ position: 'fixed', top: 18, left: 22, zIndex: 5 }}>
            <Link to="/" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>← Portfolio</Link>
          </div>
        )}
      </div>
    </div>
  )
}
