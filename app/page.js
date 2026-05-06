'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { storage } from '../lib/store'

const FIGURES = [
  { id: 0, x: 15, y: 15, color: '#c8b8a2' },
  { id: 1, x: 68, y: 12, color: '#a8b8c2' },
  { id: 2, x: 38, y: 38, color: '#b8c8a8' },
  { id: 3, x: 80, y: 42, color: '#c2a8b8' },
  { id: 4, x: 20, y: 65, color: '#a8b8a2' },
  { id: 5, x: 60, y: 68, color: '#c2b8a2' },
  { id: 6, x: 85, y: 78, color: '#b8a8c2' },
]

function PersonSVG({ color }) {
  return (
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
      <circle cx="16" cy="9" r="6.5" fill={color} opacity="0.95" />
      <rect x="13.5" y="14.5" width="5" height="3" rx="2" fill={color} opacity="0.85" />
      <path d="M4 32c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M9 32c0-3.866 3.134-7 7-7s7 3.134 7 7" fill={color} opacity="0.3" />
    </svg>
  )
}

function AuraRipple({ x, y, color, onDone }) {
  const [scale, setScale] = useState(0.3)
  const [opacity, setOpacity] = useState(0.6)

  useEffect(() => {
    let start = null
    const duration = 2200
    const animate = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setScale(0.3 + p * 2.8)
      setOpacity(0.5 * (1 - p))
      if (p < 1) requestAnimationFrame(animate)
      else onDone()
    }
    requestAnimationFrame(animate)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      left: x + '%', top: y + '%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: 60, height: 60, borderRadius: '50%',
      border: '1.5px solid ' + color,
      opacity, pointerEvents: 'none', transition: 'none',
    }} />
  )
}

function AnimatedBorder({ children }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const progressRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const radius = 28
    const speed = 0.0018

    const getPointOnBorder = (t, w, h, r) => {
      const straightX = w - 2 * r
      const straightY = h - 2 * r
      const perimeter = 2 * straightX + 2 * straightY + 2 * Math.PI * r
      let dist = ((t % 1) + 1) % 1 * perimeter

      if (dist < straightX) return { x: r + dist, y: 0 }
      dist -= straightX
      if (dist < Math.PI / 2 * r) {
        const angle = -Math.PI / 2 + dist / r
        return { x: w - r + Math.cos(angle) * r, y: r + Math.sin(angle) * r }
      }
      dist -= Math.PI / 2 * r
      if (dist < straightY) return { x: w, y: r + dist }
      dist -= straightY
      if (dist < Math.PI / 2 * r) {
        const angle = dist / r
        return { x: w - r + Math.cos(angle) * r, y: h - r + Math.sin(angle) * r }
      }
      dist -= Math.PI / 2 * r
      if (dist < straightX) return { x: w - r - dist, y: h }
      dist -= straightX
      if (dist < Math.PI / 2 * r) {
        const angle = Math.PI / 2 + dist / r
        return { x: r + Math.cos(angle) * r, y: h - r + Math.sin(angle) * r }
      }
      dist -= Math.PI / 2 * r
      if (dist < straightY) return { x: 0, y: h - r - dist }
      dist -= straightY
      const angle = Math.PI + dist / r
      return { x: r + Math.cos(angle) * r, y: r + Math.sin(angle) * r }
    }

    const draw = () => {
      const ctx = canvas.getContext('2d')
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      ctx.beginPath()
      ctx.roundRect(1, 1, w - 2, h - 2, radius)
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      progressRef.current = (progressRef.current + speed) % 1
      const pos = getPointOnBorder(progressRef.current, w, h, radius)

      const trailLength = 0.12
      const trailSteps = 60
      for (let i = 0; i < trailSteps; i++) {
        const t = progressRef.current - (i / trailSteps) * trailLength
        const p = getPointOnBorder(t, w, h, radius)
        const alpha = (1 - i / trailSteps) * 0.9
        const size = (1 - i / trailSteps) * 3.5
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4)
        grad.addColorStop(0, `rgba(200, 180, 160, ${alpha})`)
        grad.addColorStop(0.4, `rgba(170, 160, 190, ${alpha * 0.6})`)
        grad.addColorStop(1, 'rgba(200, 180, 160, 0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      const headGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 22)
      headGrad.addColorStop(0, 'rgba(220, 200, 180, 1)')
      headGrad.addColorStop(0.3, 'rgba(190, 175, 210, 0.8)')
      headGrad.addColorStop(0.6, 'rgba(200, 220, 200, 0.3)')
      headGrad.addColorStop(1, 'rgba(220, 200, 180, 0)')
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2)
      ctx.fillStyle = headGrad
      ctx.fill()

      const coreGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 5)
      coreGrad.addColorStop(0, 'rgba(255, 248, 240, 1)')
      coreGrad.addColorStop(0.5, 'rgba(220, 200, 180, 0.9)')
      coreGrad.addColorStop(1, 'rgba(200, 180, 160, 0)')
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 28 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', borderRadius: 28 }} />
      {children}
    </div>
  )
}

