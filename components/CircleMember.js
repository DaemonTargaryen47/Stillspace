'use client'
import { STATUSES, ACKNOWLEDGEMENTS } from '../lib/constants'

export default function CircleMember({ member, onAcknowledge, isPreview = false }) {
  const status = STATUSES.find(s => s.id === member.status)
  const bg = status ? status.bg : '#f4f3f0'
  const color = status ? status.color : '#6b6b6e'
  const label = status ? status.label : 'no status set'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 18px',
      background: '#ffffff',
      borderRadius: 16,
      boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      opacity: isPreview ? 0.7 : 1,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 500,
        color: color,
        flexShrink: 0,
      }}>
        {member.initials || '?'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          marginRight: 8,
          verticalAlign: 'middle',
        }} />
        <span style={{ fontSize: 13, color: '#6b6b6e' }}>
          {label}
        </span>
      </div>

      {!isPreview && onAcknowledge && (
        <div style={{ display: 'flex', gap: 6 }}>
          {ACKNOWLEDGEMENTS.map(ack => (
            <button
              key={ack.id}
              onClick={() => onAcknowledge(member.id, ack.id)}
              title={ack.label}
              style={{
                width: 28,
                height: 28,
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '50%',
                background: 'none',
                cursor: 'pointer',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a0a0a3',
              }}
            >
              {ack.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
