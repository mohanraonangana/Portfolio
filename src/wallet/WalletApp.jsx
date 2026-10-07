import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './wallet.css'
import VaultBackground from './VaultBackground.jsx'
import VaultIntro from './VaultIntro.jsx'
import VaultAuth from './VaultAuth.jsx'
import VaultDashboard from './VaultDashboard.jsx'
import { get, set, clearAll } from './vaultDb.js'
import { deriveKey, encryptObject, decryptObject, randomBytes, EMPTY_VAULT } from './vaultCrypto.js'

const AUTO_LOCK_MS = 5 * 60 * 1000

export default function WalletApp() {
  const [stage, setStage] = useState('intro') // intro | auth | vault
  const [mode, setMode] = useState('unlock')
  const [key, setKey] = useState(null)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const keyRef = useRef(null)
  keyRef.current = key

  const persist = async (nextData, k = key) => {
    setData(nextData)
    if (k) await set('vault', await encryptObject(k, nextData))
  }

  const goAuth = async () => {
    const salt = await get('salt')
    const vault = await get('vault')
    setMode(salt && vault ? 'unlock' : 'create')
    setStage('auth')
  }

  const create = async password => {
    const salt = btoa(String.fromCharCode(...randomBytes(16)))
    const k = await deriveKey(password, salt)
    await set('salt', salt)
    await set('vault', await encryptObject(k, EMPTY_VAULT))
    setKey(k)
    setData(EMPTY_VAULT)
    setStage('vault')
  }

  const unlockVault = async password => {
    const salt = await get('salt')
    const payload = await get('vault')
    const k = await deriveKey(password, salt)
    try {
      const decrypted = await decryptObject(k, payload) // throws on wrong password
      setKey(k)
      setData(decrypted)
      setStage('vault')
    } catch (err) {
      // One-time migration: vault was created under the old PIN '1319'.
      // If the entered PIN is the new one, re-encrypt the old data with it.
      try {
        const oldK = await deriveKey('1319', salt)
        const decrypted = await decryptObject(oldK, payload)
        await set('vault', await encryptObject(k, decrypted))
        // Re-encrypt any stored document blobs with the new key
        if (decrypted.documents) {
          const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
          for (const doc of decrypted.documents) {
            try {
              const enc = await get('doc_' + doc.id)
              if (!enc) continue
              const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(enc.iv) }, oldK, fromB64(enc.ct))
              const iv = crypto.getRandomValues(new Uint8Array(12))
              const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, pt)
              const toB64 = buf => {
                const bytes = new Uint8Array(buf); let bin = ''
                for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
                return btoa(bin)
              }
              await set('doc_' + doc.id, { iv: toB64(iv.buffer), ct: toB64(ct) })
            } catch { /* skip */ }
          }
        }
        setKey(k)
        setData(decrypted)
        setStage('vault')
      } catch {
        throw new Error('wrong-pin')
      }
    }
  }

  const lock = () => {
    setKey(null)
    setData(null)
    setStage('intro')
  }

  const changePassword = async newPass => {
    setBusy(true)
    try {
      const salt = btoa(String.fromCharCode(...randomBytes(16)))
      const k = await deriveKey(newPass, salt)
      await set('salt', salt)
      await set('vault', await encryptObject(k, data))
      setKey(k)
    } finally { setBusy(false) }
  }

  const wipe = async () => {
    await clearAll()
    lock()
  }

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
          <VaultAuth mode={mode} onBack={() => setStage('intro')} onCreate={create} onUnlock={unlockVault} />
        )}
        {stage === 'vault' && data && (
          <VaultDashboard vaultKey={key} data={data} onDataChange={d => persist(d)} onLock={lock} onWipe={wipe} onChangePassword={changePassword} busy={busy} />
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
