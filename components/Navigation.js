'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { storage } from '../lib/store'
import { useDarkMode } from '../lib/darkMode'

export default function Navigation() {
  const path = usePathname()
  const isRoot = path === '/'
  const [user, setUser] = useState(null)
  const { dark } = useDarkMode()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const loadUser = () => setUser(storage.get('user'))
    loadUser()
    const interval = setInterval(loadUser, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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

  const navBg = dark ? 'rgba(26,26,28,0.92)' : 'rgba(250,249,247,0.92)'
  const borderColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const textColor = dark ? '#e8e6e3' : '#2c2c2e'
  const mutedColor = dark ? '#787570' : '#4a4a4c'
  const activeColor = dark ? '#e8e6e3' : '#faf9f7'
  const activeBg = dark ? '#3a3a3c' : '#2c2c2e'
  const hoverBg = dark ? 'rgba(255,255,255,0.06)' : '#f0ede8'

  if (isDesktop) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg,
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid ' + borderColor,
      transition: 'background 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48 }}>
        {!isRoot ? (
          <button onClick={handleBack} style={{ width: 32, height: 32, border: '1px solid ' + borderColor, borderRadius: '50%', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s ease', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke={mutedColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : <div style={{ width: 32 }} />}

        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: textColor, letterSpacing: '-0.01em', transition: 'color 0.3s ease' }}>
            Stillspace
          </span>
        </Link>

        <Link href="/settings" style={{ textDecoration: 'none', flexShrink: 0 }}>
          {user?.avatar && !user?.isGuest ? (
            <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid ' + borderColor, display: 'block' }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: user?.isGuest || !user ? (dark ? '#3a3a3c' : '#f0ede8') : (dark ? '#2a4a2c' : '#e8f0ea'),
              border: '1.5px solid ' + borderColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500,
              color: user?.isGuest || !user ? mutedColor : (dark ? '#7aae7c' : '#6b8a6e'),
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
                background: active ? activeBg : 'transparent',
                borderRadius: 999, fontSize: 12,
                color: active ? activeColor : mutedColor,
                fontWeight: active ? 500 : 400,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = dark ? '#a8a6a3' : '#6b6b6e' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mutedColor }}}
              >
                {label}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
