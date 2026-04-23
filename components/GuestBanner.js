'use client'
import Link from 'next/link'

export default function GuestBanner({ message, variant = 'subtle' }) {
  if (variant === 'page') {
    return (
      <div style={{
        textAlign: 'center',
        padding: '36px 28px',
        background: 'linear-gradient(135deg, #f0ede8, #ebe8e2)',
        borderRadius: 20,
        marginTop: 24,
      }}>
        <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          ready to connect?
        </p>
        <p style={{ fontSize: 20, fontFamily: 'var(--font-serif)', color: '#4a4a4c', marginBottom: 8, lineHeight: 1.5 }}>
          {message || 'Your quiet circle becomes real when you create your space.'}
        </p>
        <p style={{ fontSize: 14, color: '#b0a99a', marginBottom: 24, lineHeight: 1.6 }}>
          No email required. No pressure, ever.
        </p>
        <Link href="/settings" style={{
          padding: '13px 32px',
          background: '#2c2c2e',
          color: '#faf9f7',
          borderRadius: '999px',
          textDecoration: 'none',
          fontSize: 15,
          letterSpacing: '0.03em',
          boxShadow: '0 4px 20px rgba(44,44,46,0.15)',
        }}>
          create your space
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      padding: '16px 24px',
      background: '#f0ede8',
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      maxWidth: 560,
      margin: '0 auto',
    }}>
      <p style={{ fontSize: 14, color: '#6b6b6e', lineHeight: 1.6 }}>
        {message || 'To share your space with people you trust, create a Stillspace account.'}
      </p>
      <Link href="/settings" style={{
        padding: '9px 18px',
        background: '#2c2c2e',
        borderRadius: '999px',
        textDecoration: 'none',
        fontSize: 13,
        color: '#faf9f7',
        whiteSpace: 'nowrap',
        letterSpacing: '0.03em',
        flexShrink: 0,
      }}>
        create space
      </Link>
    </div>
  )
}
