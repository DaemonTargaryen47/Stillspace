'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { storage } from '../lib/store'

export default function Navigation() {
  const path = usePathname()
  const isRoot = path === '/'
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = () => setUser(storage.get('user'))
    loadUser()
    const interval = setInterval(loadUser, 1000)
    return () => clearInterval(interval)
  }, [])

  const SHORTCUTS = [
    { href: '/home',     label: 'Home'     },
    { href: '/circle',   label: 'Circle'   },
    { href: '/status',   label: 'Status'   },
    { href: '/comfort',  label: 'Comfort'  },
    { href: '/chat',     label: 'Chat'     },
    { href: '/settings', label: 'Settings' },
  ]

  const handleBack = () => {
    if (typeof window !== 'undefined') window.history.back()
  }

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(250,249,247,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48 }}>
          {!isRoot ? (
            <button onClick={handleBack} style={{ width: 32, height: 32, border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s ease', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7L9 12" stroke="#6b6b6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : <div style={{ width: 32 }} />}

          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#2c2c2e', letterSpacing: '-0.01em' }}>
              Stillspace
            </span>
          </Link>

          <Link href="/settings" style={{ textDecoration: 'none', flexShrink: 0 }}>
            {user?.avatar && !user?.isGuest ? (
              <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(0,0,0,0.08)', display: 'block' }} />
            ) : (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: user?.isGuest || !user ? '#f0ede8' : '#e8f0ea',
                border: '1.5px solid rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 500,
                color: user?.isGuest || !user ? '#b0a99a' : '#6b8a6e',
                transition: 'all 0.3s ease',
              }}>
                {user?.isGuest || !user ? '?' : initials}
              </div>
            )}
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '0 12px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {SHORTCUTS.map(({ href, label }) => {
            const active = path === href
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  padding: '5px 14px',
                  background: active ? '#2c2c2e' : 'transparent',
                  borderRadius: 999, fontSize: 12,
                  color: active ? '#faf9f7' : '#4a4a4c',
                  fontWeight: active ? 500 : 400,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f0ede8'; e.currentTarget.style.color = '#6b6b6e' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a4c' }}}
                >
                  {label}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {!isRoot && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(250,249,247,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 24px' }}>
          {SHORTCUTS.map(({ href, label }) => {
            const active = path === href
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 10px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#2c2c2e' : 'transparent', border: active ? 'none' : '1px solid rgba(0,0,0,0.18)', transition: 'all 0.2s ease' }} />
                  <span style={{ fontSize: 10, letterSpacing: '0.05em', color: active ? '#2c2c2e' : '#a0a0a3', fontWeight: active ? 500 : 400, transition: 'all 0.2s ease' }}>
                    {label}
                  </span>
                </div>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
