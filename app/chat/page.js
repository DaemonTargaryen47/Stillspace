'use client'
import { useState, useEffect, useRef } from 'react'
import { initUser, updateUser, pushToSupabase, hydrateUserFromSupabase } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import Navigation from '../../components/Navigation'
import Link from 'next/link'
import { STATUSES } from '../../lib/constants'

function formatTime(timestamp) {
  if (!timestamp) return ''
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  const msgDate = new Date(timestamp)
  const now = new Date()
  const diffMs = now - msgDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const opts = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz }
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return diffMins + 'm ago'
  if (diffHours < 24) return new Intl.DateTimeFormat(lang, opts).format(msgDate)
  if (diffDays === 1) return 'Yesterday ' + new Intl.DateTimeFormat(lang, opts).format(msgDate)
  if (diffDays < 7) return new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: tz }).format(msgDate) + ' ' + new Intl.DateTimeFormat(lang, opts).format(msgDate)
  return new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', timeZone: tz }).format(msgDate) + ' ' + new Intl.DateTimeFormat(lang, opts).format(msgDate)
}

function shouldShowTime(messages, index) {
  if (index === messages.length - 1) return true
  return (new Date(messages[index + 1].created_at) - new Date(messages[index].created_at)) > 600000
}

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [circle, setCircle] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatEnabled, setChatEnabled] = useState({})
  const [sending, setSending] = useState(false)
  const [theirToggles, setTheirToggles] = useState({})
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const u = initUser()
      const hydrated = await hydrateUserFromSupabase()
      const finalUser = hydrated || u
      setUser(finalUser)
      setCircle(finalUser.circle || [])
      setChatEnabled(finalUser.chatToggles || {})
      await loadTheirToggles(finalUser)
    }
    load()
  }, [])

  const loadTheirToggles = async (u) => {
    const c = u.circle || []
    if (!c.length) return
    const codes = c.map(m => m.inviteCode).filter(Boolean)
    const { data } = await supabase.from('users').select('invite_code, chat_toggles').in('invite_code', codes)
    if (!data) return
    const map = {}
    data.forEach(d => {
      const t = d.chat_toggles ? JSON.parse(d.chat_toggles) : {}
      map[d.invite_code] = t[u.inviteCode] || false
    })
    setTheirToggles(map)
  }

  useEffect(() => {
    if (!selectedMember || !user) return
    loadMessages()
    const chatId = getChatId(user.inviteCode, selectedMember.inviteCode)
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const channel = supabase.channel('chat_' + chatId)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId }, (payload) => {
      if (payload.new.sender_code === user.inviteCode) return
      setMessages(prev => [...prev, payload.new])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }).subscribe()
    channelRef.current = channel
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null } }
  }, [selectedMember])

  const getChatId = (a, b) => [a, b].sort().join('_')

  const loadMessages = async () => {
    if (!user || !selectedMember) return
    const { data } = await supabase.from('messages').select('*').eq('chat_id', getChatId(user.inviteCode, selectedMember.inviteCode)).order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const toggleChat = async (memberCode) => {
    const updated = { ...chatEnabled, [memberCode]: !chatEnabled[memberCode] }
    setChatEnabled(updated)
    await pushToSupabase(updateUser({ chatToggles: updated }))
  }

  const sendMessage = async () => {
    const text = newMessage.trim()
    if (!text || !user || !selectedMember || sending) return
    setSending(true)
    setNewMessage('')
    const { error } = await supabase.from('messages').insert({ chat_id: getChatId(user.inviteCode, selectedMember.inviteCode), sender_code: user.inviteCode, content: text, created_at: new Date().toISOString() })
    if (error) setNewMessage(text)
    else await loadMessages()
    setSending(false)
  }

  if (!user) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="text-m" style={{ fontSize: 15 }}>loading...</p>
    </div>
  )

  const myOn = selectedMember ? (chatEnabled[selectedMember.inviteCode] || false) : false
  const theirOn = selectedMember ? (theirToggles[selectedMember.inviteCode] || false) : false

  return (
    <div className="page-wrap" style={{ maxWidth: 520, margin: '0 auto', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />
      <div style={{ padding: '108px 28px 0' }}>
        <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>optional</p>
        <h1 className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>Quiet Chat</h1>
        <p className="text-s" style={{ fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>Chat is optional. No read receipts. No pressure.</p>

        {user.isGuest ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', borderRadius: 18 }}>
            <p className="text-s" style={{ fontSize: 16, marginBottom: 16, fontFamily: 'var(--font-serif)' }}>Create your space to access quiet chat.</p>
            <Link href="/settings" style={{ padding: '11px 28px', background: '#2c2c2e', color: '#faf9f7', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>create your space</Link>
          </div>
        ) : circle.length === 0 ? (
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center', borderRadius: 18 }}>
            <p className="text-s" style={{ fontSize: 16, marginBottom: 16, fontFamily: 'var(--font-serif)' }}>Add people to your circle first.</p>
            <Link href="/circle" style={{ padding: '11px 28px', background: '#2c2c2e', color: '#faf9f7', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>go to circle</Link>
          </div>
        ) : !selectedMember ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {circle.map((m) => {
              const isMyOn = chatEnabled[m.inviteCode] || false
              const isTheirOn = theirToggles[m.inviteCode] || false
              const status = STATUSES.find(s => s.id === m.status)
              return (
                <div key={m.id} className="card" style={{ padding: '16px 18px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: status ? status.bg : '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: status ? status.color : '#b0a99a', flexShrink: 0 }}>
                    {m.initials || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="text-p" style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{m.displayName || m.initials}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <p style={{ fontSize: 12, color: isMyOn ? '#8a9e8c' : '#b0a99a' }}>you: {isMyOn ? 'on' : 'off'}</p>
                      <span style={{ color: '#d0cdc8' }}>·</span>
                      <p style={{ fontSize: 12, color: isTheirOn ? '#8a9e8c' : '#b0a99a' }}>them: {isTheirOn ? 'on' : 'off'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => toggleChat(m.inviteCode)} className={isMyOn ? '' : 'toggle-track-off'} style={{ width: 44, height: 24, borderRadius: 999, background: isMyOn ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: isMyOn ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                    </button>
                    <button onClick={() => setSelectedMember(m)} style={{ padding: '7px 14px', background: '#2c2c2e', color: '#faf9f7', border: 'none', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>open</button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <button onClick={() => { setSelectedMember(null); setMessages([]) }} className="card" style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#8a8a8e', flexShrink: 0 }}>
                {selectedMember.initials || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <p className="text-p" style={{ fontSize: 15, fontWeight: 500 }}>{selectedMember.displayName || selectedMember.initials}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <p style={{ fontSize: 11, color: myOn ? '#8a9e8c' : '#b0a99a' }}>you: {myOn ? 'on' : 'off'}</p>
                  <span style={{ color: '#d0cdc8', fontSize: 10 }}>·</span>
                  <p style={{ fontSize: 11, color: theirOn ? '#8a9e8c' : '#c0392b' }}>them: {theirOn ? 'on' : 'off'}</p>
                </div>
              </div>
              <button onClick={() => toggleChat(selectedMember.inviteCode)} className={myOn ? '' : 'toggle-track-off'} style={{ width: 44, height: 24, borderRadius: 999, background: myOn ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: myOn ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </button>
            </div>

            {!theirOn && (
              <div className="warn-box" style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, borderLeft: '3px solid #e8b89a' }}>
                <p style={{ fontSize: 13, color: '#a07050', lineHeight: 1.5 }}>{selectedMember.displayName || 'This person'} has chat turned off. They can still receive your messages.</p>
              </div>
            )}
            {!myOn && (
              <div className="card-muted" style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, borderLeft: '3px solid #d0cdc8' }}>
                <p className="text-s" style={{ fontSize: 13, lineHeight: 1.5 }}>You have chat turned off. Turn it on to send messages.</p>
              </div>
            )}

            <div style={{ minHeight: 320, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, padding: '4px 0' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p className="text-m" style={{ fontFamily: 'var(--font-serif)', fontSize: 17, marginBottom: 6 }}>A quiet space between you.</p>
                  <p className="text-f" style={{ fontSize: 13 }}>Say something, or nothing at all.</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender_code === user.inviteCode
                const show = shouldShowTime(messages, i)
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div className={isMe ? '' : 'msg-bubble-them'} style={{ maxWidth: '75%', padding: '10px 14px', background: isMe ? '#2c2c2e' : '#ffffff', color: isMe ? '#faf9f7' : '#2c2c2e', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 15, lineHeight: 1.5, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                        {msg.content}
                      </div>
                    </div>
                    {show && <p className="text-f" style={{ fontSize: 10, textAlign: isMe ? 'right' : 'left', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>{formatTime(msg.created_at)}</p>}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {myOn && (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Say something gently..." rows={2}
                    className="input-field"
                    style={{ flex: 1, padding: '12px 16px', border: '1.5px solid transparent', borderRadius: 14, fontSize: 15, resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.5, transition: 'border-color 0.2s ease' }}
                    onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                    onBlur={e => e.target.style.borderColor = 'transparent'}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sending) sendMessage() } }}
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending} style={{ padding: '12px 16px', background: newMessage.trim() ? '#2c2c2e' : '#f0ede8', color: newMessage.trim() ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: 14, fontSize: 20, cursor: newMessage.trim() ? 'pointer' : 'default', transition: 'all 0.2s ease', flexShrink: 0 }}>↑</button>
                </div>
                <p className="text-f" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>Enter to send · Shift+Enter for new line</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
