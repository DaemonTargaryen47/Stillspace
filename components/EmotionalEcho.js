'use client'
import { useState } from 'react'
import { getReflection } from '../lib/constants'

export default function EmotionalEcho() {
  const [text, setText] = useState('')
  const [reflection, setReflection] = useState(null)
  const [loading, setLoading] = useState(false)

  const reflect = () => {
    if (!text.trim()) return
    setLoading(true)
    setReflection(null)
    setTimeout(() => {
      setReflection(getReflection(text))
      setLoading(false)
    }, 900)
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      padding: '26px',
      boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
    }}>
      <p style={{ fontSize: 11, color: '#b0a99a', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        emotional echo
      </p>
      <p style={{ fontSize: 16, color: '#6b6b6e', marginBottom: 22, lineHeight: 1.7 }}>
        Write a sentence about how you feel. It stays here, between you and this page.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="I feel..."
        rows={3}
        style={{
          width: '100%',
          background: '#f8f7f4',
          border: '1.5px solid transparent',
          borderRadius: 14,
          padding: '14px 18px',
          fontSize: 16,
          color: '#2c2c2e',
          resize: 'none',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          lineHeight: 1.6,
          transition: 'border-color 0.2s ease, background 0.2s ease',
        }}
        onFocus={e => { e.target.style.borderColor = '#8a9e8c'; e.target.style.background = '#ffffff' }}
        onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f8f7f4' }}
      />

      <button
        onClick={reflect}
        disabled={!text.trim() || loading}
        style={{
          marginTop: 14,
          padding: '11px 28px',
          background: text.trim() && !loading ? '#2c2c2e' : '#f0ede8',
          color: text.trim() && !loading ? '#faf9f7' : '#b0a99a',
          border: 'none',
          borderRadius: '999px',
          fontSize: 14,
          cursor: text.trim() && !loading ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          letterSpacing: '0.04em',
        }}
      >
        {loading ? 'listening...' : 'reflect'}
      </button>

      {reflection && (
        <div style={{
          marginTop: 22,
          padding: '20px 22px',
          background: 'linear-gradient(135deg, #f0f5f0, #edf2ed)',
          borderRadius: 16,
          borderLeft: '3px solid #8a9e8c',
          animation: 'fadeUp 0.5s ease forwards',
        }}>
          <p style={{
            fontSize: 18,
            color: '#4a5a4c',
            lineHeight: 1.75,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
          }}>
            {reflection}
          </p>
        </div>
      )}
    </div>
  )
}
