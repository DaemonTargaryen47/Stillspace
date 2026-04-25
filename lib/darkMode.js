'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { storage } from './store'

const DarkModeContext = createContext({ dark: false, toggle: () => {} })

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = storage.get('darkMode')
    if (saved) {
      setDark(true)
      document.body.classList.add('dark')
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
