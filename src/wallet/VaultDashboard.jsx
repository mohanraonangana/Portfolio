import React, { useState } from 'react'
import { User, FileText, Settings as SettingsIcon, Lock } from 'lucide-react'
import PersonalSection from './PersonalSection.jsx'
import DocumentsSection from './DocumentsSection.jsx'
import BackupSection from './BackupSection.jsx'

const SECTIONS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'documents', label: 'Documents', icon: FileText },
]

export default function VaultDashboard({ data, onDataChange, onLock, onWipe, busy }) {
  const [tab, setTab] = useState('personal')
  const active = SECTIONS.find(s => s.id === tab)

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
        <p className="muted">{active ? active.label : 'Settings'} · Stored in Supabase · auto-locks when idle</p>

        {active ? (
          active.id === 'personal' ? (
            <PersonalSection
              data={data.personal && data.personal[0] ? data.personal[0] : null}
              onSave={record => onDataChange({ ...data, personal: [record] })}
              onDelete={() => onDataChange({ ...data, personal: [] })}
            />
          ) : (
            <DocumentsSection
              items={data.documents || []}
              onChange={next => onDataChange({ ...data, documents: next })}
            />
          )
        ) : (
          <div style={{ maxWidth: 520 }}>
            <div className="record-form">
              <h4>Access PIN</h4>
              <p style={{ color: '#7a7f7a', fontSize: '0.88rem' }}>
                Your vault is stored in Supabase and opens with a 4-digit PIN. The PIN is a local
                screen lock only — it does not encrypt your data or restrict access on the server.
              </p>
            </div>
            <BackupSection data={data} onDataChange={onDataChange} />
            <div className="record-form">
              <h4 style={{ color: '#ff9aa8' }}>Danger Zone</h4>
              <p style={{ color: '#7a7f7a', fontSize: '0.88rem' }}>This permanently deletes your personal details and all documents from Supabase.</p>
              <button className="btn btn-ghost" style={{ borderColor: 'rgba(255,138,154,0.4)', color: '#ff9aa8' }} disabled={busy} onClick={onWipe}>Delete All Vault Data</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
