import React, { useEffect } from 'react'

export default function VaultBackground() {
  useEffect(() => {
    const c = document.querySelector('.wallet-canvas')
    if (!c) return
    const ctx = c.getContext('2d')
    let raf
    const resize = () => { c.width = innerWidth; c.height = innerHeight }
    resize()
    addEventListener('resize', resize)
    const dots = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - .5) * 0.0005, vy: (Math.random() - .5) * 0.0005,
      r: Math.random() * 1.5 + .4,
    }))
    // anime-style flowing streaks
    const streaks = Array.from({ length: 14 }, (_, i) => ({
      y: Math.random(), speed: 0.0006 + Math.random() * 0.0014,
      len: 0.12 + Math.random() * 0.2, offset: Math.random() * 2, hue: i % 3 === 0 ? '200,245,66' : '232,234,230',
    }))
    let t = 0
    // faint grid
    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(200,245,66,0.045)'
      ctx.lineWidth = 1
      for (let x = 0; x < c.width; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke() }
      for (let y = 0; y < c.height; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke() }
    }
    const tick = () => {
      t += 0.008
      ctx.clearRect(0, 0, c.width, c.height)
      drawGrid()
      // flowing wave lines (live motion)
      for (let w = 0; w < 3; w++) {
        ctx.beginPath()
        for (let x = 0; x <= c.width; x += 8) {
          const y = c.height * (0.3 + w * 0.22) + Math.sin(x * 0.004 + t * (1 + w * 0.4) + w * 2) * 46
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(200,245,66,${0.05 - w * 0.012})`
        ctx.lineWidth = 1.4
        ctx.stroke()
      }
      // drifting light streaks
      for (const s of streaks) {
        const x = ((t * s.speed * 1200 + s.offset * c.width) % (c.width + s.len * c.width)) - s.len * c.width
        const grad = ctx.createLinearGradient(x, 0, x + s.len * c.width, 0)
        grad.addColorStop(0, `rgba(${s.hue},0)`)
        grad.addColorStop(0.5, `rgba(${s.hue},0.22)`)
        grad.addColorStop(1, `rgba(${s.hue},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(x, s.y * c.height, s.len * c.width, 1.6)
      }
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > 1) d.vx *= -1
        if (d.y < 0 || d.y > 1) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x * c.width, d.y * c.height, d.r, 0, 7)
        ctx.fillStyle = 'rgba(200,245,66,0.35)'
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize) }
  }, [])
  return <canvas className="wallet-canvas" />
}
