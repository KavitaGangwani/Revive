import React from 'react'
import { Activity, SessionSnapshot } from '../../../shared/types'
import { SharedShell } from './SharedShell'
import { Icon } from './Icon'

export interface ActivityPickerProps {
  activities: Activity[];
  snapshot: SessionSnapshot;
  onSelectActivity: (activity: Activity) => void;
  onSnooze?: () => void;
  onResumeFocus: () => void;
  canSnooze?: boolean;
}

export function ActivityPicker({
  activities,
  snapshot,
  onSelectActivity,
  onSnooze,
  onResumeFocus,
  canSnooze
}: ActivityPickerProps): React.JSX.Element {
  return (
    <SharedShell
      snapshot={snapshot}
      onSnooze={onSnooze}
      onResumeFocus={onResumeFocus}
      canSnooze={canSnooze}
    >
      <div className="flex flex-col items-center max-w-2xl w-full font-mono">
        <h2 className="text-[14px] font-medium tracking-[0.18em] uppercase text-[var(--text)] mb-2">
          Choose a Rest Activity
        </h2>
        <p className="text-[11px] text-[var(--muted)] tracking-[0.06em] mb-8">
          Select what you would like to do for this rest period
        </p>

        <div className="grid grid-cols-2 gap-4 w-full">
          {activities.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onSelectActivity(act)}
              className="flex flex-col items-start p-5 rounded-[6px] border border-[var(--hair)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(175,221,255,0.06)] hover:border-[var(--accent-line)] transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className="w-8 h-8 rounded-full border border-[var(--hair)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent-line)] transition-colors">
                  <Icon name={act.type === 'breathing' ? 'breathing' : act.type === 'routine' ? 'routine' : 'note'} className="w-4 h-4" />
                </span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {act.type || 'Activity'}
                </span>
              </div>

              <span className="text-[13px] font-medium text-[var(--text)] tracking-[0.06em] group-hover:text-[var(--accent-hi)] transition-colors">
                {act.name}
              </span>

              {act.note && (
                <span className="mt-1 text-[10px] text-[var(--muted)] tracking-[0.04em] line-clamp-2">
                  {act.note}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </SharedShell>
  )
}
