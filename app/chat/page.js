'use client'
import { useState, useEffect, useRef } from 'react'
import { initUser, updateUser, pushToSupabase, hydrateUserFromSupabase } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import Navigation from '../../components/Navigation'
import Link from 'next/link'
import { STATUSES } from '../../lib/constants'
import { sanitizeMessage } from '../../lib/sanitize'

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

function formatScheduledTime(timestamp) {
  if (!timestamp) return ''
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = date - now
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffMins < 1) return 'sending now...'
  if (diffMins < 60) return 'sends in ' + diffMins + 'm'
  if (diffHours < 24) return 'sends at ' + new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz }).format(date)
  return 'sends ' + new Intl.DateTimeFormat(lang, { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz }).format(date)
}

function shouldShowTime(messages, index) {
  if (index === messages.length - 1) return true
  return (new Date(messages[index + 1].created_at) - new Date(messages[index].created_at)) > 600000
}

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m + ':' + String(s).padStart(2, '0')
}

function AudioPlayer({ url, isMe }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => { setPlaying(false); setProgress(0) }
    const onTimeUpdate = () => setProgress(audio.currentTime / audio.duration || 0)
    const onLoaded = () => setDuration(Math.round(audio.duration))
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoaded)
    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)', borderRadius: 12, minWidth: 180 }}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: '50%', background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
        {playing ? '⏸' : '▶'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ height: 3, background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: (progress * 100) + '%', background: isMe ? '#ffffff' : '#8a9e8c', borderRadius: 2, transition: 'width 0.1s linear' }} />
        </div>
        <p style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : '#b0a99a' }}>{formatDuration(duration)}</p>
      </div>
    </div>
  )
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
  const [slowSend, setSlowSend] = useState(false)
  const [slowHours, setSlowHours] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const scheduledTimerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const fileInputRef = useRef(null)

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

  useEffect(() => {
    if (!selectedMember || !user) return
    scheduledTimerRef.current = setInterval(() => loadMessages(true), 30000)
    return () => clearInterval(scheduledTimerRef.current)
  }, [selectedMember, user])

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
    channel.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: 'chat_id=eq.' + chatId,
    }, (payload) => {
      const msg = payload.new
      if (msg.sender_code === user.inviteCode) return
      const isVisible = !msg.is_scheduled || !msg.scheduled_at || new Date(msg.scheduled_at) <= new Date()
      if (isVisible) {
        setMessages(prev => [...prev, msg])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }).subscribe()
    channelRef.current = channel
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    }
  }, [selectedMember])

  const getChatId = (a, b) => [a, b].sort().join('_')

  const loadMessages = async (silent = false) => {
    if (!user || !selectedMember) return
    const now = new Date().toISOString()
    const chatId = getChatId(user.inviteCode, selectedMember.inviteCode)
    const { data: allMine } = await supabase.from('messages').select('*').eq('chat_id', chatId).eq('sender_code', user.inviteCode).order('created_at', { ascending: true })
    const { data: theirVisible } = await supabase.from('messages').select('*').eq('chat_id', chatId).neq('sender_code', user.inviteCode).or('is_scheduled.eq.false,scheduled_at.lte.' + now).order('created_at', { ascending: true })
    const combined = [...(allMine || []), ...(theirVisible || [])]
    combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setMessages(combined)
    if (!silent) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const toggleChat = async (memberCode) => {
    const updated = { ...chatEnabled, [memberCode]: !chatEnabled[memberCode] }
    setChatEnabled(updated)
    await pushToSupabase(updateUser({ chatToggles: updated }))
  }

  const sendMessage = async () => {
    const text = sanitizeMessage(newMessage.trim())
    if (!text || !user || !selectedMember || sending) return
    if (slowSend && (!slowHours || isNaN(parseFloat(slowHours)) || parseFloat(slowHours) <= 0)) return
    setSending(true)
    setNewMessage('')
    let scheduledAt = null
    if (slowSend) scheduledAt = new Date(Date.now() + parseFloat(slowHours) * 3600000).toISOString()
    const { error } = await supabase.from('messages').insert({
      chat_id: getChatId(user.inviteCode, selectedMember.inviteCode),
      sender_code: user.inviteCode,
      content: text,
      created_at: new Date().toISOString(),
      message_type: 'text',
      is_scheduled: !!scheduledAt,
      scheduled_at: scheduledAt,
    })
    if (error) setNewMessage(text)
    else await loadMessages()
    setSending(false)
  }

  const uploadFile = async (file) => {
    setUploadError(null)
    if (file.size > 2 * 1024 * 1024) { setUploadError('File too large. Max 2 MB.'); return }
    setSending(true)
    const ext = file.name.split('.').pop()
    const path = user.inviteCode + '/' + Date.now() + '.' + ext
    const { data, error } = await supabase.storage.from('chat-attachments').upload(path, file, { upsert: true })
    if (error) { setUploadError('Upload failed. Try again.'); setSending(false); return }
    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path)
    await supabase.from('messages').insert({
      chat_id: getChatId(user.inviteCode, selectedMember.inviteCode),
      sender_code: user.inviteCode,
      content: file.name,
      created_at: new Date().toISOString(),
      message_type: file.type.startsWith('image/') ? 'image' : 'file',
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      is_scheduled: false,
      scheduled_at: null,
    })
    await loadMessages()
    setSending(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []
      mediaRecorder.ondataavailable = e => chunks.push(e.data)
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
    } catch { setUploadError('Microphone access denied.') }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
    clearInterval(recordingTimerRef.current)
    setRecording(false)
  }

  const sendAudio = async () => {
    if (!audioBlob) return
    setSending(true)
    const path = user.inviteCode + '/voice_' + Date.now() + '.webm'
    const { error } = await supabase.storage.from('chat-attachments').upload(path, audioBlob, { upsert: true })
    if (error) { setUploadError('Failed to send voice message.'); setSending(false); return }
    const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path)
    await supabase.from('messages').insert({
      chat_id: getChatId(user.inviteCode, selectedMember.inviteCode),
      sender_code: user.inviteCode,
      content: 'Voice message',
      created_at: new Date().toISOString(),
      message_type: 'audio',
      file_url: urlData.publicUrl,
      duration: recordingSeconds,
      is_scheduled: false,
      scheduled_at: null,
    })
    setAudioBlob(null)
    setRecordingSeconds(0)
    await loadMessages()
    setSending(false)
  }

  const cancelScheduled = async (msgId) => {
    await supabase.from('messages').delete().eq('id', msgId)
    setMessages(prev => prev.filter(m => m.id !== msgId))
  }

  if (!user) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="text-m" style={{ fontSize: 15 }}>loading...</p>
    </div>
  )

  const myOn = selectedMember ? (chatEnabled[selectedMember.inviteCode] || false) : false
  const theirOn = selectedMember ? (theirToggles[selectedMember.inviteCode] || false) : false
  const slowHoursValid = slowHours && !isNaN(parseFloat(slowHours)) && parseFloat(slowHours) > 0

  return (
    <div className="page-wrap" style={{ maxWidth: 520, margin: '0 auto', minHeight: '100vh', paddingBottom: 60 }}>
      <Navigation />
      <div style={{ padding: '108px 28px 0' }}>
        <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>optional</p>
        <h1 className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>Quiet Chat</h1>
        <p className="text-s" style={{ fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>Chat is encrypted and optional.</p>

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
                      <p style={{ fontSize: 12, color: isMyOn ? '#8a9e8c' : '#c0392b' }}>You: {isMyOn ? 'On' : 'Off'}</p>
                      <span style={{ color: '#d0cdc8' }}>·</span>
                      <p style={{ fontSize: 12, color: isTheirOn ? '#8a9e8c' : '#c0392b' }}>Them: {isTheirOn ? 'On' : 'Off'}</p>
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
              <button onClick={() => { setSelectedMember(null); setMessages([]); setSlowSend(false); setSlowHours(''); setAudioBlob(null) }} className="card" style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#8a8a8e', flexShrink: 0 }}>
                {selectedMember.initials || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <p className="text-p" style={{ fontSize: 15, fontWeight: 500 }}>{selectedMember.displayName || selectedMember.initials}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <p style={{ fontSize: 11, color: myOn ? '#8a9e8c' : '#c0392b' }}>You: {myOn ? 'On' : 'Off'}</p>
                  <span className="text-f" style={{ fontSize: 10 }}>·</span>
                  <p style={{ fontSize: 11, color: theirOn ? '#8a9e8c' : '#c0392b' }}>Them: {theirOn ? 'On' : 'Off'}</p>
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

            {uploadError && (
              <div style={{ padding: '10px 14px', background: '#fdf0ef', borderRadius: 10, marginBottom: 12, borderLeft: '3px solid #c0392b' }}>
                <p style={{ fontSize: 13, color: '#c0392b' }}>{uploadError}</p>
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
                const isPending = isMe && msg.is_scheduled && msg.scheduled_at && new Date(msg.scheduled_at) > new Date()
                const show = shouldShowTime(messages, i)
                return (
                  <div key={msg.id || i}>
                    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
                        {isPending && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 10, color: '#a09080', background: '#f5f0eb', padding: '2px 8px', borderRadius: 999 }}>⏱ {formatScheduledTime(msg.scheduled_at)}</span>
                            <button onClick={() => cancelScheduled(msg.id)} style={{ fontSize: 10, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>cancel</button>
                          </div>
                        )}
                        <div className={isMe ? '' : 'msg-bubble-them'} style={{
                          padding: msg.message_type === 'audio' ? '8px 10px' : msg.message_type === 'image' ? '4px' : '10px 14px',
                          background: isPending ? '#f5f0eb' : isMe ? '#2c2c2e' : '#ffffff',
                          color: isPending ? '#a09080' : isMe ? '#faf9f7' : '#2c2c2e',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: 15, lineHeight: 1.5,
                          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                          opacity: isPending ? 0.8 : 1,
                          overflow: 'hidden',
                        }}>
                          {msg.message_type === 'audio' ? (
                            <AudioPlayer url={msg.file_url} isMe={isMe} />
                          ) : msg.message_type === 'image' ? (
                            <img src={msg.file_url} alt={msg.file_name} style={{ maxWidth: 220, maxHeight: 220, borderRadius: 14, display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.file_url, '_blank')} />
                          ) : msg.message_type === 'file' ? (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: isMe ? '#faf9f7' : '#2c2c2e' }}>
                              <span style={{ fontSize: 20 }}>📎</span>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 500 }}>{msg.file_name}</p>
                                <p style={{ fontSize: 10, opacity: 0.6 }}>{msg.file_size ? (msg.file_size / 1024).toFixed(1) + ' KB' : ''}</p>
                              </div>
                            </a>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                    {show && !isPending && (
                      <p className="text-f" style={{ fontSize: 10, textAlign: isMe ? 'right' : 'left', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {myOn && (
              <>
                <div className="card-muted" style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>⏱</span>
                      <div>
                        <p className="text-p" style={{ fontSize: 13, fontWeight: 500 }}>Slow Send</p>
                        <p className="text-m" style={{ fontSize: 11 }}>Deliver after a delay</p>
                      </div>
                    </div>
                    <button onClick={() => { setSlowSend(prev => !prev); setSlowHours('') }} className={slowSend ? '' : 'toggle-track-off'} style={{ width: 44, height: 24, borderRadius: 999, background: slowSend ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: slowSend ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                    </button>
                  </div>
                  {slowSend && (
                    <div style={{ marginTop: 12 }}>
                      <p className="text-s" style={{ fontSize: 12, marginBottom: 8 }}>Deliver after how many hours?</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="number" min="0.5" step="0.5" value={slowHours} onChange={e => setSlowHours(e.target.value)} placeholder="e.g. 3.5"
                          className="input-field"
                          style={{ flex: 1, padding: '9px 14px', border: '1.5px solid transparent', borderRadius: 10, fontSize: 15, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.2s ease' }}
                          onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                          onBlur={e => e.target.style.borderColor = 'transparent'}
                        />
                        <p className="text-s" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                          {slowHoursValid ? (parseFloat(slowHours) < 1 ? Math.round(parseFloat(slowHours) * 60) + ' mins' : parseFloat(slowHours) + ' hrs') : ''}
                        </p>
                      </div>
                      {slowHoursValid && (
                        <p className="text-m" style={{ fontSize: 11, marginTop: 6 }}>
                          Arrives around {new Intl.DateTimeFormat(typeof navigator !== 'undefined' ? navigator.language : 'en', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(new Date(Date.now() + parseFloat(slowHours) * 3600000))}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {audioBlob && (
                  <div className="card" style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🎙</span>
                    <div style={{ flex: 1 }}>
                      <p className="text-p" style={{ fontSize: 13, fontWeight: 500 }}>Voice message ready</p>
                      <p className="text-m" style={{ fontSize: 11 }}>{formatDuration(recordingSeconds)}</p>
                    </div>
                    <button onClick={sendAudio} disabled={sending} style={{ padding: '7px 14px', background: '#8a9e8c', color: '#ffffff', border: 'none', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>send</button>
                    <button onClick={() => { setAudioBlob(null); setRecordingSeconds(0) }} style={{ padding: '7px 14px', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, fontSize: 12, cursor: 'pointer' }} className="text-s">discard</button>
                  </div>
                )}

                {recording && (
                  <div style={{ padding: '10px 14px', background: '#fdf0ef', borderRadius: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c0392b', animation: 'breathe 1s ease-in-out infinite', display: 'inline-block' }} />
                    <p style={{ fontSize: 13, color: '#c0392b', flex: 1 }}>Recording... {formatDuration(recordingSeconds)}</p>
                    <button onClick={stopRecording} style={{ padding: '6px 12px', background: '#c0392b', color: '#ffffff', border: 'none', borderRadius: 999, fontSize: 12, cursor: 'pointer' }}>stop</button>
                  </div>
                )}

                {!audioBlob && !recording && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <input ref={fileInputRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) uploadFile(e.target.files[0]); e.target.value = '' }} />
                    <button onClick={() => fileInputRef.current?.click()} title="Attach file (max 2MB)"
                      style={{ width: 40, height: 40, borderRadius: 12, background: 'none', border: '1.5px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, transition: 'all 0.2s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >📎</button>
                    <button onClick={startRecording} title="Record voice message"
                      style={{ width: 40, height: 40, borderRadius: 12, background: 'none', border: '1.5px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, transition: 'all 0.2s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >🎙</button>
                    <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      placeholder={slowSend ? 'Write something to send later...' : 'Say something gently...'}
                      rows={2}
                      className="input-field"
                      style={{ flex: 1, padding: '12px 16px', border: slowSend ? '1.5px solid #d4b89a' : '1.5px solid transparent', borderRadius: 14, fontSize: 15, resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.5, transition: 'border-color 0.2s ease' }}
                      onFocus={e => { if (!slowSend) e.target.style.borderColor = '#8a9e8c' }}
                      onBlur={e => { if (!slowSend) e.target.style.borderColor = 'transparent' }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sending) sendMessage() } }}
                    />
                    <button onClick={sendMessage}
                      disabled={!newMessage.trim() || sending || (slowSend && !slowHoursValid)}
                      style={{ padding: '12px 16px', background: (slowSend && !slowHoursValid) ? '#f0ede8' : slowSend ? '#a09080' : newMessage.trim() ? '#2c2c2e' : '#f0ede8', color: (newMessage.trim() && (!slowSend || slowHoursValid)) ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: 14, fontSize: 20, cursor: (newMessage.trim() && (!slowSend || slowHoursValid)) ? 'pointer' : 'default', transition: 'all 0.2s ease', flexShrink: 0 }}>
                      {slowSend ? '⏱' : '↑'}
                    </button>
                  </div>
                )}
                <p className="text-f" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                  {slowSend && slowHoursValid ? 'Scheduled · recipient sees it after ' + parseFloat(slowHours) + ' hour' + (parseFloat(slowHours) !== 1 ? 's' : '') : slowSend ? 'Enter hours above then write your message' : 'Enter to send · Shift+Enter for new line'}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
