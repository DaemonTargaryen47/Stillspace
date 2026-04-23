'use client'
import { useState, useEffect, useRef } from 'react'
import { initUser, updateUser } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import Navigation from '../../components/Navigation'
import Link from 'next/link'
import { STATUSES } from '../../lib/constants'

export default function ChatPage() {
  const [user, setUser] = useState(null)
  const [circle, setCircle] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatEnabled, setChatEnabled] = useState({})
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const u = initUser()
    setUser(u)
    setCircle(u.circle || [])
    setChatEnabled(u.chatToggles || {})
  }, [])

  useEffect(() => {
    if (!selectedMember || !user) return
    loadMessages()
    const chatId = getChatId(user.inviteCode, selectedMember.inviteCode)
    const channel = supabase
      .channel('messages_' + chatId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'chat_id=eq.' + chatId,
      }, (payload) => {
        if (payload.new.sender_code === user.inviteCode) return
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [selectedMember])

  const getChatId = (code1, code2) => {
    return [code1, code2].sort().join('_')
  }

  const loadMessages = async () => {
    if (!user || !selectedMember) return
    const chatId = getChatId(user.inviteCode, selectedMember.inviteCode)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const toggleChat = (memberCode) => {
    const updated = { ...chatEnabled, [memberCode]: !chatEnabled[memberCode] }
    setChatEnabled(updated)
    updateUser({ chatToggles: updated })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedMember || sending) return
    setSending(true)
    const chatId = getChatId(user.inviteCode, selectedMember.inviteCode)
    console.log('Sending to chat:', chatId)
    console.log('From:', user.inviteCode)
    console.log('To:', selectedMember.inviteCode)
    const { data, error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_code: user.inviteCode,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    })
    console.log('Result:', data, error)
    if (error) {
      console.error('Failed to send:', error)
    } else {
      setNewMessage('')
      await loadMessages()
    }
    setSending(false)
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#b0a99a', fontSize: 15 }}>loading...</p>
    </div>
  )

  const isChatOn = selectedMember ? chatEnabled[selectedMember.inviteCode] : false

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#faf9f7', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />

      <div style={{ padding: '108px 28px 0' }}>
        <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>optional</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Quiet Chat
        </h1>
        <p style={{ fontSize: 15, color: '#8a8a8e', marginBottom: 24, lineHeight: 1.6 }}>
          Chat is optional and must be enabled by both people. No read receipts. No pressure.
        </p>

        {user.isGuest ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 16, color: '#6b6b6e', marginBottom: 16, fontFamily: 'var(--font-serif)' }}>Create your space to access quiet chat.</p>
            <Link href="/settings" style={{ padding: '11px 28px', background: '#2c2c2e', color: '#faf9f7', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>
              create your space
            </Link>
          </div>
        ) : circle.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 16, color: '#6b6b6e', marginBottom: 16, fontFamily: 'var(--font-serif)' }}>Add people to your circle first.</p>
            <Link href="/circle" style={{ padding: '11px 28px', background: '#2c2c2e', color: '#faf9f7', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>
              go to circle
            </Link>
          </div>
        ) : (
          <>
            {/* Member list */}
            {!selectedMember && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {circle.map((m, i) => {
                  const isOn = chatEnabled[m.inviteCode]
                  const status = STATUSES.find(s => s.id === m.status)
                  return (
                    <div key={m.id} style={{ padding: '16px 18px', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 14px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: status ? status.bg : '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: status ? status.color : '#b0a99a', flexShrink: 0 }}>
                        {m.initials || '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, color: '#2c2c2e', fontWeight: 500, marginBottom: 2 }}>{m.displayName || m.initials}</p>
                        <p style={{ fontSize: 12, color: '#b0a99a' }}>chat is {isOn ? 'on' : 'off'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => toggleChat(m.inviteCode)}
                          style={{ width: 44, height: 24, borderRadius: 999, background: isOn ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}
                        >
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: isOn ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                        </button>
                        {isOn && (
                          <button
                            onClick={() => setSelectedMember(m)}
                            style={{ padding: '7px 14px', background: '#2c2c2e', color: '#faf9f7', border: 'none', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}
                          >
                            open
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Chat window */}
            {selectedMember && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <button onClick={() => { setSelectedMember(null); setMessages([]) }} style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b6b6e', fontSize: 16 }}>←</button>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#8a8a8e' }}>
                    {selectedMember.initials || '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, color: '#2c2c2e', fontWeight: 500 }}>{selectedMember.displayName || selectedMember.initials}</p>
                    
                  </div>
                </div>

                {!isChatOn ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: '#f8f7f4', borderRadius: 16 }}>
                    <p style={{ fontSize: 15, color: '#8a8a8e', marginBottom: 8, fontFamily: 'var(--font-serif)' }}>Chat is turned off.</p>
                    <p style={{ fontSize: 13, color: '#b0a99a' }}>Enable it with the toggle to start chatting.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ minHeight: 320, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, padding: '4px 0' }}>
                      {messages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#b0a99a', marginBottom: 6 }}>A quiet space between you.</p>
                          <p style={{ fontSize: 13, color: '#c0bdb8' }}>Say something, or nothing at all.</p>
                        </div>
                      )}
                      {messages.map((msg, i) => {
                        const isMe = msg.sender_code === user.inviteCode
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth: '75%',
                              padding: '10px 14px',
                              background: isMe ? '#2c2c2e' : '#ffffff',
                              color: isMe ? '#faf9f7' : '#2c2c2e',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              fontSize: 15,
                              lineHeight: 1.5,
                              boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                            }}>
                              {msg.content}
                            </div>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Say something gently..."
                        rows={2}
                        style={{ flex: 1, padding: '12px 16px', background: '#ffffff', border: '1.5px solid transparent', borderRadius: 14, fontSize: 15, color: '#2c2c2e', resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.5, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'border-color 0.2s ease' }}
                        onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                        onBlur={e => e.target.style.borderColor = 'transparent'}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        style={{ padding: '12px 16px', background: newMessage.trim() ? '#2c2c2e' : '#f0ede8', color: newMessage.trim() ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: 14, fontSize: 20, cursor: newMessage.trim() ? 'pointer' : 'default', transition: 'all 0.2s ease', flexShrink: 0 }}
                      >
                        ↑
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: '#c0bdb8', textAlign: 'center', marginTop: 8 }}>
                      Enter to send · Shift+Enter for new line
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
