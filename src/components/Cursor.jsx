import React, { useEffect, useRef, useState } from 'react'

export default function Cursor() {
  const ref = useRef(null)
  const [mode, setMode] = useState('')

  useEffect(() => {
    const move = e => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px'
        ref.current.style.top = e.clientY + 'px'
      }
    }
    addEventListener('mousemove', move)
    const over = e => {
      const t = e.target.closest('a,button,select,input,textarea')
      const card = e.target.closest('[data-cursor="view"]')
      if (card) setMode('view')
      else if (t) setMode('big')
      else setMode('')
    }
    addEventListener('mouseover', over)
    return () => { removeEventListener('mousemove', move); removeEventListener('mouseover', over) }
  }, [])

  return (
    <div ref={ref} className={`cursor-dot ${mode === 'view' ? 'view' : mode === 'big' ? 'big' : ''}`}>
      {mode === 'view' ? 'VIEW' : ''}
    </div>
  )
}
