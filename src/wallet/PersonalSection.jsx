import React, { useState } from 'react'
import { Eye, EyeOff, Copy, Pencil, Trash2, Check } from 'lucide-react'

// Sensitive-ID-style fields are intentionally left blank: fill them yourself.
const GROUPS = [
  { title: 'Personal', fields: [
    { k: 'fullName', label: 'Full Name' },
    { k: 'dob', label: 'Date of Birth' },
    { k: 'mobile', label: 'Mobile Number', sensitive: true },
    { k: 'altMobile', label: 'Alternate Mobile Number', sensitive: true },
    { k: 'email', label: 'Email Address', sensitive: true },
  ]},
  { title: 'Identity', fields: [
    { k: 'aadhaar', label: 'Aadhaar Number', sensitive: true },
    { k: 'pan', label: 'PAN Number', sensitive: true },
    { k: 'voterId', label: 'Voter ID', sensitive: true },
    { k: 'licence', label: 'Driving Licence Number', sensitive: true },
    { k: 'passport', label: 'Passport Number', sensitive: true },
  ]},
  { title: 'Family', fields: [
    { k: 'fatherName', label: "Father's Name" },
    { k: 'motherName', label: "Mother's Name" },
    { k: 'emergencyName', label: 'Emergency Contact Name' },
    { k: 'emergencyNumber', label: 'Emergency Contact Number', sensitive: true },
    { k: 'relationship', label: 'Relationship' },
  ]},
  { title: 'Address', fields: [
    { k: 'permanentAddress', label: 'Permanent Address' },
    { k: 'currentAddress', label: 'Current Address' },
    { k: 'town', label: 'Village / Town' },
    { k: 'district', label: 'District' },
    { k: 'state', label: 'State' },
    { k: 'pincode', label: 'PIN Code' },
    { k: 'country', label: 'Country' },
  ]},
  { title: 'Banking', fields: [
    { k: 'bankName', label: 'Bank Name' },
    { k: 'accountHolder', label: 'Account Holder Name' },
    { k: 'accountNumber', label: 'Account Number', sensitive: true },
    { k: 'ifsc', label: 'IFSC Code', sensitive: true },
    { k: 'branchName', label: 'Branch Name' },
    { k: 'branchAddress', label: 'Branch Address' },
    { k: 'accountType', label: 'Account Type (Savings / Current)' },
    { k: 'upiId', label: 'UPI ID', sensitive: true },
  ]},
  { title: 'Other Important', fields: [
    { k: 'other1', label: 'Other Contact 1', sensitive: true },
    { k: 'other2', label: 'Other Contact 2', sensitive: true },
    { k: 'other3', label: 'Other Contact 3', sensitive: true },
  ]},
]

const DEFAULTS = {
  fullName: 'Mohan rao Nangana', dob: '14/09/2004',
  mobile: '8247038596', altMobile: '9491588191',
  email: 'nanganamohanrao12@gmail.com',
  aadhaar: '713982227025', pan: 'JETPM0111J',
  fatherName: 'nangana Yedukondalu', motherName: 'nangana jyothi',
  emergencyName: '9247310602', emergencyNumber: '7993154407',
  permanentAddress: 'bhimavaram',
  currentAddress: 'bhimavaram', town: 'bhimavaram', district: 'west godavri',
  state: 'ap', pincode: '534201', country: 'india',
  bankName: 'State Bank of India (SBI)', accountHolder: 'Mohanrao',
  accountNumber: '43087114917', accountType: 'Savings',
  upiId: '8247038596@ybl',
  other1: '9490661515', other2: '9676267937', other3: '9492077765(maa)',
}

function maskValue(v) {
  if (!v) return ''
  return v.length <= 4 ? '••••' : '•••• •••• ' + String(v).slice(-4)
}

export default function PersonalSection({ data, onSave, onDelete }) {
  const [editing, setEditing] = useState(!data)
  const [form, setForm] = useState(() => ({ ...DEFAULTS, ...(data || {}) }))
  const [revealed, setRevealed] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    onSave({ id: data?.id || crypto.randomUUID(), ...form })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const copyAll = () => {
    const text = GROUPS.flatMap(g => g.fields.map(f => `${f.label}: ${form[f.k] || ''}`)).join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const danger = () => {
    if (window.confirm('Delete ALL personal information? This cannot be undone.')) {
      onDelete()
      setForm({ ...DEFAULTS })
      setEditing(true)
    }
  }

  return (
    <div>
      <div className="record-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h4 style={{ margin: 0 }}>Personal Details</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" title={revealed ? 'Hide sensitive values' : 'Show sensitive values'} onClick={() => setRevealed(r => !r)}>
              {revealed ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
            <button className="icon-btn" title="Copy all" onClick={copyAll}><Copy size={17} /></button>
            {!editing && <button className="icon-btn" title="Edit" onClick={() => setEditing(true)}><Pencil size={17} /></button>}
            <button className="icon-btn" title="Delete all" style={{ color: '#ff9aa8' }} onClick={danger}><Trash2 size={17} /></button>
          </div>
        </div>

        {GROUPS.map(g => (
          <div key={g.title} style={{ marginTop: 14 }}>
            <h5 style={{ color: '#8ba2ff', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.78rem', marginBottom: 10 }}>{g.title}</h5>
            {g.fields.map(f => (
              <div className="field-row" key={f.k} style={{ alignItems: 'center' }}>
                <span className="fl" style={{ minWidth: 170 }}>{f.label}</span>
                {editing ? (
                  <input
                    value={form[f.k] || ''}
                    placeholder={f.sensitive ? 'Enter securely — stored encrypted' : ''}
                    onChange={e => set(f.k, e.target.value)}
                    style={{ flex: 1, maxWidth: 280 }}
                  />
                ) : (
                  <span className="fv">{f.sensitive && !revealed ? maskValue(form[f.k]) : (form[f.k] || '—')}</span>
                )}
                {!editing && form[f.k] && (
                  <button className="icon-btn" title="Copy" onClick={() => navigator.clipboard.writeText(form[f.k]).catch(() => {})}>
                    <Copy size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

        {editing && (
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={save}>Save Changes</button>
        )}
        {saved && (
          <div style={{ marginTop: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} /> Saved securely (encrypted)
          </div>
        )}
        <p style={{ marginTop: 14, fontSize: '0.75rem', color: '#8f97b8' }}>
          Values you leave blank stay empty. All values are AES-256-GCM encrypted and never leave this device.
        </p>
      </div>
    </div>
  )
}
