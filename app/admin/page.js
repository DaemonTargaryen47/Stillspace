'use client'
import { useState, useEffect } from 'react'
import { storage } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import Navigation from '../../components/Navigation'
import Link from 'next/link'

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)

  useEffect(() => {
    const check = async () => {
      const local = storage.get('user')
      if (!local || local.isGuest) { setLoading(false); return }
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', local.id)
        .single()
      if (data?.is_admin) {
        setUser(local)
        setAuthorized(true)
        await loadData()
      }
      setLoading(false)
    }
    check()
  }, [])

  const loadData = async () => {
    const { data: allUsers } = await supabase
      .from('users')
      .select('*')
      .order('updated_at', { ascending: false })
    setUsers(allUsers || [])
    const total = allUsers?.length || 0
    const active = allUsers?.filter(u => u.status || u.custom_status_text).length || 0
    const withCircle = allUsers?.filter(u => u.circle_data && u.circle_data !== '[]').length || 0
    const admins = allUsers?.filter(u => u.is_admin).length || 0
    setStats({ total, active, withCircle, admins })
  }

  const handleDeleteUser = async (userId, inviteCode) => {
    if (!confirm('Delete this user permanently?')) return
    await supabase.from('messages').delete().or('chat_id.like.' + inviteCode + '_%,chat_id.like.%_' + inviteCode)
    await supabase.from('connections').delete().or('from_code.eq.' + inviteCode + ',to_code.eq.' + inviteCode)
    await supabase.from('reactions').delete().or('from_code.eq.' + inviteCode + ',to_code.eq.' + inviteCode)
    await supabase.from('users').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    setSelectedUser(null)
    setActionMsg('User deleted.')
    setTimeout(() => setActionMsg(null), 3000)
  }

  const handleToggleAdmin = async (userId, currentAdmin) => {
    await supabase.from('users').update({ is_admin: !currentAdmin }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentAdmin } : u))
    if (selectedUser?.id === userId) setSelectedUser(prev => ({ ...prev, is_admin: !currentAdmin }))
    setActionMsg(currentAdmin ? 'Admin removed.' : 'Admin granted.')
    setTimeout(() => setActionMsg(null), 3000)
  }

  const handleClearStatus = async (userId) => {
    await supabase.from('users').update({ status: null, custom_status_text: null }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: null, custom_status_text: null } : u))
    if (selectedUser?.id === userId) setSelectedUser(prev => ({ ...prev, status: null, custom_status_text: null }))
    setActionMsg('Status cleared.')
    setTimeout(() => setActionMsg(null), 3000)
  }

  const handleClearMessages = async () => {
    if (!confirm('Delete ALL messages from all users?')) return
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setActionMsg('All messages cleared.')
    setTimeout(() => setActionMsg(null), 3000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#b0a99a' }}>checking access...</p>
    </div>
  )

  if (!authorized) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12 }}>
      <p style={{ fontSize: 24, color: '#2c2c2e', fontFamily: 'var(--font-serif)' }}>Access denied</p>
      <p style={{ fontSize: 14, color: '#b0a99a' }}>This area is restricted.</p>
      <Link href="/home" style={{ padding: '10px 24px', background: '#2c2c2e', color: '#faf9f7', borderRadius: 999, textDecoration: 'none', fontSize: 14 }}>go home</Link>
    </div>
  )

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.invite_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', background: '#faf9f7', minHeight: '100vh', paddingBottom: 60 }}>
      <Navigation />

      <div style={{ padding: '108px 28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: '#b0a99a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>admin</p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, color: '#2c2c2e', letterSpacing: '-0.02em' }}>Dashboard</h1>
          </div>
          <button onClick={loadData} style={{ padding: '8px 16px', background: '#f0ede8', border: 'none', borderRadius: 999, fontSize: 13, color: '#6b6b6e', cursor: 'pointer' }}>
            refresh
          </button>
        </div>

        {actionMsg && (
          <div style={{ padding: '12px 16px', background: '#eef5f0', borderRadius: 12, marginBottom: 20, borderLeft: '3px solid #8a9e8c' }}>
            <p style={{ fontSize: 14, color: '#4a5a4c' }}>{actionMsg}</p>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Users', value: stats.total },
            { label: 'Active Status', value: stats.active },
            { label: 'Have Circle', value: stats.withCircle },
            { label: 'Admins', value: stats.admins },
          ].map((s, i) => (
            <div key={i} style={{ padding: '18px 16px', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: '#2c2c2e', marginBottom: 4 }}>{s.value || 0}</p>
              <p style={{ fontSize: 12, color: '#b0a99a', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['overview', 'users', 'danger'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 18px', background: activeTab === tab ? '#2c2c2e' : '#f0ede8', color: activeTab === tab ? '#faf9f7' : '#6b6b6e', border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '20px', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 13, color: '#b0a99a', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>recent users</p>
              {users.slice(0, 5).map((u, i) => (
                <div key={i} onClick={() => { setSelectedUser(u); setActiveTab('users') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.05)' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#8a8a8e', flexShrink: 0 }}>
                    {(u.display_name || u.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: '#2c2c2e', marginBottom: 1 }}>{u.display_name || u.email || 'anonymous'}</p>
                    <p style={{ fontSize: 11, color: '#b0a99a', fontFamily: 'monospace' }}>{u.invite_code}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {u.status && <span style={{ fontSize: 11, padding: '3px 8px', background: '#f0f5f0', borderRadius: 999, color: '#8a9e8c' }}>{u.status}</span>}
                    {u.custom_status_text && <span style={{ fontSize: 11, padding: '3px 8px', background: '#f5f0eb', borderRadius: 999, color: '#a09080' }}>custom</span>}
                    {u.is_admin && <span style={{ fontSize: 11, padding: '3px 8px', background: '#f0eef5', borderRadius: 999, color: '#9a8aaa', marginLeft: 4 }}>admin</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or code..."
              style={{ width: '100%', padding: '12px 16px', background: '#ffffff', border: '1.5px solid transparent', borderRadius: 12, fontSize: 14, color: '#2c2c2e', outline: 'none', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', transition: 'border-color 0.2s ease' }}
              onFocus={e => e.target.style.borderColor = '#8a9e8c'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />

            {selectedUser ? (
              <div style={{ padding: '22px', background: '#ffffff', borderRadius: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 18, color: '#2c2c2e', fontWeight: 500, marginBottom: 2 }}>{selectedUser.display_name || 'No name'}</p>
                    <p style={{ fontSize: 13, color: '#b0a99a' }}>{selectedUser.email || 'no email'}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#b0a99a', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[
                    ['Invite Code', selectedUser.invite_code],
                    ['Status', selectedUser.custom_status_text || selectedUser.status || 'none'],
                    ['Disappear Mode', selectedUser.disappear_mode ? 'on' : 'off'],
                    ['Circle Size', selectedUser.circle_data ? JSON.parse(selectedUser.circle_data).length + ' people' : '0 people'],
                    ['Admin', selectedUser.is_admin ? 'yes' : 'no'],
                    ['Last Updated', new Date(selectedUser.updated_at).toLocaleString()],
                  ].map(([label, value], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <span style={{ fontSize: 13, color: '#b0a99a' }}>{label}</span>
                      <span style={{ fontSize: 13, color: '#2c2c2e', fontFamily: label === 'Invite Code' ? 'monospace' : 'inherit', letterSpacing: label === 'Invite Code' ? '0.1em' : 'normal' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => handleClearStatus(selectedUser.id)} style={{ padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 999, fontSize: 13, color: '#a09080', cursor: 'pointer' }}>
                    clear status
                  </button>
                  <button onClick={() => handleToggleAdmin(selectedUser.id, selectedUser.is_admin)} style={{ padding: '8px 16px', background: '#f0eef5', border: 'none', borderRadius: 999, fontSize: 13, color: '#9a8aaa', cursor: 'pointer' }}>
                    {selectedUser.is_admin ? 'remove admin' : 'make admin'}
                  </button>
                  {selectedUser.id !== user.id && (
                    <button onClick={() => handleDeleteUser(selectedUser.id, selectedUser.invite_code)} style={{ padding: '8px 16px', background: '#fdf0ef', border: 'none', borderRadius: 999, fontSize: 13, color: '#c0392b', cursor: 'pointer' }}>
                      delete user
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredUsers.map((u, i) => (
                  <div key={i} onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#ffffff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: u.is_admin ? '#f0eef5' : '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: u.is_admin ? '#9a8aaa' : '#8a8a8e', flexShrink: 0 }}>
                      {(u.display_name || u.email || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: '#2c2c2e', marginBottom: 2, fontWeight: 500 }}>{u.display_name || u.email || 'anonymous'}</p>
                      <p style={{ fontSize: 11, color: '#b0a99a', fontFamily: 'monospace', letterSpacing: '0.06em' }}>{u.invite_code}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {u.is_admin && <span style={{ fontSize: 10, padding: '2px 8px', background: '#f0eef5', borderRadius: 999, color: '#9a8aaa' }}>admin</span>}
                      {(u.status || u.custom_status_text) && <span style={{ fontSize: 10, padding: '2px 8px', background: '#f0f5f0', borderRadius: 999, color: '#8a9e8c' }}>active</span>}
                      {u.circle_data && u.circle_data !== '[]' && <span style={{ fontSize: 10, padding: '2px 8px', background: '#eef0f5', borderRadius: 999, color: '#8a9aaa' }}>has circle</span>}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#b0a99a', fontSize: 14, padding: '32px 0' }}>no users found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Danger tab */}
        {activeTab === 'danger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '20px', background: '#ffffff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 13, color: '#b0a99a', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>danger zone</p>
              <p style={{ fontSize: 13, color: '#8a8a8e', marginBottom: 18, lineHeight: 1.6 }}>These actions are irreversible. Proceed with caution.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fdf0ef', borderRadius: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#2c2c2e', marginBottom: 2 }}>Clear all messages</p>
                    <p style={{ fontSize: 12, color: '#b0a99a' }}>Deletes every message from every chat</p>
                  </div>
                  <button onClick={handleClearMessages} style={{ padding: '8px 16px', background: '#c0392b', color: '#ffffff', border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer' }}>
                    clear
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fdf0ef', borderRadius: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#2c2c2e', marginBottom: 2 }}>Clear all connections</p>
                    <p style={{ fontSize: 12, color: '#b0a99a' }}>Removes everyone from everyone's circle</p>
                  </div>
                  <button onClick={async () => {
                    if (!confirm('Remove ALL connections for ALL users?')) return
                    await supabase.from('connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                    await supabase.from('users').update({ circle_data: '[]' }).neq('id', '00000000-0000-0000-0000-000000000000')
                    setActionMsg('All connections cleared.')
                    setTimeout(() => setActionMsg(null), 3000)
                    await loadData()
                  }} style={{ padding: '8px 16px', background: '#c0392b', color: '#ffffff', border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer' }}>
                    clear
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fdf0ef', borderRadius: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#2c2c2e', marginBottom: 2 }}>Clear all statuses</p>
                    <p style={{ fontSize: 12, color: '#b0a99a' }}>Resets every user's status to none</p>
                  </div>
                  <button onClick={async () => {
                    if (!confirm('Clear ALL statuses for ALL users?')) return
                    await supabase.from('users').update({ status: null, custom_status_text: null }).neq('id', '00000000-0000-0000-0000-000000000000')
                    setActionMsg('All statuses cleared.')
                    setTimeout(() => setActionMsg(null), 3000)
                    await loadData()
                  }} style={{ padding: '8px 16px', background: '#c0392b', color: '#ffffff', border: 'none', borderRadius: 999, fontSize: 13, cursor: 'pointer' }}>
                    clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
