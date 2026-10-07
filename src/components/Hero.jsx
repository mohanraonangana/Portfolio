import React from 'react'
import { GithubIcon, LinkedinIcon, InstagramIcon } from './BrandIcons.jsx'
import me from '../assets/hero.jpg'
import HeroVideo from './HeroVideo.jsx'

export default function Hero() {
  return (
    <section id="home" className="hero">
      <HeroVideo />
      <div className="hero-label">JAVA FULL STACK DEVELOPER · 2026</div>
      <h1>MOHAN<span className="hollow">RAO</span></h1>
      <p className="hero-sub">Building scalable backend systems and modern web applications with Java and Spring Boot.</p>
      <div className="hero-tech">JAVA • SPRING BOOT • SPRING MVC • REST APIs • MYSQL • AWS</div>

      <div className="hero-body">
        <div className="hero-frame">
          <img src={me} alt="Mohanrao" className="hero-img" decoding="async" />
        </div>
        <div>
          <p style={{ color: 'var(--muted)', maxWidth: 460, lineHeight: 1.8 }}>
            Java Full Stack Developer focused on scalable backend systems and production-ready web applications — built on Java, Spring Boot, REST APIs and clean architecture.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="btn-solid">EXPLORE MY WORK</a>
            <a href="#contact" className="btn-line">LET'S CONNECT</a>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 26 }}>
            <a href="https://github.com/mohanraonangana" target="_blank" rel="noreferrer"><GithubIcon size={18} /></a>
            <a href="https://www.linkedin.com/in/mohanrao-nangana-24508b275" target="_blank" rel="noreferrer"><LinkedinIcon size={18} /></a>
            <a href="https://www.instagram.com/mohanrao___1319" target="_blank" rel="noreferrer"><InstagramIcon size={18} /></a>
          </div>
        </div>
      </div>
      <div className="scroll-hint">SCROLL ↓</div>
    </section>
  )
}
