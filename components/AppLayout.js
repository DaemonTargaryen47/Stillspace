'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { storage } from '../lib/store'
import { useDarkMode } from '../lib/darkMode'

const LINKS = [
  { href: '/home',     label: 'Home',     icon: '○' },
  { href: '/circle',   label: 'Circle',   icon: '◎' },
  { href: '/status',   label: 'Status',   icon: '◇' },
  { href: '/comfort',  label: 'Comfort',  icon: '△' },
  { href: '/chat',     label: 'Chat',     icon: '◉' },
  { href: '/settings', label: 'Settings', icon: '□' },
]

export default function AppLayout({ children }) {
  const path = usePathname()
  const isRoot = path === '/'
  const { dark } = useDarkMode()
  const [user, setUser] = useState(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const load = () => setUser(storage.get('user'))
    load()
    const t = setInterval(load, 1000)
    return () => clearInterval(t)
  }, [])

  if (isRoot || !isDesktop) return children

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        background: 'var(--bg-primary)',
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', marginBottom: 40, paddingLeft: 12 }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Stillspace</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>a gentle space</p>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {LINKS.map(({ href, label, icon }) => {
            const active = path === href
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12,
                  background: active ? 'var(--bg-muted)' : 'transparent',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-muted)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 16, color: active ? 'var(--text-primary)' : 'var(--text-muted)', width: 20, textAlign: 'center' }}>{icon}</span>
                  <span style={{ fontSize: 14, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? 500 : 400 }}>{label}</span>
                  {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sage)', marginLeft: 'auto' }} />}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Account */}
        <Link href="/settings" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {user?.avatar && !user?.isGuest ? (
              <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', flexShrink: 0 }}>
                {user?.isGuest || !user ? '?' : initials}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || user?.email || (user?.isGuest ? 'Guest' : 'You')}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user?.isGuest ? 'guest mode' : 'your space'}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: 220,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
