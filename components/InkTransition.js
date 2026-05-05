'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function InkTransition({ children }) {
  const pathname = usePathname()
  const [key, setKey] = useState(pathname)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (pathname !== key) {
      setAnimating(true)
      setKey(pathname)
      const t = setTimeout(() => setAnimating(false), 700)
      return () => clearTimeout(t)
    }
  }, [pathname])

  return (
    <div
      key={key}
      style={{
        animation: animating ? 'inkReveal 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  )
}
