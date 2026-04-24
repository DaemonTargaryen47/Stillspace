'use client'

import { supabase } from './supabase'

const PREFIX = 'stillspace_'

export const storage = {
  get: (key) => {
    if (typeof window === 'undefined') return null
    try {
      const v = localStorage.getItem(PREFIX + key)
      return v ? JSON.parse(v) : null
    } catch { return null }
  },
  set: (key, value) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch {}
  },
  remove: (key) => {
    if (typeof window === 'undefined') return
    try { localStorage.removeItem(PREFIX + key) } catch {}
  },
}

export const initUser = () => {
  let user = storage.get('user')
  if (!user) {
    user = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
      isGuest: true,
      createdAt: Date.now(),
      disappearMode: false,
      currentStatus: null,
      statusHistory: [],
      circle: [],
      chatToggles: {},
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      echoHistory: [],
    }
    storage.set('user', user)
  }
  return user
}

export const updateUser = (updates) => {
  const user = storage.get('user') || initUser()
  const updated = { ...user, ...updates }
  storage.set('user', updated)
  return updated
}

export const pushToSupabase = async (user) => {
  if (!user || user.isGuest) return
  await supabase.from('users').upsert({
    id: user.id,
    invite_code: user.inviteCode,
    status: user.currentStatus || null,
    display_name: user.displayName || null,
    email: user.email || null,
    disappear_mode: user.disappearMode || false,
    custom_status_text: user.customStatusText || null,
    circle_data: JSON.stringify(user.circle || []),
    status_history: JSON.stringify(user.statusHistory || []),
    echo_history: JSON.stringify(user.echoHistory || []),
    chat_toggles: JSON.stringify(user.chatToggles || {}),
    updated_at: new Date().toISOString(),
  })
}

export const syncUserToSupabase = pushToSupabase

export const pullFromSupabase = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data
}

export const hydrateUserFromSupabase = async () => {
  const local = storage.get('user')
  if (!local || local.isGuest) return local
  const remote = await pullFromSupabase(local.id)
  if (!remote) return local
  const hydrated = {
    ...local,
    currentStatus: remote.status || null,
    displayName: remote.display_name || local.displayName,
    disappearMode: remote.disappear_mode || false,
    circle: remote.circle_data ? JSON.parse(remote.circle_data) : local.circle,
    statusHistory: remote.status_history ? JSON.parse(remote.status_history) : local.statusHistory,
    echoHistory: remote.echo_history ? JSON.parse(remote.echo_history) : (local.echoHistory || []),
    chatToggles: remote.chat_toggles ? JSON.parse(remote.chat_toggles) : local.chatToggles,
  }
  storage.set('user', hydrated)
  return hydrated
}

export const setStatus = async (statusId) => {
  const user = storage.get('user') || initUser()
  const entry = { status: statusId, timestamp: Date.now() }
  const history = [entry, ...(user.statusHistory || [])].slice(0, 30)
  const updated = updateUser({ currentStatus: statusId, statusHistory: history })
  await pushToSupabase(updated)
  return updated
}

export const saveEchoEntry = async (text, reflection) => {
  const user = storage.get('user') || initUser()
  const entry = { text, reflection, timestamp: Date.now() }
  const echoHistory = [entry, ...(user.echoHistory || [])].slice(0, 50)
  const updated = updateUser({ echoHistory })
  await pushToSupabase(updated)
  return updated
}

export const connectByCode = async (myUser, theirCode) => {
  const { data: theirUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('invite_code', theirCode)
    .single()

  if (error || !theirUser) return { success: false, error: 'notfound' }
  if (theirUser.id === myUser.id) return { success: false, error: 'own' }

  const circle = myUser.circle || []
  if (circle.length >= 10) return { success: false, error: 'full' }
  if (circle.find(m => m.inviteCode === theirCode)) return { success: false, error: 'duplicate' }

  await supabase.from('connections').insert({
    from_code: myUser.inviteCode,
    to_code: theirCode,
  })

  const newMember = {
    id: theirUser.id,
    initials: (theirUser.display_name || theirCode).slice(0, 2).toUpperCase(),
    status: theirUser.status || null,
    inviteCode: theirCode,
    displayName: theirUser.display_name || null,
    email: theirUser.email || null,
    connectedAt: Date.now(),
  }

  const updatedCircle = [...circle, newMember]
  const updated = updateUser({ circle: updatedCircle })
  await pushToSupabase(updated)

  return { success: true, member: newMember, updatedUser: updated }
}

export const getCircleWithLiveStatuses = async (user) => {
  if (!user || user.isGuest) return []
  const remote = await pullFromSupabase(user.id)
  const circle = remote?.circle_data ? JSON.parse(remote.circle_data) : (user.circle || [])
  if (circle.length === 0) return []

  const codes = circle.map(m => m.inviteCode).filter(Boolean)
  if (codes.length === 0) return circle

  const { data } = await supabase
    .from('users')
    .select('invite_code, status, display_name, disappear_mode')
    .in('invite_code', codes)

  if (!data) return circle

  return circle.map(member => {
    const live = data.find(d => d.invite_code === member.inviteCode)
    if (!live) return member
    return {
      ...member,
      status: live.disappear_mode ? null : (live.status || null),
      displayName: live.display_name || member.displayName,
    }
  })
}

export const restoreFromSupabaseByEmail = async (email) => {
  if (!email) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    inviteCode: data.invite_code,
    isGuest: false,
    currentStatus: data.status || null,
    displayName: data.display_name || null,
    email: data.email || null,
    disappearMode: data.disappear_mode || false,
    customStatusText: data.custom_status_text || null,
    googleLinked: !!data.email,
    circle: data.circle_data ? JSON.parse(data.circle_data) : [],
    statusHistory: data.status_history ? JSON.parse(data.status_history) : [],
    echoHistory: data.echo_history ? JSON.parse(data.echo_history) : [],
    chatToggles: data.chat_toggles ? JSON.parse(data.chat_toggles) : {},
    createdAt: Date.now(),
  }
}

export const signUp = async (googleData = null) => {
  const user = storage.get('user') || initUser()
  const updates = { isGuest: false }
  if (googleData) {
    updates.email = googleData.email
    updates.displayName = googleData.name
    updates.avatar = googleData.picture
    updates.googleLinked = true
  }
  const updated = updateUser(updates)
  await pushToSupabase(updated)
  return updated
}

export const signOut = async () => {
  const user = storage.get('user')
  if (user && !user.isGuest) {
    await pushToSupabase(user)
  }
  storage.remove('user')
}
