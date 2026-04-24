'use client'
import { useState, useEffect } from 'react'
import Navigation from '../../components/Navigation'
import { getReflection } from '../../lib/constants'
import { storage } from '../../lib/store'

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
  const [text, setText] = useState('')
  const [reflection, setReflection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [breatheActive, setBreatheActive] = useState(false)
  const [phase, setPhase] = useState('tap to begin')
  const [timerRef, setTimerRef] = useState(null)
  const [echoHistory, setEchoHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const history = storage.get('echo_history') || []
    setEchoHistory(history)
  }, [])

  const reflect = () => {
    if (!text.trim()) return
    setLoading(true)
    setReflection(null)
    setTimeout(() => {
      const result = getReflection(text)
      setReflection(result)
      setLoading(false)
      const entry = {
        text: text.trim(),
        reflection: result,
        timestamp: Date.now(),
      }
      const history = [entry, ...(storage.get('echo_history') || [])].slice(0, 50)
      storage.set('echo_history', history)
      setEchoHistory(history)
    }, 900)
  }

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

  const clearHistory = () => {
    storage.remove('echo_history')
    setEchoHistory([])
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#faf9f7', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />

      <div style={{ padding: '108px 28px 0' }}>
        <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>a quiet space</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em', marginBottom: 6 }}>Comfort</h1>
        <p style={{ fontSize: 15, color: '#8a8a8e', marginBottom: 28, lineHeight: 1.6 }}>No need to respond. This space is just for you.</p>

        {/* Emotional Echo */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: '26px', boxShadow: '0 2px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>emotional echo</p>
              {echoHistory.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 12, color: '#8a9e8c', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
                  {showHistory ? 'hide history' : 'view history (' + echoHistory.length + ')'}
                </button>
              )}
            </div>
            <p style={{ fontSize: 15, color: '#6b6b6e', marginBottom: 20, lineHeight: 1.7 }}>
              Write a sentence about how you feel. It stays here, between you and this page.
            </p>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="I feel..."
              rows={3}
              style={{ width: '100%', background: '#f8f7f4', border: '1.5px solid transparent', borderRadius: 14, padding: '14px 18px', fontSize: 16, color: '#2c2c2e', resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, transition: 'border-color 0.2s ease, background 0.2s ease' }}
              onFocus={e => { e.target.style.borderColor = '#8a9e8c'; e.target.style.background = '#ffffff' }}
              onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f8f7f4' }}
            />

            <button
              onClick={reflect}
              disabled={!text.trim() || loading}
              style={{ marginTop: 14, padding: '11px 28px', background: text.trim() && !loading ? '#2c2c2e' : '#f0ede8', color: text.trim() && !loading ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: '999px', fontSize: 14, cursor: text.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.2s ease', letterSpacing: '0.04em' }}
            >
              {loading ? 'listening...' : 'reflect'}
            </button>

            {reflection && (
              <div style={{ marginTop: 22, padding: '20px 22px', background: 'linear-gradient(135deg, #f0f5f0, #edf2ed)', borderRadius: 16, borderLeft: '3px solid #8a9e8c', animation: 'fadeUp 0.5s ease forwards' }}>
                <p style={{ fontSize: 18, color: '#4a5a4c', lineHeight: 1.75, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                  {reflection}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Echo History */}
        {showHistory && echoHistory.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ background: '#ffffff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>your echo history · private</p>
                <button onClick={clearHistory} style={{ fontSize: 11, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}>clear all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {echoHistory.map((entry, i) => (
                  <div key={i} style={{ paddingBottom: 14, borderBottom: i < echoHistory.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ fontSize: 14, color: '#2c2c2e', lineHeight: 1.5, flex: 1, paddingRight: 12 }}>"{entry.text}"</p>
                      <p style={{ fontSize: 11, color: '#c0bdb8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(entry.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(entry.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: '#8a9e8c', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{entry.reflection}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Breathing */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ padding: '32px 24px', background: '#ffffff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>breathing space</p>
            <div onClick={startBreathe} style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ position: 'absolute', width: 120 - i * 20, height: 120 - i * 20, borderRadius: '50%', border: '1.5px solid #8a9e8c', opacity: breatheActive ? 0.6 - i * 0.15 : 0.2, animation: breatheActive ? 'breathe ' + (4 + i) + 's ease-in-out infinite' : 'none', animationDelay: i * 0.3 + 's', transition: 'opacity 0.5s ease' }} />
              ))}
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: breatheActive ? '#8a9e8c' : '#f0ede8', transition: 'all 0.5s ease', animation: breatheActive ? 'breathe 4s ease-in-out infinite' : 'none' }} />
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
              <div key={i} style={{ padding: '18px 22px', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '3px solid #e8e4de', fontSize: 15, color: '#6b6b6e', lineHeight: 1.6, fontFamily: i % 2 === 0 ? 'var(--font-serif)' : 'var(--font-sans)', animationDelay: i * 0.07 + 's' }} className="fade-up">
                {reminder}
              </div>
            ))}
          </div>
        </section>

        <div style={{ padding: '28px 24px', background: 'linear-gradient(135deg, #eef5f0, #e8f0ea)', borderRadius: 18, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#4a5a4c', lineHeight: 1.7, fontStyle: 'italic' }}>
            "The quieter you become,<br />the more you can hear."
          </p>
        </div>
      </div>
    </div>
  )
}
