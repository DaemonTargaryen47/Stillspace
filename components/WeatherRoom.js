'use client'
import { useState, useEffect } from 'react'

const MOODS = {
  calm:        { bg1: '#eef5f0', bg2: '#e4efe6', accent: '#8aaa90', label: 'calm', sub: 'all is still' },
  neutral:     { bg1: '#f4f2ee', bg2: '#ede9e2', accent: '#a09880', label: 'neutral', sub: 'gently present' },
  overwhelmed: { bg1: '#f0ecf5', bg2: '#e8e2f0', accent: '#9a8aaa', label: 'overwhelmed', sub: 'it is okay to feel this' },
  quiet:       { bg1: '#edf0f5', bg2: '#e4e8f0', accent: '#8a9aaa', label: 'quiet', sub: 'peaceful and soft' },
}

export default function WeatherRoom({ mood = 'calm' }) {
  const [tick, setTick] = useState(0)
  const m = MOODS[mood] || MOODS.calm

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 100)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      borderRadius: 20,
      background: 'linear-gradient(135deg, ' + m.bg1 + ', ' + m.bg2 + ')',
      padding: '36px 28px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 160,
      transition: 'background 1s ease',
    }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 60 + i * 30,
          height: 60 + i * 30,
          borderRadius: '50%',
          border: '1px solid ' + m.accent + '22',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'breathe ' + (3 + i * 0.8) + 's ease-in-out infinite',
          animationDelay: i * 0.4 + 's',
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ position: 'relative' }}>
        <p style={{
          fontSize: 11,
          letterSpacing: '0.12em',
          color: m.accent,
          marginBottom: 10,
          textTransform: 'uppercase',
          opacity: 0.7,
        }}>
          emotional weather
        </p>
        <p style={{
          fontSize: 32,
          fontFamily: 'var(--font-serif)',
          color: '#2c2c2e',
          fontWeight: 400,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}>
          {m.label}
        </p>
        <p style={{ fontSize: 13, color: m.accent, letterSpacing: '0.04em' }}>
          {m.sub}
        </p>
      </div>
    </div>
  )
}
