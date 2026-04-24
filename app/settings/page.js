'use client'
import { useState, useEffect } from 'react'
import { initUser, updateUser, signOut, restoreFromSupabaseByEmail, syncUserToSupabase, storage } from '../../lib/store'
import Navigation from '../../components/Navigation'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [signingUp, setSigningUp] = useState(false)
  const [error, setError] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameSaved, setUsernameSaved] = useState(false)

  useEffect(() => {
    const u = initUser()
    setUser(u)
    setUsername(u.displayName || '')
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
            syncUserToSupabase(updated)
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

  const handleAnonymous = () => {
    setSigningUp(true)
    setTimeout(() => {
      const updated = updateUser({ isGuest: false })
      setUser(updated)
      syncUserToSupabase(updated)
      setSigningUp(false)
      setShowOptions(false)
    }, 1000)
  }

  const handleLogout = async () => {
    await signOut()
    const fresh = initUser()
    setUser(fresh)
    setUsername('')
    setShowLogoutConfirm(false)
    setShowOptions(false)
  }

  const handleSaveUsername = () => {
    if (!username.trim()) return
    const updated = updateUser({ displayName: username.trim() })
    setUser(updated)
    syncUserToSupabase(updated)
    setEditingProfile(false)
    setUsernameSaved(true)
    setTimeout(() => setUsernameSaved(false), 2500)
  }

  const update = (key, val) => {
    const updated = updateUser({ [key]: val })
    setUser(updated)
    syncUserToSupabase(updated)
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#a0a0a3', fontSize: 14 }}>loading...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px', background: '#faf9f7', minHeight: '100vh' }}>
      <Navigation />
      <header style={{ padding: '108px 0 28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em' }}>Settings</h1>
      </header>

      {/* Account */}
      <section style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Account</p>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 18, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          {user.isGuest ? (
            showOptions ? (
              <div>
                <p style={{ fontSize: 14, color: '#6b6b6e', marginBottom: 18, lineHeight: 1.6 }}>Choose how to create your space:</p>
                <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '13px 20px', background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 12, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, color: '#2c2c2e' }}>
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
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                  <span style={{ fontSize: 12, color: '#a0a0a3' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                </div>
                <button onClick={handleAnonymous} disabled={signingUp} style={{ width: '100%', padding: '13px 20px', background: '#2c2c2e', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer', color: '#faf9f7', opacity: signingUp ? 0.6 : 1 }}>
                  {signingUp ? 'creating your space...' : 'Continue anonymously'}
                </button>
                <button onClick={() => { setShowOptions(false); setError(null) }} style={{ background: 'none', border: 'none', fontSize: 12, color: '#a0a0a3', cursor: 'pointer', marginTop: 10, display: 'block', width: '100%', textAlign: 'center' }}>cancel</button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#6b6b6e', marginBottom: 14, lineHeight: 1.6 }}>You are in guest mode. Create your space to connect with people you trust.</p>
                <button onClick={() => setShowOptions(true)} style={{ padding: '12px 24px', background: '#2c2c2e', color: '#faf9f7', border: 'none', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}>create your space</button>
                <p style={{ fontSize: 11, color: '#a0a0a3', marginTop: 10 }}>No pressure. Come back when you are ready.</p>
              </>
            )
          ) : (
            <div>
              {user.avatar && <img src={user.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', marginBottom: 12, display: 'block' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8a9e8c', flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: '#2c2c2e', fontWeight: 500 }}>{user.displayName || 'Your space is active'}</span>
              </div>
              {user.email && <p style={{ fontSize: 13, color: '#a0a0a3', marginLeft: 18, marginBottom: 4 }}>{user.email}</p>}
              <p style={{ fontSize: 12, color: '#c0bdb8', marginLeft: 18, marginBottom: 16, fontFamily: 'monospace', letterSpacing: '0.08em' }}>code: {user.inviteCode}</p>

              {showLogoutConfirm ? (
                <div style={{ padding: '14px', background: '#faf9f7', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, color: '#6b6b6e', marginBottom: 14, lineHeight: 1.6 }}>Your data will be saved. Sign back in with Google to restore everything.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleLogout} style={{ flex: 1, padding: '10px', background: '#2c2c2e', color: '#faf9f7', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>yes, sign out</button>
                    <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: '10px', background: 'none', color: '#6b6b6e', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowLogoutConfirm(true)} style={{ padding: '8px 16px', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, fontSize: 13, color: '#a0a0a3', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#a0a0a3' }}
                >sign out</button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Profile editing */}
      {!user.isGuest && (
        <section style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Profile</p>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: 18, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
            {editingProfile ? (
              <div>
                <p style={{ fontSize: 14, color: '#6b6b6e', marginBottom: 12 }}>Set your display name visible to your circle:</p>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Your name..."
                  maxLength={30}
                  style={{ width: '100%', padding: '12px 16px', background: '#f8f7f4', border: '1.5px solid transparent', borderRadius: 12, fontSize: 15, color: '#2c2c2e', outline: 'none', marginBottom: 10, transition: 'border-color 0.2s ease' }}
                  onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSaveUsername} style={{ flex: 1, padding: '10px', background: '#2c2c2e', color: '#faf9f7', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>save</button>
                  <button onClick={() => setEditingProfile(false)} style={{ flex: 1, padding: '10px', background: 'none', color: '#6b6b6e', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#b0a99a', marginBottom: 4 }}>display name</p>
                  <p style={{ fontSize: 15, color: '#2c2c2e' }}>{user.displayName || 'not set'}</p>
                  {usernameSaved && <p style={{ fontSize: 12, color: '#8a9e8c', marginTop: 4 }}>saved</p>}
                </div>
                <button onClick={() => setEditingProfile(true)} style={{ padding: '8px 16px', background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 999, fontSize: 13, color: '#6b6b6e', cursor: 'pointer' }}>edit</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Presence */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Presence</p>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '6px 18px', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0' }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <p style={{ fontSize: 14, color: '#2c2c2e', marginBottom: 2 }}>Disappear Mode</p>
              <p style={{ fontSize: 12, color: '#a0a0a3', lineHeight: 1.5 }}>Go invisible. No status updates shared. Nothing disturbed.</p>
            </div>
            <button onClick={() => update('disappearMode', !user.disappearMode)} style={{ width: 44, height: 24, borderRadius: 999, background: user.disappearMode ? '#8a9e8c' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: user.disappearMode ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
        </div>
      </section>

      <section>
        <div style={{ padding: 20, background: '#f4f3f0', borderRadius: 16, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: '#6b6b6e', lineHeight: 1.7 }}>
            You can come and go freely. No need to respond. This space is yours.
          </p>
        </div>
      </section>
    </div>
  )
}
