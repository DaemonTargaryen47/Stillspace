'use client'
import { useState } from 'react'
import Navigation from '../../components/Navigation'
import EmotionalEcho from '../../components/EmotionalEcho'

const REMINDERS = [
  "You don't have to have it all figured out.",
  "It's okay to take up space.",
  "Your feelings are not a burden.",
  "Rest is not the same as giving up.",
  "You are allowed to change your mind.",
  "Slow is not the same as stuck.",
  "You are enough, exactly as you are.",
]

export default function ComfortPage() {
  const [breatheActive, setBreatheActive] = useState(false)
  const [phase, setPhase] = useState('tap to begin')
  const [timerRef, setTimerRef] = useState(null)

  const startBreathe = () => {
    if (breatheActive) {
      clearTimeout(timerRef)
      setBreatheActive(false)
      setPhase('tap to begin')
      return
    }
    setBreatheActive(true)
    const cycle = () => {
      setPhase('breathe in...')
      const t1 = setTimeout(() => {
        setPhase('hold...')
        const t2 = setTimeout(() => {
          setPhase('breathe out...')
          const t3 = setTimeout(cycle, 6000)
          setTimerRef(t3)
        }, 4000)
        setTimerRef(t2)
      }, 4000)
      setTimerRef(t1)
    }
    cycle()
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#faf9f7', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />

      <div style={{ padding: '80px 28px 0' }}>
        <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>a quiet space</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em', marginBottom: 6 }}>Comfort</h1>
        <p style={{ fontSize: 15, color: '#8a8a8e', marginBottom: 28, lineHeight: 1.6 }}>No need to respond. This space is just for you.</p>

        {/* Emotional Echo */}
        <section style={{ marginBottom: 20 }}>
          <EmotionalEcho />
        </section>

        {/* Breathing */}
        <section style={{ marginBottom: 20 }}>
          <div style={{
            padding: '32px 24px',
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>breathing space</p>

            <div
              onClick={startBreathe}
              style={{
                width: 120, height: 120,
                borderRadius: '50%',
                margin: '0 auto 20px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {[0,1,2].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  width: 120 - i * 20, height: 120 - i * 20,
                  borderRadius: '50%',
                  border: '1.5px solid #8a9e8c',
                  opacity: breatheActive ? 0.6 - i * 0.15 : 0.2,
                  animation: breatheActive ? 'breathe ' + (4 + i) + 's ease-in-out infinite' : 'none',
                  animationDelay: i * 0.3 + 's',
                  transition: 'opacity 0.5s ease',
                }} />
              ))}
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: breatheActive ? '#8a9e8c' : '#f0ede8',
                transition: 'all 0.5s ease',
                animation: breatheActive ? 'breathe 4s ease-in-out infinite' : 'none',
              }} />
            </div>

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#4a4a4c', marginBottom: 6 }}>{phase}</p>
            {breatheActive && <p style={{ fontSize: 12, color: '#b0a99a' }}>tap to stop</p>}
          </div>
        </section>

        {/* Gentle reminders */}
        <section style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>gentle reminders</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REMINDERS.map((reminder, i) => (
              <div key={i} style={{
                padding: '18px 22px',
                background: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                borderLeft: '3px solid #e8e4de',
                fontSize: 15,
                color: '#6b6b6e',
                lineHeight: 1.6,
                fontFamily: i % 2 === 0 ? 'var(--font-serif)' : 'var(--font-sans)',
                animationDelay: i * 0.07 + 's',
              }} className="fade-up">
                {reminder}
              </div>
            ))}
          </div>
        </section>

        {/* Closing quote */}
        <div style={{
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #eef5f0, #e8f0ea)',
          borderRadius: 18,
          textAlign: 'center',
          marginBottom: 16,
        }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#4a5a4c', lineHeight: 1.7, fontStyle: 'italic' }}>
            "The quieter you become,<br />the more you can hear."
          </p>
        </div>

      </div>
    </div>
  )
}
