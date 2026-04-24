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
      { w: 280, h: 280, top: '2%',  left: '-8%',  color: 'rgba(138,158,140,0.12)', delay: '0s',   dur: '9s'  },
      { w: 200, h: 200, top: '8%',  right: '-5%', color: 'rgba(160,144,128,0.09)', delay: '1.5s', dur: '11s' },
      { w: 150, h: 150, top: '50%', left: '60%',  color: 'rgba(154,138,170,0.07)', delay: '3s',   dur: '8s'  },
    ])
  }, [])

  return (
    <div style={{ maxWidth: '100vw', margin: '0 auto', minHeight: '100vh', background: '#faf9f7', overflowX: 'hidden' }}>
      <Navigation />

      {/* HERO */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px 40px', position: 'relative', overflow: 'hidden', textAlign: 'center', marginTop: '-100px' }}>
        {orbs.map((o, i) => (
          <div key={i} style={{
            position: 'absolute', width: o.w, height: o.h, borderRadius: '50%',
            background: 'radial-gradient(circle, ' + o.color + ' 0%, transparent 70%)',
            top: o.top, left: o.left, right: o.right, pointerEvents: 'none',
            animation: 'drift ' + o.dur + ' ease-in-out infinite', animationDelay: o.delay,
          }} />
        ))}

        <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.18em', color: '#b0a99a', textTransform: 'uppercase', marginBottom: 16 }} className="fade-up">
            a gentle space
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(48px, 14vw, 72px)', fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20, animationDelay: '0.1s' }} className="fade-up">
            Stillspace
          </h1>
          <p style={{ fontSize: 17, color: '#8a8a8e', lineHeight: 1.8, maxWidth: 300, margin: '0 auto 32px', animationDelay: '0.2s' }} className="fade-up">
            Where the noise ends and the echoes begin..
          </p>

          <div style={{ animationDelay: '0.3s', marginBottom: 28 }} className="fade-up">
            <Link href="/home" style={{
              display: 'inline-block', padding: '16px 44px', background: '#2c2c2e', color: '#faf9f7',
              borderRadius: 999, textDecoration: 'none', fontSize: 16, letterSpacing: '0.04em',
              boxShadow: '0 6px 28px rgba(44,44,46,0.18)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(44,44,46,0.24)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(44,44,46,0.18)' }}
            >
              Enter Your Space
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', animationDelay: '0.4s' }} className="fade-up">
            {['No Pressure', 'No Urgency'].map((t, i) => (
              <span key={i} style={{ padding: '7px 16px', background: '#f0ede8', borderRadius: 999, fontSize: 14, color: '#2c2c2e' }}>{t}</span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 48 }}>
            {['◇', '○', '△', '□', '◎'].map((s, i) => (
              <span key={i} style={{ fontSize: 16, color: '#d0cdc8', animation: 'softFloat ' + (3.5 + i * 0.6) + 's ease-in-out infinite', animationDelay: i * 0.4 + 's', display: 'inline-block' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ALL 3 SECTIONS PULLED UP */}
      <div style={{ marginTop: '-220px', position: 'relative', zIndex: 10 }}>

        {/* DARK CTA */}
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ padding: '36px 28px', background: 'linear-gradient(135deg, #2c2c2e, #3e3e40)', borderRadius: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>ready when you are</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: '#ffffff', marginBottom: 8, lineHeight: 1.4, position: 'relative' }}>
              Your quiet space is waiting.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
              No email. No pressure. No timeline.
            </p>
            <Link href="/settings" style={{ display: 'inline-block', padding: '13px 36px', background: '#faf9f7', color: '#2c2c2e', borderRadius: 999, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}>
              Create Your Space
            </Link>
          </div>
        </div>

        {/* FEATURES */}
        <div style={{ padding: '0 20px 40px' }}>
          <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 }}>what stillspace offers</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '◐', title: 'Emotional Status', desc: 'Share how you feel with only your circle. No public performance.', color: '#f0f5f0', href: '/status' },
              { icon: '◎', title: 'Private Circle',   desc: 'Connect with max 10 trusted people. No followers, no strangers.', color: '#f0eef5', href: '/circle' },
              { icon: '◇', title: 'Quiet Echoes',     desc: 'Reflect without pressure to respond. Your feelings, heard.', color: '#f5f0eb', href: '/comfort' },
              { icon: '△', title: 'Disappear Mode',   desc: 'Go invisible whenever you need space. Nothing disturbed.', color: '#eef0f5', href: '/settings' },
              { icon: '◈', title: 'Quiet Chat',       desc: 'Optional messaging. No read receipts. No urgency.', color: '#f5f0f5', href: '/chat' },
            ].map((f, i) => (
              <Link key={i} href={f.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '20px', background: '#ffffff', borderRadius: 18,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  animationDelay: i * 0.07 + 's',
                }}
                className="fade-up"
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#6b6b6e', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 500, color: '#2c2c2e', marginBottom: 4 }}>{f.title}</p>
                    <p style={{ fontSize: 13, color: '#b0a99a', lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#d0cdc8', fontSize: 18, flexShrink: 0 }}>›</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* BANNER */}
        <div style={{ padding: '0 20px 60px' }}>
          <GuestBanner />
        </div>

      </div>
    </div>
  )
}
