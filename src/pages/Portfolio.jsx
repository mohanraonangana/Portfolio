import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Skills from '../components/Skills.jsx'
import Projects from '../components/Projects.jsx'
import Experience from '../components/Experience.jsx'
import Contact from '../components/Contact.jsx'
import FxBackground from '../components/FxBackground.jsx'
import Cursor from '../components/Cursor.jsx'

export default function Portfolio() {
  return (
    <>
      <FxBackground />
      <Cursor />
      <div className="progress-line" style={{ width: 0 }} />
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
      <footer>
        <div>MOHANRAO — Built with curiosity.</div>
        <div className="footer-links">
          <a href="https://github.com/mohanraonangana" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/mohanrao-nangana-24508b275" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/mohanrao___1319" target="_blank" rel="noreferrer">Instagram</a>
        </div>
        <div>© 2026</div>
      </footer>
    </>
  )
}
