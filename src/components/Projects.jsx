import React from 'react'

const PROJECTS = [
  {
    num: '01',
    name: 'JOB PORTAL',
    desc: 'A full-stack recruitment platform designed to connect job seekers and employers through a structured hiring workflow.',
    features: ['User & Recruiter Authentication', 'Job Posting & Management', 'Job Search & Filtering', 'Job Applications', 'Application Tracking', 'Role-based Access'],
    tech: ['Java', 'Spring Boot', 'REST APIs', 'MySQL'],
    role: 'Full Stack Development',
    type: 'Web Application',
    github: 'https://github.com/mohanraonangana/Job-Portal',
    live: null,
  },
  {
    num: '02',
    name: 'NKL SEAFOODS',
    desc: 'A business-focused seafood platform designed to showcase products, organize product information and support customer enquiries.',
    features: ['Seafood Product Catalogue', 'Product Categories', 'Product Details', 'Pricing', 'Customer Enquiries', 'Product Management'],
    tech: ['Spring Boot', 'Thymeleaf', 'MySQL', 'Java'],
    role: 'Full Stack Development',
    type: 'E-Commerce / Business Platform',
    github: 'https://github.com/mohanraonangana/NklSeafoods1',
    live: null,
  },
  {
    num: '03',
    name: 'HEALTH & NUTRIENT MANAGEMENT SYSTEM',
    desc: 'A database-driven health management application designed to organize health information, diet plans and nutrient-related data.',
    features: ['User Management', 'Health Information', 'Diet Plan Management', 'Nutrient Tracking', 'Database Management', 'Interactive Dashboard'],
    tech: ['Java', 'Spring Boot', 'MySQL'],
    role: 'Full Stack Development',
    type: 'Health & Nutrition Platform',
    github: 'https://github.com/mohanraonangana/HN_Project',
    live: null,
  },
]

export default function Projects() {
  return (
    <section id="projects">
      <div className="sec-label">SELECTED WORK</div>
      <h2 className="sec-title">Projects<span>.</span></h2>
      {PROJECTS.map(p => (
        <div className="project" key={p.num} data-cursor="view">
          <div className="project-head">
            <span className="project-num">{p.num}</span>
            <h3>{p.name}</h3>
          </div>
          <p className="project-desc">{p.desc}</p>

          <div className="project-block">
            <h4>KEY FEATURES</h4>
            <ul className="feature-grid">
              {p.features.map(f => (
                <li key={f}><span className="dot" />{f}</li>
              ))}
            </ul>
          </div>

          <div className="project-block">
            <h4>TECH STACK</h4>
            <div className="tags">{p.tech.map(t => <span key={t}>{t}</span>)}</div>
          </div>

          <div className="project-meta">
            <div><span>ROLE</span><strong>{p.role}</strong></div>
            <div><span>TYPE</span><strong>{p.type}</strong></div>
          </div>

          <div className="project-links">
            <a href={p.github} target="_blank" rel="noopener noreferrer" className="gh-link">GITHUB <span className="arrow">↗</span></a>
            {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer">VIEW PROJECT →</a>}
          </div>
        </div>
      ))}
    </section>
  )
}
