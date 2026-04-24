'use client'
import { useState, useEffect } from 'react'
import { initUser, setStatus as saveStatus, hydrateUserFromSupabase } from '../../lib/store'
import { STATUSES } from '../../lib/constants'
import Navigation from '../../components/Navigation'

export default function StatusPage() {
  const [user, setUser] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(false)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    const load = async () => {
      const u = initUser()
      setUser(u)
      setSelected(u.currentStatus)
      if (!u.currentStatus) setChanging(true)
      const hydrated = await hydrateUserFromSupabase()
      if (hydrated) {
        setUser(hydrated)
        setSelected(hydrated.currentStatus)
        if (!hydrated.currentStatus) setChanging(true)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!selected) return
    const updated = await saveStatus(selected)
    setUser(updated)
    setSaved(true)
    setChanging(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleChange = () => {
    setChanging(true)
    setSaved(false)
  }

  const handleCancel = () => {
    setChanging(false)
    setSelected(user.currentStatus)
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#a0a0a3', fontSize: 14 }}>loading...</p>
    </div>
  )

  const currentStatus = STATUSES.find(s => s.id === user.currentStatus)

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px', background: '#faf9f7', minHeight: '100vh' }}>
      <Navigation />
      <header style={{ padding: '108px 0 28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em', marginBottom: 8 }}>
          How are you?
        </h1>
        <p style={{ fontSize: 14, color: '#a0a0a3' }}>Take your time. Only your circle will see this.</p>
      </header>

      {user.currentStatus && !changing && (
        <div style={{ marginBottom: 24, padding: '20px', background: currentStatus ? currentStatus.bg : '#f4f3f0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: currentStatus ? currentStatus.color : '#a0a0a3', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, color: '#a0a0a3', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>current status</p>
              <p style={{ fontSize: 15, color: currentStatus ? currentStatus.color : '#6b6b6e' }}>{currentStatus ? currentStatus.label : ''}</p>
            </div>
          </div>
          <button onClick={handleChange} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 999, fontSize: 12, cursor: 'pointer', color: '#6b6b6e', whiteSpace: 'nowrap' }}>
            change
          </button>
        </div>
      )}

      {changing && (
        <div>
          {user.currentStatus && (
            <p style={{ fontSize: 13, color: '#a0a0a3', marginBottom: 16 }}>Choose a new status to replace your current one.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {STATUSES.map(status => (
              <button
                key={status.id}
                onClick={() => setSelected(status.id)}
                style={{ padding: '14px 18px', background: selected === status.id ? status.bg : '#ffffff', border: selected === status.id ? '1.5px solid ' + status.color + '44' : '1px solid rgba(0,0,0,0.06)', borderRadius: 16, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.25s ease', boxShadow: selected === status.id ? 'none' : '0 2px 20px rgba(0,0,0,0.04)', transform: selected === status.id ? 'scale(1.01)' : 'scale(1)' }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: status.color, flexShrink: 0, boxShadow: selected === status.id ? '0 0 0 3px ' + status.color + '22' : 'none', transition: 'box-shadow 0.2s ease' }} />
                <span style={{ fontSize: 15, color: selected === status.id ? status.color : '#6b6b6e' }}>{status.label}</span>
                {user.currentStatus === status.id && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a0a0a3', letterSpacing: '0.04em' }}>current</span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={!selected} style={{ flex: 1, padding: '14px', background: saved ? '#8a9e8c' : selected ? '#2c2c2e' : '#f4f3f0', color: selected ? '#faf9f7' : '#a0a0a3', border: 'none', borderRadius: '999px', fontSize: 15, cursor: selected ? 'pointer' : 'default', transition: 'all 0.3s ease', letterSpacing: '0.03em' }}>
              {saved ? 'status updated' : user.currentStatus ? 'update status' : 'share with circle'}
            </button>
            {user.currentStatus && (
              <button onClick={handleCancel} style={{ padding: '14px 20px', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '999px', fontSize: 14, cursor: 'pointer', color: '#a0a0a3', letterSpacing: '0.03em' }}>
                cancel
              </button>
            )}
          </div>
        </div>
      )}

      {user.statusHistory && user.statusHistory.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <p style={{ fontSize: 12, color: '#a0a0a3', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>your history · private</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {user.statusHistory.slice(0, 10).map((entry, i) => {
              const s = STATUSES.find(st => st.id === entry.status)
              return (
                <div key={i} style={{ padding: '10px 14px', background: '#ffffff', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: s ? s.color : '#a0a0a3', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#6b6b6e' }}>{s ? s.label : entry.status}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#a0a0a3' }}>
                    {new Date(entry.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
