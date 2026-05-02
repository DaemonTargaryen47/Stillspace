'use client'
import { STATUSES } from '../lib/constants'

export default function CircleMember({ member, isPreview = false }) {
  const status = STATUSES.find(s => s.id === member.status)
  const hasCustom = member.customStatusText && member.customStatusText.trim()
  const isDisappeared = member.disappearMode

  const bg = isDisappeared ? '#f4f3f0' : hasCustom ? '#f5f0eb' : (status ? status.bg : '#f4f3f0')
  const color = isDisappeared ? '#b0a99a' : hasCustom ? '#a09080' : (status ? status.color : '#6b6b6e')
  const label = isDisappeared ? 'Disappeared' : hasCustom ? member.customStatusText : (status ? status.label : 'No status set')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      background: 'var(--bg-card, #ffffff)', borderRadius: 16,
      boxShadow: 'var(--shadow, 0 2px 20px rgba(0,0,0,0.06))',
      opacity: isPreview ? 0.7 : 1,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color, flexShrink: 0 }}>
        {member.initials || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {member.displayName && <p style={{ fontSize: 14, color: 'var(--text-primary, #2c2c2e)', fontWeight: 500, marginBottom: 3 }}>{member.displayName}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDisappeared ? '#b0a99a' : color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary, #6b6b6e)', lineHeight: 1.4, fontStyle: isDisappeared ? 'italic' : 'normal' }}>{label}</span>
        </div>
        {hasCustom && !isDisappeared && <p style={{ fontSize: 10, color: 'var(--text-faint, #c0bdb8)', marginTop: 2, marginLeft: 14 }}>custom status</p>}
      </div>
    </div>
  )
}
