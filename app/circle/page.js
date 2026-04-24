'use client'
import { useState, useEffect } from 'react'
import { initUser, updateUser, connectByCode, hydrateUserFromSupabase, pushToSupabase } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { MOCK_CIRCLE, STATUSES } from '../../lib/constants'
import Navigation from '../../components/Navigation'
import CircleMember from '../../components/CircleMember'
import GuestBanner from '../../components/GuestBanner'

export default function CirclePage() {
  const [user, setUser] = useState(null)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinStatus, setJoinStatus] = useState(null)
  const [showJoin, setShowJoin] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(null)
  const [liveCircle, setLiveCircle] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const u = initUser()
      setUser(u)
      const hydrated = await hydrateUserFromSupabase()
      const finalUser = hydrated || u
      setUser(finalUser)
      await pushToSupabase(finalUser)
      await loadLiveCircle(finalUser)
      subscribeToUpdates(finalUser)
    }
    load()
  }, [])

  const loadLiveCircle = async (u) => {
    setLoading(true)
    const circle = u.circle || []
    if (circle.length === 0) { setLiveCircle([]); setLoading(false); return }
    const codes = circle.map(m => m.inviteCode).filter(Boolean)
    const { data } = await supabase.from('users').select('invite_code, status, display_name, disappear_mode').in('invite_code', codes)
    const updated = circle.map(member => {
      const live = data?.find(d => d.invite_code === member.inviteCode)
      if (!live) return member
      return { ...member, status: live.disappear_mode ? null : (live.status || null), displayName: live.display_name || member.displayName }
    })
    setLiveCircle(updated)
    setLoading(false)
  }

  const subscribeToUpdates = (u) => {
    const channel = supabase
      .channel('circle_page_' + u.inviteCode)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: 'invite_code=eq.' + u.inviteCode,
      }, async (payload) => {
        const remote = payload.new
        const newCircle = remote.circle_data ? JSON.parse(remote.circle_data) : []
        const localUser = { ...u, circle: newCircle }
        updateUser({ circle: newCircle })
        setUser(prev => ({ ...prev, circle: newCircle }))
        await loadLiveCircle(localUser)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
      }, (payload) => {
        const updated = payload.new
        setLiveCircle(prev => prev.map(m => {
          if (m.inviteCode === updated.invite_code) {
            return { ...m, status: updated.disappear_mode ? null : (updated.status || null), displayName: updated.display_name || m.displayName }
          }
          return m
        }))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  const copyInvite = () => {
    if (!user) return
    navigator.clipboard.writeText('stillspace.app/join/' + user.inviteCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !user) return
    const code = joinCode.trim().toUpperCase()
    setLoading(true)
    const result = await connectByCode(user, code)
    setLoading(false)
    if (!result.success) {
      setJoinStatus('error:' + result.error)
      setTimeout(() => setJoinStatus(null), 4000)
      return
    }
    setUser(result.updatedUser)
    setLiveCircle(prev => [...prev, result.member])
    setJoinCode('')
    setJoinStatus('success')
    setShowJoin(false)
    setTimeout(() => setJoinStatus(null), 4000)
  }

  const handleRemove = async (memberId) => {
    const memberToRemove = (user.circle || []).find(m => m.id === memberId)
    const newCircle = (user.circle || []).filter(m => m.id !== memberId)
    const updated = updateUser({ circle: newCircle })
    setUser(updated)
    setLiveCircle(prev => prev.filter(m => m.id !== memberId))
    setRemoveConfirm(null)
    await pushToSupabase(updated)

    if (memberToRemove?.inviteCode) {
      const { data: theirRecord } = await supabase
        .from('users')
        .select('*')
        .eq('invite_code', memberToRemove.inviteCode)
        .single()
      if (theirRecord?.circle_data) {
        const theirCircle = JSON.parse(theirRecord.circle_data)
        const updatedTheirCircle = theirCircle.filter(m => m.inviteCode !== user.inviteCode)
        await supabase.from('users').update({
          circle_data: JSON.stringify(updatedTheirCircle),
          updated_at: new Date().toISOString(),
        }).eq('invite_code', memberToRemove.inviteCode)
      }
    }
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#b0a99a', fontSize: 15 }}>loading...</p>
    </div>
  )

  const isGuest = user.isGuest
  const circle = isGuest ? MOCK_CIRCLE : liveCircle
  const max = 10

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', background: '#faf9f7', minHeight: '100vh', paddingBottom: 100 }}>
      <Navigation />
      <div style={{ padding: '108px 28px 0' }}>
        <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>your people</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em', marginBottom: 6 }}>Your Circle</h1>
        <p style={{ fontSize: 15, color: '#8a8a8e', marginBottom: 24, lineHeight: 1.6 }}>Up to 10 trusted people. No more, no less.</p>

        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f0eb, #f0ede8)', borderRadius: 20, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(138,158,140,0.08)' }} />
          <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>circle capacity</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {[...Array(max)].map((_, i) => {
              const member = circle[i]
              return (
                <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: member ? STATUSES[i % STATUSES.length].color : 'transparent', border: member ? 'none' : '2px dashed #d0cdc8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#ffffff', transition: 'all 0.4s ease', boxShadow: member ? '0 2px 8px rgba(0,0,0,0.12)' : 'none' }}>
                  {member ? (member.initials || '?') : ''}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 15, color: '#4a4a4c' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24 }}>{circle.length}</span>
            <span style={{ color: '#b0a99a' }}> of {max} people connected</span>
          </p>
        </div>

        {joinStatus === 'success' && (
          <div style={{ padding: '14px 18px', background: '#eef5f0', borderRadius: 12, marginBottom: 14, borderLeft: '3px solid #8a9e8c' }}>
            <p style={{ fontSize: 14, color: '#4a5a4c' }}>Connected. Both circles updated automatically.</p>
          </div>
        )}
        {joinStatus === 'error:notfound' && (
          <div style={{ padding: '14px 18px', background: '#fdf0ef', borderRadius: 12, marginBottom: 14, borderLeft: '3px solid #c0392b' }}>
            <p style={{ fontSize: 14, color: '#c0392b' }}>Code not found. Make sure they have created their space first.</p>
          </div>
        )}
        {joinStatus === 'error:own' && (
          <div style={{ padding: '14px 18px', background: '#fdf0ef', borderRadius: 12, marginBottom: 14, borderLeft: '3px solid #c0392b' }}>
            <p style={{ fontSize: 14, color: '#c0392b' }}>That is your own code.</p>
          </div>
        )}
        {joinStatus === 'error:full' && (
          <div style={{ padding: '14px 18px', background: '#fdf0ef', borderRadius: 12, marginBottom: 14, borderLeft: '3px solid #c0392b' }}>
            <p style={{ fontSize: 14, color: '#c0392b' }}>Your circle is full. Maximum 10 people.</p>
          </div>
        )}
        {joinStatus === 'error:duplicate' && (
          <div style={{ padding: '14px 18px', background: '#fdf0ef', borderRadius: 12, marginBottom: 14, borderLeft: '3px solid #c0392b' }}>
            <p style={{ fontSize: 14, color: '#c0392b' }}>This person is already in your circle.</p>
          </div>
        )}

        {!isGuest && (
          <>
            <div style={{ padding: '20px', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>your invite code</p>
              <p style={{ fontSize: 14, color: '#6b6b6e', marginBottom: 14, lineHeight: 1.6 }}>Share this with someone. They enter it and both circles update automatically.</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, padding: '12px 16px', background: '#f8f7f4', borderRadius: 12, fontSize: 20, fontFamily: 'monospace', letterSpacing: '0.2em', color: '#2c2c2e', textAlign: 'center', fontWeight: 500 }}>{user.inviteCode}</div>
                <button onClick={copyInvite} style={{ padding: '12px 20px', background: copied ? '#8a9e8c' : '#2c2c2e', color: '#faf9f7', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                  {copied ? 'copied ✓' : 'copy link'}
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: 24 }}>
              <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>join someone's circle</p>
              <p style={{ fontSize: 14, color: '#6b6b6e', marginBottom: 14, lineHeight: 1.6 }}>Enter their code. You will both be connected instantly.</p>
              {showJoin ? (
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. QJII79" maxLength={6}
                      style={{ flex: 1, padding: '12px 16px', background: '#f8f7f4', border: '1.5px solid transparent', borderRadius: 12, fontSize: 20, fontFamily: 'monospace', letterSpacing: '0.2em', color: '#2c2c2e', textAlign: 'center', outline: 'none', transition: 'border-color 0.2s ease', fontWeight: 500 }}
                      onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                      onBlur={e => e.target.style.borderColor = 'transparent'}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    />
                    <button onClick={handleJoin} disabled={joinCode.length < 4 || loading} style={{ padding: '12px 20px', background: joinCode.length >= 4 && !loading ? '#2c2c2e' : '#f0ede8', color: joinCode.length >= 4 && !loading ? '#faf9f7' : '#b0a99a', border: 'none', borderRadius: 12, fontSize: 14, cursor: joinCode.length >= 4 ? 'pointer' : 'default', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                      {loading ? 'connecting...' : 'connect'}
                    </button>
                  </div>
                  <button onClick={() => { setShowJoin(false); setJoinCode(''); setJoinStatus(null) }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#b0a99a', cursor: 'pointer' }}>cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowJoin(true)} style={{ padding: '10px 20px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, background: 'none', fontSize: 14, color: '#6b6b6e', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >enter a code</button>
              )}
            </div>
          </>
        )}

        {isGuest ? (
          <>
            <p style={{ fontSize: 14, color: '#8a8a8e', marginBottom: 14 }}>A preview of how your circle would look.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {circle.map((m, i) => (
                <div key={m.id} style={{ animationDelay: i * 0.05 + 's' }} className="fade-up">
                  <CircleMember member={m} isPreview={true} />
                </div>
              ))}
            </div>
            <GuestBanner variant="page" />
          </>
        ) : circle.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0ede8', border: '2px dashed #d0cdc8', animation: 'breathe ' + (2.5 + i * 0.4) + 's ease-in-out infinite', animationDelay: i * 0.3 + 's' }} />
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#4a4a4c', marginBottom: 8 }}>Your circle is quiet</p>
            <p style={{ fontSize: 14, color: '#b0a99a', lineHeight: 1.6 }}>Share your invite code or enter someone else's to begin.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {circle.map((m, i) => (
              <div key={m.id} style={{ animationDelay: i * 0.05 + 's' }} className="fade-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: STATUSES[i % STATUSES.length].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: STATUSES[i % STATUSES.length].color, flexShrink: 0 }}>
                    {m.initials || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    {m.displayName && <p style={{ fontSize: 14, color: '#2c2c2e', fontWeight: 500, marginBottom: 2 }}>{m.displayName}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status ? '#8a9e8c' : '#d0cdc8', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#6b6b6e' }}>
                        {m.status ? (STATUSES.find(s => s.id === m.status)?.label || m.status) : 'no status set'}
                      </span>
                    </div>
                    {m.inviteCode && (
                      <p style={{ fontSize: 11, color: '#c0bdb8', marginTop: 3, fontFamily: 'monospace', letterSpacing: '0.06em' }}>code: {m.inviteCode}</p>
                    )}
                  </div>
                  {removeConfirm === m.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleRemove(m.id)} style={{ padding: '6px 12px', background: '#c0392b', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>remove</button>
                      <button onClick={() => setRemoveConfirm(null)} style={{ padding: '6px 12px', background: '#f0ede8', color: '#6b6b6e', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setRemoveConfirm(m.id)} style={{ width: 28, height: 28, border: '1px solid rgba(0,0,0,0.08)', borderRadius: '50%', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c0bdb8', fontSize: 16, flexShrink: 0, transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#c0bdb8' }}
                    >×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
