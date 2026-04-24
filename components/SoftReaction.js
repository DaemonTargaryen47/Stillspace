'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SYMBOLS = ['◇', '○', '△', '□', '◎']

export default function SoftReaction({ myCode, memberCode }) {
  const [floating, setFloating] = useState([])
  const [sent, setSent] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (!myCode) return
    const channel = supabase
      .channel('reactions_to_' + myCode + '_' + Date.now())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reactions',
        filter: 'to_code=eq.' + myCode,
      }, (payload) => {
        const id = Date.now()
        setFloating(prev => [...prev, { id, symbol: payload.new.symbol }])
        setTimeout(() => setFloating(prev => prev.filter(f => f.id !== id)), 3000)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [myCode])

  const handleSend = async (symbol) => {
    if (sent || !myCode || !memberCode) return
    setSent(true)
    setShowPicker(false)
    await supabase.from('reactions').insert({
      from_code: myCode,
      to_code: memberCode,
      symbol,
      created_at: new Date().toISOString(),
    })
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {floating.map(f => (
        <div key={f.id} style={{
          position: 'fixed',
          bottom: '30%',
          left: '50%',
          fontSize: 52,
          color: '#8a9e8c',
          animation: 'floatUp 3s ease forwards',
          pointerEvents: 'none',
          zIndex: 999,
          transform: 'translateX(-50%)',
        }}>
          {f.symbol}
        </div>
      ))}

      {!showPicker ? (
        <button
          onClick={() => !sent && setShowPicker(true)}
          style={{
            padding: '6px 14px',
            background: sent ? '#f0f5f0' : '#f8f7f4',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 999, fontSize: 12,
            color: sent ? '#8a9e8c' : '#b0a99a',
            cursor: sent ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {sent ? 'sent ◇' : 'react'}
        </button>
      ) : (
        <div style={{
          display: 'flex', gap: 4, padding: '6px 8px',
          background: '#ffffff', borderRadius: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          position: 'absolute', right: 0, top: -48,
          zIndex: 50, whiteSpace: 'nowrap',
        }}>
          {SYMBOLS.map(s => (
            <button key={s} onClick={() => handleSend(s)} style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: 'none', fontSize: 16, cursor: 'pointer', color: '#6b6b6e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >{s}</button>
          ))}
          <button onClick={() => setShowPicker(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'none', fontSize: 14, cursor: 'pointer', color: '#c0bdb8' }}>×</button>
        </div>
      )}
    </div>
  )
}
