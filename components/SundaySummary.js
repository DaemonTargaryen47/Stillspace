'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { storage } from '../lib/store'
import { STATUSES } from '../lib/constants'

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

function getDaysSinceMonday() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

export default function SundaySummary() {
  const [summary, setSummary] = useState(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    const lastDismissed = localStorage.getItem('stillspace_sundayDismissed')
    const thisWeek = getWeekStart()
    if (lastDismissed === thisWeek) return
    const days = getDaysSinceMonday()
    if (days < 1) return
    buildSummary()
  }, [])

  const buildSummary = async () => {
    const user = storage.get('user')
    if (!user || user.isGuest) return
    const circle = user.circle || []
    if (circle.length === 0) return

    const weekStart = getWeekStart()
    const codes = circle.map(m => m.inviteCode).filter(Boolean)
    const chatPartners = []

    for (const member of circle) {
      const chatId = [user.inviteCode, member.inviteCode].sort().join('_')
      const { data: msgs } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId)
        .gte('created_at', weekStart)
      if (msgs && msgs.length > 0) {
        chatPartners.push({ name: member.displayName || member.initials || 'Someone', count: msgs.length })
      }
    }

    const { data: circleUsers } = await supabase
      .from('users')
      .select('invite_code, status, custom_status_text, display_name, disappear_mode')
      .in('invite_code', codes)

    const disappearedOften = circleUsers?.filter(u => u.disappear_mode).map(u => u.display_name || 'Someone') || []

    const statusCounts = {}
    circleUsers?.forEach(u => {
      if (u.status) statusCounts[u.status] = (statusCounts[u.status] || 0) + 1
    })

    const topStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topStatusLabel = STATUSES.find(s => s.id === topStatus)?.label || null
    const userStatus = user.statusHistory?.[0]?.status
    const userStatusLabel = STATUSES.find(s => s.id === userStatus)?.label

    setSummary({
      chatPartners,
      disappearedOften,
      topStatusLabel,
      userStatusLabel,
      circleSize: circle.length,
      days: getDaysSinceMonday(),
    })

    setTimeout(() => {
      setVisible(true)
      setTimeout(() => setAnimateIn(true), 50)
    }, 1200)
  }

  const dismiss = () => {
    setAnimateIn(false)
    setTimeout(() => {
      setVisible(false)
      setDismissed(true)
      localStorage.setItem('stillspace_sundayDismissed', getWeekStart())
    }, 400)
  }

  if (!visible || dismissed || !summary) return null

  const lines = []
  if (summary.topStatusLabel) lines.push(`Your circle felt mostly ${summary.topStatusLabel.toLowerCase()} this week.`)
  if (summary.chatPartners.length > 0) {
    const names = summary.chatPartners.map(p => p.name).slice(0, 2).join(' and ')
    lines.push(`You and ${names} shared some quiet chats.`)
  } else {
    lines.push(`The circle was quiet this week. Sometimes silence is enough.`)
  }
  if (summary.disappearedOften.length > 0) lines.push(`${summary.disappearedOften[0]} disappeared quite a lot this week.`)
  if (summary.userStatusLabel) lines.push(`You spent time feeling ${summary.userStatusLabel.toLowerCase()}.`)
  lines.push(`${summary.circleSize} ${summary.circleSize === 1 ? 'person' : 'people'} in your circle. That's enough.`)

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: animateIn ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120px)',
      zIndex: 9000,
      width: 'min(480px, calc(100vw - 32px))',
      transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
      opacity: animateIn ? 1 : 0,
    }}>
      <div style={{
        background: 'rgba(26,26,28,0.97)',
        borderRadius: 24,
        padding: '28px 28px 24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #8a9e8c, #a8b8c2, #c2a8b8, #8a9e8c)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 4s linear infinite',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 10, color: '#787570', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>weekly reflection</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#f0ede8', fontWeight: 400, letterSpacing: '-0.01em' }}>This Week in Your Circle</p>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#585550', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, marginTop: -4 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: ['#8a9e8c','#a8b8c2','#c2a8b8','#c8b8a2','#8a9e8c'][i % 5], flexShrink: 0, marginTop: 8 }} />
              <p style={{ fontSize: 14, color: '#c8c4be', lineHeight: 1.65, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{line}</p>
            </div>
          ))}
        </div>

        <button onClick={dismiss} style={{
          width: '100%', padding: '11px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
          fontSize: 13, color: '#a8a4a0', cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '0.02em',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e0ddd8' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#a8a4a0' }}
        >
          carry it gently
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  )
}
