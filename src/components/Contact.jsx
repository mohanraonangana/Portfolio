import React from 'react'

export default function Contact() {
  return (
    <section id="contact">
      <div className="sec-label">CONTACT</div>
      <h2 className="contact-big">LET'S BUILD<br />SOMETHING<span>.</span></h2>
      <p style={{ color: 'var(--muted)', marginTop: 24, maxWidth: 480, lineHeight: 1.8 }}>
        Have an idea, project or opportunity? I'd love to hear from you.
      </p>
      <a className="mega-btn" href="mailto:nanganamohanrao12@gmail.com">START A CONVERSATION →</a>
      <div className="contact-links">
        <a href="mailto:nanganamohanrao12@gmail.com">EMAIL</a>
        <a href="https://github.com/mohanraonangana" target="_blank" rel="noreferrer">GITHUB</a>
        <a href="https://www.linkedin.com/in/mohanrao-nangana-24508b275" target="_blank" rel="noreferrer">LINKEDIN</a>
        <a href="https://www.instagram.com/mohanrao___1319" target="_blank" rel="noreferrer">INSTAGRAM</a>
      </div>
    </section>
  )
}
