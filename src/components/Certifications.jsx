import React, { useEffect, useRef, useState } from 'react'
import { CERTIFICATES, certAsset } from '../data/certificates.js'
import CertificateModal from './CertificateModal.jsx'

export default function Certifications() {
  const [active, setActive] = useState(null)
  const gridRef = useRef(null)

  useEffect(() => {
    const items = gridRef.current ? Array.from(gridRef.current.querySelectorAll('.cert-card')) : []
    if (!items.length) return
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="certifications">
      <div className="sec-label">CREDENTIALS</div>
      <h2 className="sec-title">Certified<span>.</span></h2>
      <p className="certs-intro">
        Verified certifications and credentials, read directly from the issued documents.
      </p>

      <div className="certs-grid" ref={gridRef}>
        {CERTIFICATES.map((c, i) => {
          const url = certAsset(c.thumb)
          const fullUrl = certAsset(c.full)
          const open = () => fullUrl && setActive(c)
          return (
            <article className="cert-card" key={c.id} style={{ transitionDelay: `${i * 70}ms` }}>
              <div
                className="cert-thumb"
                data-cursor={url ? 'view' : undefined}
                onClick={open}
                onKeyDown={(e) => { if (url && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open() } }}
                role={url ? 'button' : undefined}
                tabIndex={url ? 0 : undefined}
                aria-label={url ? `View ${c.title} certificate` : undefined}
              >
                <span className="cert-thumb-fallback">{c.short || c.issuer}</span>
                {url && (
                  <img
                    src={url}
                    alt={`${c.title} certificate`}
                    loading="lazy"
                    onError={(e) => e.currentTarget.classList.add('is-broken')}
                  />
                )}
                <span className="cert-num">{c.num}</span>
                {url && <span className="cert-thumb-cta">VIEW</span>}
              </div>

              <div className="cert-body">
                <span className="cert-issuer">{c.issuer}</span>
                <h3 className="cert-title">{c.title}</h3>
                {c.subtitle && <p className="cert-subtitle">{c.subtitle}</p>}

                {(c.issued || c.valid || c.duration || c.institution || c.supportedBy) && (
                  <div className="cert-meta">
                    {c.issued && <div><span>ISSUED</span><strong>{c.issued}</strong></div>}
                    {c.duration && <div><span>DURATION</span><strong>{c.duration}</strong></div>}
                    {c.institution && <div><span>INSTITUTION</span><strong>{c.institution}</strong></div>}
                    {c.supportedBy && <div><span>SUPPORTED BY</span><strong>{c.supportedBy}</strong></div>}
                    {c.valid && <div><span>VALID</span><strong>{c.valid}</strong></div>}
                  </div>
                )}

                {c.credentialId && (
                  <div className="cert-id">
                    <span>{c.credentialLabel}</span>
                    <code>{c.credentialId}</code>
                  </div>
                )}

                <div className="cert-actions">
                  {url && (
                    <button type="button" className="cert-link" onClick={open}>
                      VIEW CERTIFICATE <span className="arrow">↗</span>
                    </button>
                  )}
                  {c.verify && (
                    <a className="cert-link verify" href={c.verify} target="_blank" rel="noopener noreferrer">
                      VERIFY <span className="arrow">↗</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {active && (
        <CertificateModal cert={active} url={certAsset(active.full)} onClose={() => setActive(null)} />
      )}
    </section>
  )
}
