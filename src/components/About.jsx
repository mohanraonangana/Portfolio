import React from 'react'

export default function About() {
  return (
    <section id="about">
      <div className="marquee" style={{ marginBottom: 70 }}>
        <div className="marquee-track">
          {Array(2).fill('JAVA • SPRING BOOT • SPRING MVC • SPRING DATA JPA • HIBERNATE • REST APIs • MYSQL • POSTGRESQL • MAVEN • GIT • DOCKER • JENKINS • AWS • ').map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
      <div className="sec-label">ABOUT</div>
      <h2 className="about-big">I build, break, learn<br />and <em>ship.</em></h2>
      <div className="about-split">
        <div>
          <p>
            I'm a Java Full Stack Developer focused on building reliable, scalable and maintainable web applications. I work primarily with Java, Spring Boot, REST APIs, relational databases and modern software development practices.
          </p>
          <p>
            My development approach focuses on clean architecture, backend development, database design, API development and building production-ready applications.
          </p>
        </div>
        <div>
          <div className="stat-row" style={{ marginTop: 0 }}>
            <div><h3>04</h3><span>PROJECTS</span></div>
            <div><h3>20+</h3><span>TECHNOLOGIES</span></div>
            <div><h3>—</h3><span>CERTIFICATIONS</span></div>
            <div><h3>—</h3><span>YEARS LEARNING</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
