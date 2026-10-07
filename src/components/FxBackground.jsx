import React, { useEffect, useRef } from 'react'

export default function FxBackground() {
  const glowRef = useRef(null)

  useEffect(() => {
    const onMove = e => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px'
        glowRef.current.style.top = e.clientY + 'px'
      }
    }
    addEventListener('mousemove', onMove)
    return () => removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div className="fx-bg">
        <div className="fx-grid" />
        <div className="fx-blob fx-blob-1" />
        <div className="fx-blob fx-blob-2" />
        <div className="fx-noise" />
      </div>
      <div className="fx-glow" ref={glowRef} />
    </>
  )
}
