import React from 'react'

const ITEMS = [
  { yr: '2026', title: 'Current Chapter', body: 'Java development — building with Spring Boot, Spring MVC, REST APIs, JPA/Hibernate, MySQL, and Maven. Deploying with Docker, AWS and CI/CD (Jenkins).' },
  { yr: '2025', title: 'Foundations', body: 'Deepened backend skills in Java, Spring Boot, REST API development, database integration with JPA/Hibernate and MySQL, alongside Maven and Git.' },
  { yr: '2024', title: 'First Steps', body: 'Began software development — Java fundamentals, SQL, and Git.' },
  {
    yr: '2024',
    title: 'AI-ML Virtual Intern',
    sub: 'K L University · January – March 2024 · Virtual Internship',
    body: 'Successfully completed a 10-week AI-ML Virtual Internship supported by AWS Academy under the AICTE–EduSkills program.',
  },
]

export default function Experience() {
  return (
    <section id="experience">
      <div className="sec-label">TIMELINE</div>
      <h2 className="sec-title">The <span>journey.</span></h2>
      <div className="tl">
        {ITEMS.map(i => (
          <div className="tl-item" key={`${i.yr}-${i.title}`}>
            <span className="yr">{i.yr}</span>
            <h3>{i.title}</h3>
            {i.sub && <span className="tl-sub">{i.sub}</span>}
            <p>{i.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
