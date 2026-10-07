import React, { useState } from 'react'
import { User, FileText, Settings as SettingsIcon, Lock } from 'lucide-react'
import PersonalSection from './PersonalSection.jsx'
import DocumentsSection from './DocumentsSection.jsx'

const SECTIONS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'documents', label: 'Documents', icon: FileText },
]

export default function VaultDashboard({ vaultKey, data, onDataChange, onLock, onWipe, onChangePassword, busy }) {
  const [tab, setTab] = useState('personal')
  const active = SECTIONS.find(s => s.id === tab)
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')

  return (
    <div className="vault-dash">
      <aside className="vault-side">
        <div className="brand-block">
          <h4>MOHANRAO</h4>
          <span>PRIVATE</span>
        </div>
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <button key={s.id} className={tab === s.id ? 'active' : ''} onClick={() => setTab(s.id)}>
              <Icon size={15} style={{ verticalAlign: -3, marginRight: 8 }} />{s.label.toUpperCase()}
            </button>
          )
        })}
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          <SettingsIcon size={15} style={{ verticalAlign: -3, marginRight: 8 }} />SETTINGS
        </button>
        <button className="lock-vault" onClick={onLock}><Lock size={15} style={{ verticalAlign: -3, marginRight: 8 }} />LOCK VAULT</button>
      </aside>

      <main className="vault-main">
        <div className="kicker">PRIVATE ARCHIVE</div>
        <h2>My Personal Vault</h2>
        <p className="muted">{active ? active.label : 'Settings'} · Encrypted personal information · auto-locks when idle</p>

        {active ? (
          active.id === 'personal' ? (
            <PersonalSection
              data={data.personal && data.personal[0] ? data.personal[0] : null}
              onSave={record => onDataChange({ ...data, personal: [record] })}
              onDelete={() => onDataChange({ ...data, personal: [] })}
            />
          ) : (
            <DocumentsSection
              vaultKey={vaultKey}
              items={data.documents || []}
              onChange={next => onDataChange({ ...data, documents: next })}
            />
          )
        ) : (
          <div style={{ maxWidth: 520 }}>
            <div className="record-form">
              <h4>Change Master Password</h4>
              <input type="password" placeholder="New master password" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <button className="btn btn-primary" disabled={busy || newPass.length < 8} onClick={async () => {
                await onChangePassword(newPass)
                setPassMsg('Master password updated.')
                setNewPass('')
              }}>Update Password</button>
              {passMsg && <div style={{ color: '#4ade80', fontSize: '0.85rem' }}>{passMsg}</div>}
            </div>
            <div className="record-form">
              <h4 style={{ color: '#ff9aa8' }}>Danger Zone</h4>
              <p style={{ color: '#7a7f7a', fontSize: '0.88rem' }}>This permanently destroys the encrypted vault stored on this device.</p>
              <button className="btn btn-ghost" style={{ borderColor: 'rgba(255,138,154,0.4)', color: '#ff9aa8' }} onClick={onWipe}>Wipe Vault</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
