'use client'
import { useState, useEffect } from 'react'
import Navigation from '../../components/Navigation'
import { getReflection } from '../../lib/constants'
import { storage, saveEchoEntry, hydrateUserFromSupabase } from '../../lib/store'

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
    const loadHistory = async () => {
      const user = storage.get('user')
      if (user && !user.isGuest) {
        const hydrated = await hydrateUserFromSupabase()
        setEchoHistory(hydrated?.echoHistory || [])
      } else {
        setEchoHistory(storage.get('echo_history') || [])
      }
    }
    loadHistory()
  }, [])

  const reflect = async () => {
    if (!text.trim()) return
    setLoading(true)
    setReflection(null)
    setTimeout(async () => {
      const result = getReflection(text)
      setReflection(result)
      setLoading(false)
      const entry = { text: text.trim(), reflection: result, timestamp: Date.now() }
      await saveEchoEntry(text.trim(), result)
      setEchoHistory(prev => [entry, ...prev].slice(0, 50))
    }, 900)
  }

  const startBreathe = () => {
    if (breatheActive) { clearTimeout(timerRef); setBreatheActive(false); setPhase('tap to begin'); return }
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

  const clearHistory = async () => {
    storage.remove('echo_history')
    const user = storage.get('user')
    if (user && !user.isGuest) {
      const { updateUser, pushToSupabase } = await import('../../lib/store')
      const updated = updateUser({ echoHistory: [] })
      await pushToSupabase(updated)
    }
    setEchoHistory([])
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 520, margin: '0 auto', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />
      <div style={{ padding: '108px 28px 0' }}>
        <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>a quiet space</p>
        <h1 className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>Comfort</h1>
        <p className="text-s" style={{ fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>No need to respond. This space is just for you.</p>

        <section style={{ marginBottom: 20 }}>
          <div className="card" style={{ borderRadius: 20, padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>emotional echo</p>
              {echoHistory.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} style={{ fontSize: 12, color: '#8a9e8c', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showHistory ? 'hide history' : 'view history (' + echoHistory.length + ')'}
                </button>
              )}
            </div>
            <p className="text-s" style={{ fontSize: 15, marginBottom: 20, lineHeight: 1.7 }}>Write a sentence about how you feel. It stays here, between you and this page.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="I feel..." rows={3}
              className="input-field"
              style={{ width: '100%', border: '1.5px solid transparent', borderRadius: 14, padding: '14px 18px', fontSize: 16, resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, transition: 'border-color 0.2s ease' }}
              onFocus={e => e.target.style.borderColor = '#8a9e8c'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
            <button onClick={reflect} disabled={!text.trim() || loading} style={{ marginTop: 14, padding: '11px 28px', background: text.trim() && !loading ? '#2c2c2e' : '#f0ede8', color: text.trim() && !loading ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: 999, fontSize: 14, cursor: text.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.2s ease' }}>
              {loading ? 'listening...' : 'reflect'}
            </button>
            {reflection && (
              <div className="green-card" style={{ marginTop: 22, padding: '20px 22px', borderRadius: 16, borderLeft: '3px solid #8a9e8c' }}>
                <p style={{ fontSize: 18, color: '#4a5a4c', lineHeight: 1.75, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{reflection}</p>
              </div>
            )}
          </div>
        </section>

        {showHistory && echoHistory.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div className="card" style={{ borderRadius: 20, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>your echo history · private</p>
                <button onClick={clearHistory} style={{ fontSize: 11, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}>clear all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {echoHistory.map((entry, i) => (
                  <div key={i} style={{ paddingBottom: 14, borderBottom: i < echoHistory.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p className="text-p" style={{ fontSize: 14, lineHeight: 1.5, flex: 1, paddingRight: 12 }}>"{entry.text}"</p>
                      <p className="text-f" style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(entry.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · {new Date(entry.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p style={{ fontSize: 13, color: '#8a9e8c', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{entry.reflection}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 20 }}>
          <div className="card" style={{ padding: '32px 24px', borderRadius: 20, textAlign: 'center' }}>
            <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24 }}>breathing space</p>
            <div onClick={startBreathe} style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ position: 'absolute', width: 120 - i * 20, height: 120 - i * 20, borderRadius: '50%', border: '1.5px solid #8a9e8c', opacity: breatheActive ? 0.6 - i * 0.15 : 0.2, animation: breatheActive ? 'breathe ' + (4 + i) + 's ease-in-out infinite' : 'none', animationDelay: i * 0.3 + 's', transition: 'opacity 0.5s ease' }} />
              ))}
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: breatheActive ? '#8a9e8c' : '#f0ede8', transition: 'all 0.5s ease', animation: breatheActive ? 'breathe 4s ease-in-out infinite' : 'none' }} />
            </div>
            <p className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 6 }}>{phase}</p>
            {breatheActive && <p className="text-m" style={{ fontSize: 12 }}>tap to stop</p>}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>gentle reminders</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REMINDERS.map((reminder, i) => (
              <div key={i} className="card" style={{ padding: '18px 22px', borderRadius: 16, borderLeft: '3px solid rgba(138,158,140,0.3)', fontSize: 15, lineHeight: 1.6, fontFamily: i % 2 === 0 ? 'var(--font-serif)' : 'var(--font-sans)' }}>
                <span className="text-s">{reminder}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="green-card" style={{ padding: '28px 24px', borderRadius: 18, textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#4a5a4c', lineHeight: 1.7, fontStyle: 'italic' }}>
            "The quieter you become,<br />the more you can hear."
          </p>
        </div>
      </div>
    </div>
  )
}
