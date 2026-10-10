import React, { useEffect } from 'react'

export default function CertificateModal({ cert, url, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const meta = [cert.issued, cert.duration, cert.valid].filter(Boolean).join(' · ')

  return (
    <div
      className="cert-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${cert.title} certificate preview`}
    >
      <div className="cert-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cert-modal-close" onClick={onClose} aria-label="Close preview">✕</button>
        <div className="cert-modal-head">
          <span className="cert-issuer">{cert.issuer}</span>
          <h3>{cert.title}</h3>
        </div>
        <div className="cert-modal-img">
          {url && <img src={url} alt={`${cert.title} — certificate issued by ${cert.issuer}`} />}
        </div>
        <div className="cert-modal-foot">
          {meta && <span>{meta}</span>}
          {cert.credentialId && <span>{cert.credentialLabel}: {cert.credentialId}</span>}
          {cert.verify && (
            <a href={cert.verify} target="_blank" rel="noopener noreferrer">VERIFY ↗</a>
          )}
        </div>
      </div>
    </div>
  )
}
