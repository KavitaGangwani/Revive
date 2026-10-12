import React from 'react'
import { Activity } from '../../../shared/types'
import { Icon } from './Icon'

interface ActivityRowProps {
  activity: Activity;
  isDefault: boolean;
  isPicking: boolean;
  isHighlighted?: boolean;
  isEditing?: boolean;
  onUse?: () => void;
  onToggleDefault: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function formatActivityMeta(a: Activity): string {
  if (a.type === 'breathing' && a.phases) {
    const pattern = a.phases.map((p) => p.seconds).join('-')
    const cycleSeconds = a.phases.reduce((acc, p) => acc + (p.seconds || 0), 0)
    return `Breathing · ${pattern} · ${cycleSeconds}s cycle${a.isBuiltIn ? ' · built-in' : ''}`
  }
  if (a.type === 'custom') {
    return 'Custom · runs for your rest'
  }
  if (a.type === 'youtube') {
    return 'YouTube · link · you end it'
  }
  if (a.type === 'spotify') {
    return 'Spotify · link · you end it'
  }
  return 'Activity · custom'
}

export const ActivityRow: React.FC<ActivityRowProps> = ({
  activity,
  isDefault,
  isPicking,
  isHighlighted,
  isEditing,
  onUse,
  onToggleDefault,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  return (
    <div
      className={`row ${isDefault ? 'def' : ''} ${isHighlighted ? 'highlighted' : ''} ${
        isEditing ? 'editing' : ''
      }`}
      id={`activity-row-${activity.id}`}
    >
      {/* Icon Circle */}
      <div className="ic">
        <Icon name={activity.type} />
      </div>

      {/* Text Info */}
      <div className="t">
        <span className="name">{activity.name}</span>
        <span className="meta">{formatActivityMeta(activity)}</span>
        {activity.note && (
          <span className="note-line">
            “{activity.note}”
          </span>
        )}
      </div>

      {/* Pick Mode: Use Pill */}
      {isPicking && onUse && (
        <button
          type="button"
          className="pill on"
          onClick={onUse}
          aria-label={`Use ${activity.name} for this rest`}
        >
          Use
        </button>
      )}

      {/* Set default / Default Pill */}
      <button
        type="button"
        className={`pill ${isDefault ? 'on' : ''}`}
        onClick={onToggleDefault}
        aria-label={isDefault ? `Remove default for ${activity.name}` : `Set ${activity.name} as default`}
      >
        {isDefault ? 'Default' : 'Set default'}
      </button>

      {/* Built-in duplicate button */}
      {activity.isBuiltIn && onDuplicate && (
        <button
          type="button"
          className="x"
          onClick={onDuplicate}
          aria-label="Duplicate to edit"
          title="Duplicate to edit"
        >
          <Icon name="duplicate" />
        </button>
      )}

      {/* User-created Edit & Delete buttons */}
      {!activity.isBuiltIn && (
        <>
          {onEdit && (
            <button
              type="button"
              className="x"
              onClick={onEdit}
              aria-label="Edit activity"
              title="Edit activity"
            >
              <Icon name="edit" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="x"
              onClick={onDelete}
              aria-label={`Delete ${activity.name}`}
              title="Delete activity"
            >
              <Icon name="x" />
            </button>
          )}
        </>
      )}
    </div>
  )
}
