'use client'
import { useState, useEffect } from 'react'
import { initUser } from '../lib/store'
import GuestBanner from '../components/GuestBanner'
import Navigation from '../components/Navigation'
import Link from 'next/link'

export default function GuestPage() {
  const [orbs, setOrbs] = useState([])

  useEffect(() => {
    initUser()
    setOrbs([
      { w: 300, h: 300, top: '5%',  left: '-5%',  color: 'rgba(138,158,140,0.10)', delay: '0s',   dur: '9s'  },
      { w: 200, h: 200, top: '10%', right: '-3%', color: 'rgba(160,144,128,0.08)', delay: '1.5s', dur: '11s' },
      { w: 160, h: 160, top: '45%', left: '55%',  color: 'rgba(154,138,170,0.07)', delay: '3s',   dur: '8s'  },
    ])
  }, [])

  return (
    <div style={{ maxWidth: '100vw', margin: '0 auto', minHeight: '100vh', background: '#faf9f7', overflowX: 'hidden' }}>
      <Navigation />

      <div style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.4fr 0.6fr',
        gridTemplateRows: 'auto 1fr auto',
        padding: '64px 0 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {orbs.map((o, i) => (
          <div key={i} style={{
            position: 'absolute', width: o.w, height: o.h, borderRadius: '50%',
            background: 'radial-gradient(circle, ' + o.color + ' 0%, transparent 70%)',
            top: o.top, left: o.left, right: o.right, pointerEvents: 'none',
            animation: 'drift ' + o.dur + ' ease-in-out infinite', animationDelay: o.delay,
          }} />
        ))}

        {/* Left hero text */}
        <div style={{ textAlign: 'center', padding: '48px 28px 32px', position: 'relative', gridColumn: '1', gridRow: '1' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.18em', color: '#1a1a1a', textTransform: 'uppercase', marginBottom: 14 }} className="fade-up">
            a cozy home
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(42px, 10vw, 64px)', fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 16, animationDelay: '0.1s' }} className="fade-up">
            Stillspace
          </h1>
          <p style={{ fontSize: 'clamp(15px, 3vw, 18px)', color: '#8a8a8e', lineHeight: 1.75, maxWidth: 320, margin: '0 auto 28px', animationDelay: '0.2s' }} className="fade-up">
            A quiet place to share presence,<br />not perform connection.
          </p>
          <div style={{ animationDelay: '0.3s' }} className="fade-up">
            <Link href="/home" style={{
              display: 'inline-block', padding: '15px 40px', background: '#2c2c2e', color: '#faf9f7',
              borderRadius: 999, textDecoration: 'none', fontSize: 16, letterSpacing: '0.04em',
              boxShadow: '0 6px 28px rgba(44,44,46,0.18)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(44,44,46,0.24)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(44,44,46,0.18)' }}
            >
              Enter Your Space
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap', animationDelay: '0.4s' }} className="fade-up">
            {['No Pressure', 'No Followers', 'No Urgency'].map((t, i) => (
              <span key={i} style={{ padding: '6px 14px', background: '#f0ede8', borderRadius: 999, fontSize: 16, color: '#2c2c2e' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Right dark CTA */}
        <div style={{
          gridColumn: '2',
          gridRow: '1',
          margin: '48px 160px 0 0px',
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #2c2c2e, #3e3e40)',
          borderRadius: 20,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          alignSelf: 'start',
          transform: 'translateX(-220px) translateY(80px)',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>ready when you are</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#ffffff', marginBottom: 6, lineHeight: 1.4 }}>Your quiet space is waiting.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>No email. No pressure. No timeline.</p>
          <Link href="/settings" style={{ display: 'inline-block', padding: '11px 28px', background: '#faf9f7', color: '#2c2c2e', borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Create your Space
          </Link>
        </div>

        {/* 4 feature cards */}
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gridColumn: '1 / 3', gridRow: '2', marginTop: '-140px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, width: '100%' }}>
            {[
              { icon: '◐', title: 'Emotional Status', desc: 'Share how you feel with only your circle', color: '#f0f5f0', href: '/status' },
              { icon: '◎', title: 'Private Circle',   desc: 'Max 10 trusted people, no one else',     color: '#f0eef5', href: '/circle' },
              { icon: '◇', title: 'Quiet Echoes',     desc: 'Reflect without pressure to respond',    color: '#f5f0eb', href: '/comfort' },
              { icon: '△', title: 'Disappear Mode',   desc: 'Go invisible whenever you need space',   color: '#eef0f5', href: '/settings' },
            ].map((f, i) => (
              <Link key={i} href={f.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '20px 16px', background: '#ffffff', borderRadius: 14, textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '100%',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease', animationDelay: i * 0.08 + 's',
                }}
                className="fade-up"
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6b6b6e', margin: '0 auto 12px' }}>{f.icon}</div>
                  <p style={{ fontSize: 16, fontWeight: 500, color: '#2c2c2e', marginBottom: 6 }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: '#b0a99a', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom floating symbols */}
        <div style={{ padding: '24px 20px 32px', display: 'flex', justifyContent: 'center', gap: 28, gridColumn: '1 / 3', gridRow: '3' }}>
          {['◇', '○', '△', '□', '◎'].map((s, i) => (
            <span key={i} style={{ fontSize: 16, color: '#d0cdc8', animation: 'softFloat ' + (3.5 + i * 0.6) + 's ease-in-out infinite', animationDelay: i * 0.4 + 's', display: 'inline-block' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Banner below fold */}
      <div style={{ padding: '20px 20px 40px', marginTop: '-200px', position: 'relative', zIndex: 10 }}>
        <GuestBanner />
      </div>

    </div>
  )
}
