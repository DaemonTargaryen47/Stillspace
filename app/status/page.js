'use client'
import { useState, useEffect } from 'react'
import { initUser, setStatus as saveStatus, hydrateUserFromSupabase, updateUser, pushToSupabase } from '../../lib/store'
import { STATUSES } from '../../lib/constants'
import Navigation from '../../components/Navigation'

export default function StatusPage() {
  const [user, setUser] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(false)
  const [changing, setChanging] = useState(false)
  const [customText, setCustomText] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [customSaved, setCustomSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const u = initUser()
      setUser(u)
      setSelected(u.currentStatus)
      setCustomText(u.customStatusText || '')
      if (!u.currentStatus && !u.customStatusText) setChanging(true)
      const hydrated = await hydrateUserFromSupabase()
      if (hydrated) {
        setUser(hydrated)
        setSelected(hydrated.currentStatus)
        setCustomText(hydrated.customStatusText || '')
        if (!hydrated.currentStatus && !hydrated.customStatusText) setChanging(true)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!selected) return
    const updated = await saveStatus(selected)
    const final = updateUser({ customStatusText: '' })
    setUser({ ...updated, customStatusText: '' })
    setCustomText('')
    setSaved(true)
    setChanging(false)
    setUseCustom(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleSaveCustom = async () => {
    if (!customText.trim()) return
    const updated = updateUser({ customStatusText: customText.trim(), currentStatus: null })
    await pushToSupabase({ ...updated, customStatusText: customText.trim(), currentStatus: null })
    setUser(updated)
    setSelected(null)
    setCustomSaved(true)
    setChanging(false)
    setUseCustom(false)
    setTimeout(() => setCustomSaved(false), 2500)
  }

  const handleChange = () => { setChanging(true); setSaved(false); setCustomSaved(false) }
  const handleCancel = () => { setChanging(false); setUseCustom(false); setSelected(user.currentStatus); setCustomText(user.customStatusText || '') }

  if (!user) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p className="text-m" style={{ fontSize: 14 }}>loading...</p>
    </div>
  )

  const currentStatus = STATUSES.find(s => s.id === user.currentStatus)
  const hasCustom = user.customStatusText && user.customStatusText.trim()

  return (
    <div className="page-wrap" style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px', minHeight: '100vh' }}>
      <Navigation />
      <header style={{ padding: '108px 0 28px' }}>
        <h1 className="text-p" style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>How are you?</h1>
        <p className="text-m" style={{ fontSize: 14 }}>Take your time. Only your circle will see this.</p>
      </header>

      {(user.currentStatus || hasCustom) && !changing && (
        <div style={{ marginBottom: 24, padding: '20px', background: hasCustom ? '#f5f0eb' : (currentStatus ? currentStatus.bg : '#f4f3f0'), borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: hasCustom ? '#a09080' : (currentStatus ? currentStatus.color : '#a0a0a3') }} />
            <div>
              <p className="section-label" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>current status</p>
              <p style={{ fontSize: 15, color: hasCustom ? '#a09080' : (currentStatus ? currentStatus.color : '#6b6b6e'), lineHeight: 1.4 }}>
                {hasCustom ? user.customStatusText : (currentStatus ? currentStatus.label : '')}
              </p>
              {hasCustom && <p className="text-m" style={{ fontSize: 11, marginTop: 2 }}>custom status</p>}
            </div>
          </div>
          <button onClick={handleChange} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 999, fontSize: 12, cursor: 'pointer', color: '#6b6b6e', whiteSpace: 'nowrap' }}>change</button>
        </div>
      )}

      {changing && (
        <div>
          {(user.currentStatus || hasCustom) && <p className="text-m" style={{ fontSize: 13, marginBottom: 16 }}>Choose a new status to replace your current one.</p>}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button onClick={() => setUseCustom(false)} style={{ flex: 1, padding: '10px', background: !useCustom ? '#2c2c2e' : '#f4f3f0', color: !useCustom ? '#faf9f7' : '#6b6b6e', border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' }}>preset statuses</button>
            <button onClick={() => setUseCustom(true)} style={{ flex: 1, padding: '10px', background: useCustom ? '#2c2c2e' : '#f4f3f0', color: useCustom ? '#faf9f7' : '#6b6b6e', border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' }}>write your own</button>
          </div>

          {!useCustom ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {STATUSES.map(status => (
                  <button key={status.id} onClick={() => setSelected(status.id)}
                    className="card"
                    style={{ padding: '14px 18px', background: selected === status.id ? status.bg : undefined, border: selected === status.id ? '1.5px solid ' + status.color + '44' : '1px solid rgba(0,0,0,0.06)', borderRadius: 16, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.25s ease', transform: selected === status.id ? 'scale(1.01)' : 'scale(1)' }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: status.color, flexShrink: 0, boxShadow: selected === status.id ? '0 0 0 3px ' + status.color + '22' : 'none' }} />
                    <span style={{ fontSize: 15, color: selected === status.id ? status.color : undefined }} className={selected === status.id ? '' : 'text-s'}>{status.label}</span>
                    {user.currentStatus === status.id && !hasCustom && <span className="text-m" style={{ marginLeft: 'auto', fontSize: 11 }}>current</span>}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSave} disabled={!selected} style={{ flex: 1, padding: '14px', background: saved ? '#8a9e8c' : selected ? '#2c2c2e' : '#f4f3f0', color: selected ? '#faf9f7' : '#a0a0a3', border: 'none', borderRadius: 999, fontSize: 15, cursor: selected ? 'pointer' : 'default', transition: 'all 0.3s ease' }}>
                  {saved ? 'status updated' : (user.currentStatus || hasCustom) ? 'update status' : 'share with circle'}
                </button>
                {(user.currentStatus || hasCustom) && (
                  <button onClick={handleCancel} className="text-m" style={{ padding: '14px 20px', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}>cancel</button>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-s" style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.6 }}>Write how you feel in your own words. Max 50 characters.</p>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <textarea value={customText} onChange={e => { if (e.target.value.length <= 50) setCustomText(e.target.value) }} placeholder="I feel like a quiet evening..." rows={3}
                  className="input-field"
                  style={{ width: '100%', padding: '14px 18px', border: '1.5px solid transparent', borderRadius: 16, fontSize: 15, resize: 'none', outline: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.6, transition: 'border-color 0.2s ease' }}
                  onFocus={e => e.target.style.borderColor = '#8a9e8c'}
                  onBlur={e => e.target.style.borderColor = 'transparent'}
                />
                <p style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: customText.length > 40 ? '#c0392b' : '#c0bdb8' }}>{customText.length}/50</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSaveCustom} disabled={!customText.trim()} style={{ flex: 1, padding: '14px', background: customSaved ? '#8a9e8c' : customText.trim() ? '#2c2c2e' : '#f4f3f0', color: customText.trim() ? '#faf9f7' : '#a0a0a3', border: 'none', borderRadius: 999, fontSize: 15, cursor: customText.trim() ? 'pointer' : 'default', transition: 'all 0.3s ease' }}>
                  {customSaved ? 'status shared' : 'share with circle'}
                </button>
                {(user.currentStatus || hasCustom) && (
                  <button onClick={handleCancel} className="text-m" style={{ padding: '14px 20px', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}>cancel</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {user.statusHistory && user.statusHistory.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <p className="section-label" style={{ fontSize: 12, marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>your history · private</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {user.statusHistory.slice(0, 10).map((entry, i) => {
              const s = STATUSES.find(st => st.id === entry.status)
              return (
                <div key={i} className="card" style={{ padding: '10px 14px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s ? s.color : '#a0a0a3', flexShrink: 0 }} />
                    <span className="text-s" style={{ fontSize: 13 }}>{s ? s.label : entry.status}</span>
                  </div>
                  <span className="text-m" style={{ fontSize: 11 }}>{new Date(entry.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
