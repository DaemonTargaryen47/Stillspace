'use client'
import { useState, useEffect } from 'react'
import { initUser } from '../../lib/store'
import { MOCK_CIRCLE, STATUSES } from '../../lib/constants'
import Navigation from '../../components/Navigation'
import CircleMember from '../../components/CircleMember'
import GuestBanner from '../../components/GuestBanner'
import WeatherRoom from '../../components/WeatherRoom'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [time, setTime] = useState('')

  useEffect(() => {
    setUser(initUser())
    const update = () => setTime(new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#b0a99a', fontSize: 15 }}>loading your space...</p>
    </div>
  )

  const isGuest = user.isGuest
  const circle = isGuest ? MOCK_CIRCLE.slice(0, 3) : (user.circle || [])
  const currentStatus = STATUSES.find(s => s.id === user.currentStatus)

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#faf9f7', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />

      {/* Hero */}
      <div style={{
        padding: '108px 28px 28px',
        background: 'linear-gradient(180deg, #f0ede8 0%, #faf9f7 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 13, color: '#b0a99a', letterSpacing: '0.08em', marginBottom: 4 }}>
              {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {greet()}.
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#2c2c2e', letterSpacing: '-0.02em', lineHeight: 1 }}>{time}</p>
            <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.06em', marginTop: 4 }}>local time</p>
          </div>
        </div>
        {user.disappearMode && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'rgba(0,0,0,0.05)', borderRadius: 999, marginTop: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b0a99a' }} />
            <span style={{ fontSize: 12, color: '#8a8a8e' }}>invisible mode on</span>
          </div>
        )}
      </div>

      <div style={{ padding: '0 28px' }}>

        {/* Status */}
        <section style={{ marginBottom: 16 }}>
          <div style={{
            padding: '22px',
            background: currentStatus ? currentStatus.bg : '#ffffff',
            borderRadius: 20,
            boxShadow: currentStatus ? '0 4px 24px ' + currentStatus.color + '18' : '0 2px 16px rgba(0,0,0,0.05)',
          }}>
            {user.currentStatus ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>your status</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: currentStatus ? currentStatus.color : '#a0a0a3', flexShrink: 0, boxShadow: currentStatus ? '0 0 0 3px ' + currentStatus.color + '22' : 'none' }} />
                    <span style={{ fontSize: 17, color: currentStatus ? currentStatus.color : '#6b6b6e' }}>{currentStatus ? currentStatus.label : ''}</span>
                  </div>
                </div>
                <Link href="/status" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 999, textDecoration: 'none', fontSize: 13, color: '#6b6b6e' }}>change</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 16, color: '#6b6b6e', marginBottom: 4 }}>How are you today?</p>
                  <p style={{ fontSize: 13, color: '#b0a99a' }}>Set a status for your circle</p>
                </div>
                <Link href="/status" style={{ padding: '10px 20px', background: '#2c2c2e', color: '#faf9f7', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>set status</Link>
              </div>
            )}
          </div>
        </section>

        {/* Weather */}
        <section style={{ marginBottom: 16 }}>
          <WeatherRoom mood={
            user.currentStatus === 'overwhelmed' ? 'overwhelmed' :
            user.currentStatus === 'okay' || user.currentStatus === 'good' ? 'calm' :
            user.currentStatus === 'space' || user.currentStatus === 'distant' ? 'quiet' : 'neutral'
          } />
        </section>

        {/* Thought of the moment */}
        <section style={{ marginBottom: 16 }}>
          <DailyThought />
        </section>

        {/* Quick actions */}
        <section style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link href="/comfort" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', height: '100%' }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: '#f0f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 18 }}>◇</div>
                <p style={{ fontSize: 15, color: '#2c2c2e', fontWeight: 500, marginBottom: 4 }}>Comfort</p>
                <p style={{ fontSize: 13, color: '#b0a99a', lineHeight: 1.5 }}>Emotional echo and breathing space</p>
              </div>
            </Link>
            <Link href="/circle" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', height: '100%' }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: '#f0eef5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 18 }}>◎</div>
                <p style={{ fontSize: 15, color: '#2c2c2e', fontWeight: 500, marginBottom: 4 }}>Circle</p>
                <p style={{ fontSize: 13, color: '#b0a99a', lineHeight: 1.5 }}>Your trusted people</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Circle */}
        <section style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#b0a99a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>your circle</p>
            <Link href="/circle" style={{ fontSize: 13, color: '#8a8a8e', textDecoration: 'none' }}>manage →</Link>
          </div>
          {isGuest ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {circle.map(m => <CircleMember key={m.id} member={m} isPreview={true} />)}
              </div>
              <GuestBanner />
            </>
          ) : circle.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0ede8', border: '2px dashed #d0cdc8', animation: 'breathe ' + (2 + i * 0.3) + 's ease-in-out infinite', animationDelay: i * 0.2 + 's' }} />
                ))}
              </div>
              <p style={{ fontSize: 16, color: '#6b6b6e', marginBottom: 6 }}>Your circle is empty</p>
              <p style={{ fontSize: 13, color: '#b0a99a', marginBottom: 18 }}>Invite someone you trust</p>
              <Link href="/circle" style={{ padding: '10px 24px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, textDecoration: 'none', fontSize: 14, color: '#6b6b6e' }}>invite someone</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {circle.map(m => <CircleMember key={m.id} member={m} />)}
            </div>
          )}
        </section>

        {/* Gentle reminder */}
        <GentleReminder />

      </div>
    </div>
  )
}

function DailyThought() {
  const thoughts = [
    "You don't have to be everything to everyone.",
    "Rest is productive.",
    "It's okay to take up space.",
    "Your feelings are not a burden.",
    "Presence is enough.",
    "You are allowed to change your mind.",
    "Slow is not the same as stuck.",
  ]
  const thought = thoughts[new Date().getDay() % thoughts.length]
  return (
    <div style={{
      padding: '22px 24px',
      background: 'linear-gradient(135deg, #f5f0eb, #f0ede8)',
      borderRadius: 18,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(160,144,128,0.08)' }} />
      <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>a thought for today</p>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: '#4a4a4c', lineHeight: 1.6, fontStyle: 'italic', position: 'relative' }}>
        "{thought}"
      </p>
    </div>
  )
}

function GentleReminder() {
  return (
    <div style={{
      padding: '24px',
      background: '#ffffff',
      borderRadius: 18,
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      textAlign: 'center',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        {['◇', '○', '△'].map((s, i) => (
          <span key={i} style={{ fontSize: 20, color: '#d0cdc8', animation: 'softFloat ' + (3 + i) + 's ease-in-out infinite', animationDelay: i * 0.6 + 's', display: 'inline-block' }}>{s}</span>
        ))}
      </div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#8a8a8e', lineHeight: 1.7 }}>
        You can come and go freely.<br />No need to respond.
      </p>
    </div>
  )
}
