import React from 'react'
import { Activity } from '../../../shared/types'
import { Icon } from './Icon'

interface ActivityRowProps {
  activity: Activity
  isDefault: boolean
  isPicking: boolean
  isChosen?: boolean
  isHighlighted?: boolean
  isEditing?: boolean
  onUse?: () => void
  onToggleDefault: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function formatActivityMeta(a: Activity): string {
  const parts: string[] = []

  if (a.type === 'breathing' && a.phases && a.phases.length > 0) {
    const pattern = a.phases.map((p) => p.seconds).join('-')
    const totalSecs = a.phases.reduce((acc, p) => acc + (p.seconds || 0), 0)
    parts.push(`Breathing · ${pattern} · ${totalSecs}s cycle`)
  } else if (a.type === 'routine' && a.steps && a.steps.length > 0) {
    const stepCount = `${a.steps.length} step${a.steps.length > 1 ? 's' : ''}`
    const totalSecs = a.steps.reduce((acc, s) => acc + (s.seconds || 0), 0)
    const mins = Math.floor(totalSecs / 60)
    const remSecs = totalSecs % 60
    const timeStr = mins > 0 ? (remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`) : `${remSecs}s`
    parts.push(`Routine · ${stepCount} · ${timeStr}`)
  }

  if (a.media?.kind === 'youtube') {
    parts.push('+ YouTube')
  } else if (a.media?.kind === 'spotify') {
    parts.push('+ Spotify')
  }

  return parts.join(' · ')
}

export const ActivityRow: React.FC<ActivityRowProps> = ({
  activity,
  isDefault,
  isPicking,
  isChosen,
  isHighlighted,
  isEditing,
  onUse,
  onToggleDefault,
  onEdit,
  onDelete
}) => {
  const isBuiltIn = Boolean(activity.builtIn || activity.isBuiltIn || activity.builtin)
  const meta = formatActivityMeta(activity)
  const iconName = activity.type === 'breathing' ? 'breathing' : activity.type === 'routine' ? 'routine' : 'note'

  return (
    <div
      className={`row ${isDefault ? 'def' : ''} ${isHighlighted ? 'highlighted' : ''} ${
        isEditing ? 'editing' : ''
      }`}
      id={`activity-row-${activity.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        borderRadius: '16px',
        border: isEditing
          ? '1px solid var(--accent-line)'
          : isDefault
          ? '1px solid var(--accent-line)'
          : isHighlighted
          ? '1px solid var(--accent-line)'
          : '1px solid var(--hair)',
        background: isDefault ? 'rgba(175, 221, 255, 0.02)' : 'rgba(255, 255, 255, 0.02)',
        transition: 'border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s'
      }}
    >
      {/* 1. Icon tile 36px circle */}
      <div
        className="ic"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '999px',
          border: isDefault ? '1px solid var(--accent-line)' : '1px solid var(--hud-border)',
          background: isDefault ? 'var(--accent-wash)' : 'rgba(255, 255, 255, 0.02)',
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
          color: isDefault ? 'var(--accent)' : 'var(--muted)',
          boxShadow: isDefault ? '0 0 10px rgba(175, 221, 255, 0.35)' : 'none'
        }}
      >
        <Icon name={iconName} style={{ width: '17px', height: '17px' }} />
      </div>

      {/* 2. Text info */}
      <div
        className="t"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}
      >
        <span
          className="name"
          style={{
            fontSize: '12px',
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {activity.name}
        </span>
        {meta ? (
          <span
            className="meta"
            style={{
              fontSize: '10px',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {meta}
          </span>
        ) : null}
        {activity.tagline || activity.notes || activity.note ? (
          <span
            className="note-line"
            style={{
              fontSize: '10px',
              color: 'var(--faint)',
              textTransform: 'none',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {activity.tagline || activity.notes || activity.note}
          </span>
        ) : null}
      </div>

      {/* 3. Pick Mode: Use / Chosen pill */}
      {isPicking && onUse && (
        <button
          type="button"
          className={`pill ${isChosen ? 'on' : ''}`}
          onClick={onUse}
          aria-label={isChosen ? `Selected for rest` : `Use ${activity.name} for this rest`}
          style={{
            height: '26px',
            padding: '0 10px',
            borderRadius: '999px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {isChosen ? 'Chosen' : 'Use'}
        </button>
      )}

      {/* 4. Default star icon button (26px round) */}
      <button
        type="button"
        className={`star-btn ${isDefault ? 'active' : ''}`}
        onClick={onToggleDefault}
        aria-label={isDefault ? 'Clear default' : 'Set as default'}
        title={isDefault ? 'Clear default' : 'Set as default'}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '999px',
          display: 'grid',
          placeItems: 'center',
          border: 'none',
          background: isDefault ? 'var(--accent-wash)' : 'transparent',
          color: isDefault ? 'var(--accent)' : 'var(--faint)',
          cursor: 'pointer',
          flex: 'none',
          boxShadow: isDefault ? '0 0 10px rgba(175, 221, 255, 0.45)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <Icon name="star" filled={isDefault} style={{ width: '14px', height: '14px' }} />
      </button>

      {/* 5. Edit and Delete icon buttons (26px round) - Custom rows only */}
      {!isBuiltIn && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 'none' }}>
          {onEdit && (
            <button
              type="button"
              className="x"
              onClick={onEdit}
              aria-label="Edit activity"
              title="Edit activity"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
            >
              <Icon name="edit" style={{ width: '13px', height: '13px' }} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="x"
              onClick={onDelete}
              aria-label="Delete activity"
              title="Delete activity"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
            >
              <Icon name="delete" style={{ width: '13px', height: '13px' }} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
