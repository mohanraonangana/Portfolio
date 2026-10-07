import React, { useEffect, useRef, useState } from 'react'

/*
  Cinematic hero background (video layer only).

  VIDEO FILE:   public/videos/hero-background.mp4   (served at /videos/hero-background.mp4)
  POSTER FILE:  public/videos/hero-poster.jpg       (shown until the video plays / if it fails)

  Source footage: Mixkit "Cables in a server room" (Mixkit Free License, commercial use OK,
  no attribution required), graded dark/desaturated with a faint lime tint and turned into
  a seamless forward+reverse loop with ffmpeg. See public/videos/README.md.

  The video is only mounted on desktop-class devices (no mobile, no reduced-motion,
  no data-saver). If it fails to load, the poster + existing black theme remain visible.
*/

const BASE = import.meta.env.BASE_URL
const VIDEO = `${BASE}videos/hero-background.mp4`
const POSTER = `${BASE}videos/hero-poster.jpg`

function canUseVideo() {
  if (typeof window === 'undefined') return false
  const mobile = window.matchMedia('(max-width: 768px)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const conn = navigator.connection
  const saveData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')))
  return !mobile && !reduced && !saveData
}

export default function HeroVideo() {
  const wrapRef = useRef(null)
  const videoRef = useRef(null)
  const [enabled, setEnabled] = useState(false) // mount <video> only when allowed
  const [ready, setReady] = useState(false) // fade in only once it is really playing

  // Start after first paint so the video never competes with the hero text/photo.
  useEffect(() => {
    if (!canUseVideo()) return
    const start = () => setEnabled(true)
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1000 })
      : window.setTimeout(start, 300)
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : clearTimeout(idle))
  }, [])

  // Pause while the hero is off-screen (saves CPU/battery).
  useEffect(() => {
    const v = videoRef.current
    const el = wrapRef.current
    if (!enabled || !v || !el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])

  return (
    <div className="hero-video" ref={wrapRef} aria-hidden="true">
      {/* 1. video (poster image is the fallback look) */}
      <div className="hero-video-poster" style={{ backgroundImage: `url(${POSTER})` }} />
      {enabled && (
        <video
          ref={videoRef}
          className={`hero-video-el${ready ? ' is-ready' : ''}`}
          src={VIDEO}
          poster={POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          disableRemotePlayback
          controls={false}
          tabIndex={-1}
          onPlaying={() => setReady(true)}
          onError={() => setReady(false)}
        />
      )}
      {/* 2. dark overlay */}
      <div className="hero-video-shade" />
      {/* 3. neon-lime grid + glow, above the video */}
      <div className="hero-video-grid" />
      <div className="hero-video-glow" />
    </div>
  )
}
