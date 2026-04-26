'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { storage } from './store'

const DarkModeContext = createContext({ dark: false, toggle: () => {} })

const DARK_STYLES = `
  body.dark { background: #1a1a1c !important; color: #e8e6e3 !important; }
  body.dark input, body.dark textarea { background: #2e2e30 !important; color: #e8e6e3 !important; border-color: rgba(255,255,255,0.1) !important; }
  body.dark input::placeholder, body.dark textarea::placeholder { color: #585550 !important; }
  body.dark button { color: inherit; }
  body.dark a { color: inherit; }

  body.dark .dk-bg-primary { background: #1a1a1c !important; }
  body.dark .dk-bg-card { background: #2a2a2c !important; }
  body.dark .dk-bg-muted { background: #2e2e30 !important; }
  body.dark .dk-text-primary { color: #e8e6e3 !important; }
  body.dark .dk-text-secondary { color: #a8a6a3 !important; }
  body.dark .dk-text-muted { color: #686560 !important; }
  body.dark .dk-border { border-color: rgba(255,255,255,0.08) !important; }
  body.dark .dk-shadow { box-shadow: 0 2px 16px rgba(0,0,0,0.4) !important; }

  body.dark .page-wrap { background: #1a1a1c !important; }
  body.dark .card { background: #2a2a2c !important; box-shadow: 0 2px 16px rgba(0,0,0,0.4) !important; }
  body.dark .card-muted { background: #2e2e30 !important; }
  body.dark .input-field { background: #323234 !important; color: #e8e6e3 !important; }
  body.dark .nav-bar { background: rgba(26,26,28,0.92) !important; border-color: rgba(255,255,255,0.05) !important; }
  body.dark .bottom-nav { background: rgba(26,26,28,0.95) !important; border-color: rgba(255,255,255,0.05) !important; }
  body.dark .text-p { color: #e8e6e3 !important; }
  body.dark .text-s { color: #a8a6a3 !important; }
  body.dark .text-m { color: #686560 !important; }
  body.dark .text-f { color: #484540 !important; }
  body.dark .hero-grad { background: linear-gradient(180deg, #222224 0%, #1a1a1c 100%) !important; }
  body.dark .thought-card { background: #242426 !important; }
  body.dark .status-empty { background: #2a2a2c !important; }
  body.dark .dashed-circle { border-color: rgba(255,255,255,0.15) !important; background: #2e2e30 !important; }
  body.dark .msg-bubble-them { background: #2a2a2c !important; color: #e8e6e3 !important; }
  body.dark .picker-wrap { background: #2a2a2c !important; }
  body.dark .toggle-track-off { background: rgba(255,255,255,0.15) !important; }
  body.dark .section-label { color: #686560 !important; }
  body.dark .invite-box { background: #323234 !important; color: #e8e6e3 !important; }
  body.dark .gradient-card { background: linear-gradient(135deg, #242426, #1e1e20) !important; }
  body.dark .green-gradient { background: linear-gradient(135deg, #1a2e1c, #162418) !important; }
  body.dark .warn-box { background: #2a1e14 !important; }
  body.dark .info-box { background: #1a2420 !important; }
`

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = storage.get('darkMode')
    if (saved) {
      setDark(true)
      document.body.classList.add('dark')
    }
    const styleEl = document.createElement('style')
    styleEl.id = 'stillspace-dark'
    styleEl.textContent = DARK_STYLES
    document.head.appendChild(styleEl)
    return () => {
      const el = document.getElementById('stillspace-dark')
      if (el) el.remove()
    }
  }, [])

  const toggle = () => {
    setDark(prev => {
      const next = !prev
      if (next) {
        document.body.classList.add('dark')
        storage.set('darkMode', true)
      } else {
        document.body.classList.remove('dark')
        storage.set('darkMode', false)
      }
      return next
    })
  }

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => useContext(DarkModeContext)
