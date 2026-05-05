'use client'

// Spawn a floating reward symbol above an element
export const rewardFloat = (el, symbol = '✦', color = '#8a9e8c') => {
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  const div = document.createElement('div')
  div.innerHTML = symbol
  div.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    transform: translate(-50%, 0) scale(0.3);
    font-size: 18px;
    color: ${color};
    pointer-events: none;
    z-index: 9999;
    animation: floatCheck 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    font-family: var(--font-serif);
  `
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 1000)
}

// Ripple effect from center of element
export const rewardRipple = (el, color = '#8a9e8c') => {
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const div = document.createElement('div')
  div.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2 - size / 2}px;
    top: ${rect.top + rect.height / 2 - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    border: 2px solid ${color};
    pointer-events: none;
    z-index: 9999;
    animation: ripplePop 0.7s ease-out forwards;
  `
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 800)
}

// Ink dot burst from a point
export const inkBurst = (x, y, color = '#8a9e8c') => {
  if (typeof window === 'undefined') return
  const div = document.createElement('div')
  div.style.cssText = `
    position: fixed;
    left: ${x - 20}px;
    top: ${y - 20}px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${color}40;
    pointer-events: none;
    z-index: 9999;
    animation: inkDot 0.6s ease-out forwards;
  `
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 700)
}

// Pop scale on element
export const microPop = (el) => {
  if (!el) return
  el.style.animation = 'none'
  el.offsetHeight // reflow
  el.style.animation = 'statusPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
  setTimeout(() => el.style.animation = '', 600)
}