function TheDistance() {
  const [figures, setFigures] = useState(
    FIGURES.map(f => ({ ...f, opacity: 1, rotate: 0, dx: 0, dy: 0, visible: true }))
  )
  const [ripples, setRipples] = useState([])
  const rippleId = useRef(0)
  const visibleCount = figures.filter(f => f.visible).length

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * FIGURES.length)
      const dx = (Math.random() - 0.5) * 3
      const dy = (Math.random() - 0.5) * 3
      const rotate = (Math.random() - 0.5) * 12
      setFigures(prev => prev.map((f, i) => i === idx ? { ...f, dx, dy, rotate } : f))
      setTimeout(() => setFigures(prev => prev.map((f, i) => i === idx ? { ...f, dx: 0, dy: 0, rotate: 0 } : f)), 2000)
    }, 4000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const fig = FIGURES[Math.floor(Math.random() * FIGURES.length)]
      const id = rippleId.current++
      setRipples(prev => [...prev, { id, x: fig.x, y: fig.y, color: fig.color }])
    }, 5000 + Math.random() * 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * FIGURES.length)
      setFigures(prev => prev.map((f, i) => i === idx ? { ...f, opacity: 0, visible: false } : f))
      const delay = 2500 + Math.random() * 2000
      setTimeout(() => setFigures(prev => prev.map((f, i) => i === idx ? { ...f, opacity: 1, visible: true } : f)), delay)
    }, 8000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatedBorder>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        background: 'linear-gradient(145deg, #faf9f7 0%, #f4f2ef 50%, #f8f6f3 100%)',
        borderRadius: 28, overflow: 'hidden', minHeight: 480,
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c8c4be" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {FIGURES.map(f => (
          <div key={'ring-' + f.id} style={{
            position: 'absolute', left: f.x + '%', top: f.y + '%',
            transform: 'translate(-50%, -50%)',
            width: 80, height: 80, borderRadius: '50%',
            border: '1.5px solid ' + f.color + '55',
            pointerEvents: 'none',
          }} />
        ))}

        {ripples.map(r => (
          <AuraRipple key={r.id} x={r.x} y={r.y} color={r.color} onDone={() => setRipples(prev => prev.filter(p => p.id !== r.id))} />
        ))}

        {figures.map((f) => (
          <div key={f.id} style={{
            position: 'absolute', left: f.x + '%', top: f.y + '%',
            transform: `translate(-50%, -50%) translate(${f.dx}px, ${f.dy}px) rotate(${f.rotate}deg)`,
            opacity: f.opacity,
            transition: 'transform 1.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1.4s ease',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <PersonSVG color={f.color} />
            <div style={{
              width: 32, height: 10, borderRadius: '50%',
              background: f.color + '55',
              filter: 'blur(3px)',
              marginTop: -4,
            }} />
          </div>
        ))}

        <div style={{
          position: 'absolute', top: 18, right: 18, zIndex: 5,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', background: 'rgba(255,255,255,0.88)',
          borderRadius: 999, backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,0,0,0.09)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.5s ease',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: visibleCount >= 5 ? '#8a9e8c' : visibleCount >= 3 ? '#c8a88a' : '#c0392b',
            boxShadow: '0 0 0 2px ' + (visibleCount >= 5 ? '#8a9e8c' : visibleCount >= 3 ? '#c8a88a' : '#c0392b') + '30',
            transition: 'background 0.5s ease',
          }} />
          <p style={{ fontSize: 13, color: '#3a3a3c', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            {FIGURES.length} people · {visibleCount} visible
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#1a1a1c', letterSpacing: '-0.01em', fontWeight: 400 }}>
            Stillspace
          </p>
        </div>
      </div>
    </AnimatedBorder>
  )
}

function TopBar({ isMobile }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const load = () => setUser(storage.get('user'))
    load()
    const t = setInterval(load, 1000)
    return () => clearInterval(t)
  }, [])

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : null

  const barBg = isMobile ? 'rgba(250,249,247,0.95)' : 'rgba(26,26,28,0.96)'
  const borderCol = isMobile ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
  const logoColor = isMobile ? '#2c2c2e' : '#f0ede8'
  const avatarBorder = isMobile ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'
  const avatarBorderHover = isMobile ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)'
  const guestBg = isMobile ? '#f0ede8' : '#3a3a3c'
  const guestColor = isMobile ? '#b0a99a' : '#787570'
  const signedInBg = isMobile ? '#e8f0ea' : '#2a4a2c'
  const signedInColor = isMobile ? '#6b8a6e' : '#7aae7c'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: 56, background: barBg, backdropFilter: 'blur(20px)',
      borderBottom: '1px solid ' + borderCol,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: logoColor, letterSpacing: '-0.01em' }}>
          Stillspace
        </span>
      </Link>
      <Link href={user && !user.isGuest ? '/settings' : '/home'} style={{ textDecoration: 'none', position: 'absolute', right: 20 }}>
        {user?.avatar && !user?.isGuest ? (
          <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + avatarBorder, display: 'block', transition: 'border-color 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = avatarBorderHover}
          onMouseLeave={e => e.currentTarget.style.borderColor = avatarBorder}
          />
        ) : (
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: user && !user.isGuest && initials ? signedInBg : guestBg,
            border: '2px solid ' + avatarBorder,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: user && !user.isGuest && initials ? 12 : 16, fontWeight: 500,
            color: user && !user.isGuest && initials ? signedInColor : guestColor,
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = avatarBorderHover}
          onMouseLeave={e => e.currentTarget.style.borderColor = avatarBorder}
          >
            {user && !user.isGuest && initials ? initials : '?'}
          </div>
        )}
      </Link>
    </div>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const symbols = ['◇', '○', '△', '□', '◎']

  return (
    <>
      {isDesktop && <TopBar isMobile={false} />}
      {!isDesktop && mounted && <TopBar isMobile={true} />}

      <div style={{
        minHeight: '100vh', background: '#faf9f7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isDesktop ? '80px 48px 40px' : '80px 24px 40px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,158,140,0.06) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,144,128,0.06) 0%, transparent 70%)' }} />
        </div>

        <div style={{ width: '100%', maxWidth: 1100, display: 'flex', alignItems: 'center', gap: 60, position: 'relative', zIndex: 1 }}>

          {/* Left column */}
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 460, textAlign: 'center' }} className="landing-left">
            <p style={{ fontSize: 11, color: '#1a1a1a', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 20 }}>
              A Gentle Space
            </p>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(52px, 8vw, 80px)', fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 24 }}>
              Stillspace
            </h1>

            <p style={{ fontSize: 17, color: '#8a8a8e', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 40px' }}>
              Keep in touch with your closest people,<br />without the stress.
            </p>

            {/* Desktop — two buttons side by side */}
            <div className="desktop-btns" style={{ display: 'none', gap: 12, marginBottom: 24, alignItems: 'center' }}>
              <Link href="/home" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '16px 32px', background: '#2c2c2e', borderRadius: 999,
                  fontSize: 15, fontWeight: 500, color: '#faf9f7', letterSpacing: '0.02em',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(44,44,46,0.15)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(44,44,46,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(44,44,46,0.15)' }}
                >
                  Enter Your Space
                </div>
              </Link>
              <Link href="/settings" style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '16px 32px', background: '#1a1a1c', borderRadius: 999,
                  fontSize: 15, fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' }}
                >
                  Create Your Space
                </div>
              </Link>
            </div>

            {/* Mobile — single button */}
            <div className="mobile-btn" style={{ marginBottom: 24 }}>
              <Link href="/settings" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div style={{
                  padding: '16px 40px', background: '#1a1a1c', borderRadius: 999,
                  fontSize: 15, fontWeight: 500, color: '#ffffff', letterSpacing: '0.02em',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}>
                  Create Your Space
                </div>
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 48 }}>
              {['No Pressure', 'No Urgency'].map(label => (
                <div key={label} style={{ padding: '8px 18px', background: 'rgba(0,0,0,0.04)', borderRadius: 999, fontSize: 13, color: '#8a8a8e', border: '1px solid rgba(0,0,0,0.07)' }}>{label}</div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
              {symbols.map((s, i) => (
                <span key={i} style={{ fontSize: 16, color: '#d0cdc8', animationName: 'softFloat', animationDuration: (3 + i * 0.5) + 's', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: i * 0.4 + 's', display: 'inline-block' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Right column — desktop only */}
          <div style={{ flex: 1, minWidth: 0, display: 'none' }} className="landing-right">
            {mounted && <TheDistance />}
          </div>
        </div>

        <style>{`
          .mobile-btn { display: block; }
          .desktop-btns { display: none !important; }

          @media (min-width: 768px) {
            .mobile-btn { display: none !important; }
            .desktop-btns { display: flex !important; }
            .landing-left { text-align: left !important; }
            .landing-left p[style*="max-width"] { margin-left: 0 !important; }
            .landing-left > div[style*="justify-content: center"],
            .landing-left > div:nth-child(5),
            .landing-left > div:nth-child(6) { justify-content: flex-start !important; }
            .landing-right { display: block !important; }
          }
        `}</style>
      </div>
    </>
  )
}
