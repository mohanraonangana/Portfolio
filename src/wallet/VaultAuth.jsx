import React, { useEffect, useRef, useState } from 'react'
import { LockKeyhole, ArrowLeft } from 'lucide-react'

const CORRECT_PIN = '1108'

export default function VaultAuth({ onBack, onUnlock }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const refs = useRef([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  const reset = () => {
    setDigits(['', '', '', ''])
    setTimeout(() => refs.current[0]?.focus(), 50)
  }

  const validate = async pin => {
    if (pin !== CORRECT_PIN) {
      setError('Incorrect PIN')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setDigits(['', '', '', ''])
      setTimeout(() => refs.current[0]?.focus(), 60)
      return
    }
    setError('')
    setUnlocking(true)
    try {
      await onUnlock(pin)
    } catch {
      setError('Unable to load your vault. Check your connection and try again.')
      setUnlocking(false)
      reset()
    }
  }

  const updateDigit = (i, raw) => {
    const d = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    setError('')
    if (d && i < 3) refs.current[i + 1]?.focus()
    if (d && i === 3) {
      const pin = next.join('')
      if (pin.length === 4) validate(pin)
    }
  }

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[i]) {
        next[i] = ''
        setDigits(next)
      } else if (i > 0) {
        next[i - 1] = ''
        setDigits(next)
        refs.current[i - 1]?.focus()
      }
    }
  }

  const onPaste = e => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pasted) return
    const next = ['', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    setError('')
    if (pasted.length === 4) validate(pasted)
    else refs.current[pasted.length]?.focus()
  }

  return (
    <div className="vault-auth">
      <div className="auth-card pin-card">
        <button type="button" className="back-link" onClick={onBack}><ArrowLeft size={14} /> Back to Vault</button>
        <div className="pin-lock"><LockKeyhole size={28} /></div>
        <h2 style={{ textAlign: 'center', letterSpacing: '0.1em' }}>ENTER PRIVATE VAULT</h2>
        <p style={{ textAlign: 'center' }}>Enter your 4-digit PIN to open your vault.</p>

        <div className={`pin-row ${shake ? 'shake' : ''} ${unlocking ? 'unlocking' : ''}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => (refs.current[i] = el)}
              className="pin-box"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={2}
              value={d ? '•' : ''}
              onChange={e => updateDigit(i, e.target.value)}
              onKeyDown={e => onKeyDown(i, e)}
              onPaste={onPaste}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {error && <div className="error-text" style={{ textAlign: 'center' }}>{error}</div>}
        {unlocking && !error && (
          <div className="unlocking-text">Opening vault…</div>
        )}
      </div>
    </div>
  )
}
