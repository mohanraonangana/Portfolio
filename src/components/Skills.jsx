import React from 'react'

const TECH = [
  ['Java', 'BACKEND'], ['Spring Boot', 'BACKEND'], ['Spring MVC', 'BACKEND'],
  ['Spring Data JPA', 'BACKEND'], ['Hibernate', 'BACKEND'], ['REST APIs', 'BACKEND'],
  ['MySQL', 'DATABASE'], ['PostgreSQL', 'DATABASE'], ['MongoDB', 'DATABASE'],
  ['Maven', 'TOOLS & DEVOPS'], ['Git', 'TOOLS & DEVOPS'], ['GitHub', 'TOOLS & DEVOPS'],
  ['Docker', 'TOOLS & DEVOPS'], ['Jenkins', 'TOOLS & DEVOPS'], ['AWS', 'TOOLS & DEVOPS'],
  ['JUnit', 'TESTING'], ['TestNG', 'TESTING'], ['Postman', 'TESTING'], ['Selenium', 'TESTING'],
]

export default function Skills() {
  return (
    <section id="skills">
      <div className="sec-label">CAPABILITIES</div>
      <h2 className="sec-title">The <span>wall</span> of tech.</h2>
      <div className="wall">
        {TECH.map(([name, cat]) => (
          <span key={name} className="tech">{name}<small>{cat}</small></span>
        ))}
      </div>
    </section>
  )
}
