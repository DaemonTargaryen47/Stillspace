import { STATUSES } from '../lib/constants'

export default function StatusCard({ statusId, size = 'md', showLabel = true }) {
  const status = STATUSES.find(s => s.id === statusId)
  if (!status) return null

  const sizes = {
    sm: { dot: 8, font: 12, padding: '6px 12px' },
    md: { dot: 10, font: 13, padding: '8px 16px' },
    lg: { dot: 12, font: 15, padding: '12px 20px' },
  }
  const s = sizes[size]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      background: status.bg,
      borderRadius: '999px',
      padding: s.padding,
    }}>
      <span style={{
        width: s.dot, height: s.dot,
        borderRadius: '50%',
        background: status.color,
        flexShrink: 0,
      }} />
      {showLabel && (
        <span style={{ fontSize: s.font, color: status.color, fontWeight: 400 }}>
          {status.label}
        </span>
      )}
    </span>
  )
}