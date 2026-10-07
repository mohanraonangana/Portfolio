import React from 'react'
import { LockKeyhole } from 'lucide-react'

export default function VaultIntro({ onEnter }) {
  return (
    <div className="vault-intro">
      <div className="vi-label">MOHANRAO / PRIVATE</div>
      <div className="vi-lock"><LockKeyhole size={30} /></div>
      <h1>PERSONAL<br /><span className="hollow">VAULT</span></h1>
      <div className="vi-line" />
      <p>Your private information. Secured.</p>
      <button className="vi-btn" onClick={onEnter}>ENTER VAULT →</button>
      <p className="vi-foot">AES-256-GCM · PBKDF2 · ZERO-KNOWLEDGE · ON-DEVICE ONLY</p>
    </div>
  )
}
