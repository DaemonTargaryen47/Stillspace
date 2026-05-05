'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function BreathingBackground() {
  const ref = useRef(null)
  const path = usePathname()
  const isRoot = path === '/'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start = null
    let frame = null
    const duration = 6000

    const animate = (ts) => {
      if (!start) start = ts
      const t = (ts - start) % duration
      const phase = t / duration
      // sine wave: 0 → 1 → 0 over 6s
      const scale = 1 + 0.04 * Math.sin(phase * Math.PI * 2)
      el.style.transform = `scale(${scale})`
      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  if (isRoot) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: '-5%',
        background: 'var(--bg-primary)',
        zIndex: -1,
        transformOrigin: 'center center',
        willChange: 'transform',
        transition: 'background 0.3s ease',
      }}
    />
  )
}
