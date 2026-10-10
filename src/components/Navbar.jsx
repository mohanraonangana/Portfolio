import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

const ITEMS = [
  ['HOME', '#home'], ['ABOUT', '#about'], ['SKILLS', '#skills'],
  ['WORK', '#projects'], ['CERTS', '#certifications'],
  ['EXPERIENCE', '#experience'], ['CONTACT', '#contact'],
]

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const [active, setActive] = useState('#home')
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > 500 && y > lastY)
      setLastY(y)
      let cur = '#home'
      for (const [, id] of ITEMS) {
        const el = document.querySelector(id)
        if (el && el.getBoundingClientRect().top <= 200) cur = id
      }
      setActive(cur)
      const p = document.documentElement
      const bar = document.querySelector('.progress-line')
      if (bar) bar.style.width = (y / (p.scrollHeight - p.clientHeight) * 100) + '%'
    }
    onScroll()
    addEventListener('scroll', onScroll)
    return () => removeEventListener('scroll', onScroll)
  }, [lastY])

  return (
    <nav className={`nav ${hidden ? 'hidden' : ''}`}>
      <a href="#home" className="nav-logo">MOHAN<em>RAO</em></a>
      <ul className="nav-links">
        {ITEMS.map(([label, id]) => (
          <li key={id}><a href={id} className={active === id ? 'active' : ''}>{label}</a></li>
        ))}
      </ul>
      <Link to="/wallet" className="wallet-chip"><Lock size={13} /> WALLET</Link>
    </nav>
  )
}
