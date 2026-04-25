'use client'
import { useState, useEffect } from 'react'
import { initUser, updateUser, signOut, restoreFromSupabaseByEmail, storage, hydrateUserFromSupabase, pushToSupabase } from '../../lib/store'
import Navigation from '../../components/Navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useDarkMode } from '../../lib/darkMode'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [signingUp, setSigningUp] = useState(false)
  const [error, setError] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameSaved, setUsernameSaved] = useState(false)
  const { dark, toggle: toggleDark } = useDarkMode()

  useEffect(() => {
    const load = async () => {
      const u = initUser()
      setUser(u)
      setUsername(u.displayName || '')
      const hydrated = await hydrateUserFromSupabase()
      if (hydrated) {
        setUser(hydrated)
        setUsername(hydrated.displayName || '')
      }
    }
    load()
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [])

  const handleGoogleSignIn = () => {
    setError(null)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) { setError('Google Client ID not configured.'); return }
    if (!window.google) { setError('Google script not loaded yet. Please wait and try again.'); return }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const base64 = response.credential.split('.')[1]
          const decoded = JSON.parse(atob(base64))
          const restored = await restoreFromSupabaseByEmail(decoded.email)
          if (restored) {
            const withGoogle = { ...restored, googleLinked: true, avatar: decoded.picture }
            storage.set('user', withGoogle)
            setUser(withGoogle)
            setUsername(withGoogle.displayName || '')
          } else {
            const updated = updateUser({ isGuest: false, googleLinked: true, email: decoded.email, displayName: decoded.name, avatar: decoded.picture })
            setUser(updated)
            setUsername(updated.displayName || '')
            await pushToSupabase(updated)
          }
          setShowOptions(false)
        } catch { setError('Something went wrong. Please try again.') }
      },
    })
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed()) {
        window.google.accounts.id.renderButton(document.getElementById('google-btn-container'), { theme: 'outline', size: 'large', width: 320 })
      }
    })
  }

  const handleAnonymous = async () => {
    setSigningUp(true)
    const updated = updateUser({ isGuest: false })
    setUser(updated)
    await pushToSupabase(updated)
    setSigningUp(false)
    setShowOptions(false)
  }

  const handleLogout = async () => {
    await signOut()
    const fresh = initUser()
    setUser(fresh)
    setUsername('')
    setShowLogoutConfirm(false)
    setShowOptions(false)
  }

  const handleSaveUsername = async () => {
    if (!username.trim()) return
    const updated = updateUser({ displayName: username.trim() })
    setUser(updated)
    await pushToSupabase(updated)
    setEditingProfile(false)
    setUsernameSaved(true)
    setTimeout(() => setUsernameSaved(false), 2500)
  }

  const update = async (key, val) => {
    const updated = updateUser({ [key]: val })
    setUser(updated)
    await pushToSupabase(updated)
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <p style={{ color: '#a0a0a3', fontSize: 14 }}>loading...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px', background: 'var(--bg-primary)', minHeight: '100vh', transition: 'background 0.3s ease' }}>
      <Navigation />
      <header style={{ padding: '108px 0 28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Settings</h1>
      </header>

      {/* Account */}
      <section style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Account</p>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow)' }}>
          {user.isGuest ? (
            showOptions ? (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>Choose how to create your space:</p>
                <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '13px 20px', background: 'var(--bg-card)', border: '1.5px solid var(--border-soft)', borderRadius: 12, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, color: 'var(--text-primary)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                <div id="google-btn-container" style={{ marginBottom: 10 }} />
                {error && <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10, padding: '8px 12px', background: '#fdf0ef', borderRadius: 8 }}>{error}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: '#a0a0a3' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <button onClick={handleAnonymous} disabled={signingUp} style={{ width: '100%', padding: '13px 20px', background: 'var(--text-primary)', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer', color: 'var(--bg-primary)', opacity: signingUp ? 0.6 : 1 }}>
                  {signingUp ? 'creating your space...' : 'Continue anonymously'}
                </button>
                <button onClick={() => { setShowOptions(false); setError(null) }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#a0a0a3', cursor: 'pointer', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>cancel</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>You are in guest mode. Create your space to connect with people you trust.</p>
                <button onClick={() => setShowOptions(true)} style={{ padding: '12px 24px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}>create your space</button>
                <p style={{ fontSize: 11, color: '#a0a0a3', marginTop: 10 }}>No pressure. Come back when you are ready.</p>
              </>
            )
          ) : (
            <div>
              {user.avatar && <img src={user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', marginBottom: 12, display: 'block' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8a9e8c', flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 }}>{user.displayName || 'Your space is active'}</span>
              </div>
              {user.email && <p style={{ fontSize: 13, color: '#a0a0a3', marginLeft: 18, marginBottom: 4 }}>{user.email}</p>}
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 18, marginBottom: 16, fontFamily: 'monospace', letterSpacing: '0.08em' }}>code: {user.inviteCode}</p>
              {showLogoutConfirm ? (
                <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Your data will be saved. Sign back in with Google to restore everything.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleLogout} style={{ flex: 1, padding: '10px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>yes, sign out</button>
                    <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '10px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowLogoutConfirm(true)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border-soft)', borderRadius: 999, fontSize: 13, color: '#a0a0a3', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.color = '#a0a0a3' }}
                >sign out</button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Profile */}
      {!user.isGuest && (
        <section style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Profile</p>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow)' }}>
            {editingProfile ? (
              <div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Set your display name visible to your circle:</p>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name..." maxLength={30}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1.5px solid transparent', borderRadius: 12, fontSize: 15, color: 'var(--text-primary)', outline: 'none', marginBottom: 10, transition: 'border-color 0.2s ease' }}
                  onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSaveUsername} style={{ flex: 1, padding: '10px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>save</button>
                  <button onClick={() => setEditingProfile(false)} style={{ flex: 1, padding: '10px', background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#b0a99a', marginBottom: 4 }}>display name</p>
                  <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>{user.displayName || 'not set'}</p>
                  {usernameSaved && <p style={{ fontSize: 12, color: '#8a9e8c', marginTop: 4 }}>saved</p>}
                </div>
                <button onClick={() => setEditingProfile(true)} style={{ padding: '8px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>edit</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Appearance */}
      <section style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Appearance</p>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '6px 18px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0' }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>Dark Mode</p>
              <p style={{ fontSize: 12, color: '#a0a0a3', lineHeight: 1.5 }}>Easier on the eyes at night.</p>
            </div>
            <button onClick={toggleDark} style={{ width: 44, height: 24, borderRadius: 999, background: dark ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: dark ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Presence */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Presence</p>
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '6px 18px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0' }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>Disappear Mode</p>
              <p style={{ fontSize: 12, color: '#a0a0a3', lineHeight: 1.5 }}>Go invisible. No status updates shared. Nothing disturbed.</p>
            </div>
            <button onClick={() => update('disappearMode', !user.disappearMode)} style={{ width: 44, height: 24, borderRadius: 999, background: user.disappearMode ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: user.disappearMode ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ padding: 20, background: 'var(--bg-muted)', borderRadius: 16, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            You can come and go freely. No need to respond. This space is yours.
          </p>
        </div>
      </section>

      {/* Feedback */}
      <FeedbackSection user={user} />

      {/* Admin link */}
      {!user.isGuest && user.email === 'sir.ushno@gmail.com' && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link href="/admin" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)', paddingBottom: 2 }}>
            admin dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

function FeedbackSection({ user }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id || null,
      invite_code: user?.inviteCode || null,
      display_name: user?.displayName || user?.email || 'anonymous',
      message: message.trim(),
      created_at: new Date().toISOString(),
    })
    if (error) { console.error('feedback error:', error); setSending(false); return }
    setSending(false)
    setSent(true)
    setMessage('')
    setTimeout(() => { setSent(false); setOpen(false) }, 3000)
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow)' }}>
        {!open ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>Share feedback</p>
              <p style={{ fontSize: 12, color: '#a0a0a3', lineHeight: 1.5 }}>Thoughts, suggestions, or anything at all.</p>
            </div>
            <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 999, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              open
            </button>
          </div>
        ) : sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: '#8a9e8c', marginBottom: 4 }}>Thank you.</p>
            <p style={{ fontSize: 13, color: '#b0a99a' }}>Your feedback has been received.</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>What's on your mind? Be as honest as you like.</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="I think Stillspace could..."
              rows={4}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1.5px solid transparent', borderRadius: 12, fontSize: 14, color: 'var(--text-primary)', resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, transition: 'border-color 0.2s ease', marginBottom: 10 }}
              onFocus={e => e.target.style.borderColor = '#8a9e8c'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSend} disabled={!message.trim() || sending}
                style={{ flex: 1, padding: '10px', background: message.trim() && !sending ? 'var(--text-primary)' : 'var(--bg-muted)', color: message.trim() && !sending ? 'var(--bg-primary)' : '#b0a99a', border: 'none', borderRadius: 10, fontSize: 13, cursor: message.trim() ? 'pointer' : 'default', transition: 'all 0.2s ease' }}>
                {sending ? 'sending...' : 'send feedback'}
              </button>
              <button onClick={() => { setOpen(false); setMessage('') }} style={{ padding: '10px 16px', background: 'none', border: '1px solid var(--border-soft)', borderRadius: 10, fontSize: 13, color: '#a0a0a3', cursor: 'pointer' }}>
                cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
