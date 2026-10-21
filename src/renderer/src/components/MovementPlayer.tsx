import React from 'react'
import { Activity, SessionSnapshot } from '../../../shared/types'
import { SharedShell } from './SharedShell'

export interface MovementPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  onSnooze?: () => void;
  onResumeFocus: () => void;
  canSnooze?: boolean;
}

export function MovementPlayer({
  activity,
  snapshot,
  onSnooze,
  onResumeFocus,
  canSnooze
}: MovementPlayerProps): React.JSX.Element {
  const { remainingMs, totalMs } = snapshot
  const progressPct = totalMs > 0 ? Math.min(1, Math.max(0, (totalMs - remainingMs) / totalMs)) : 0
  const ringRadius = 110
  const circumference = 2 * Math.PI * ringRadius
  const strokeDashoffset = circumference * (1 - progressPct)

  return (
    <SharedShell
      snapshot={snapshot}
      activity={activity}
      onSnooze={onSnooze}
      onResumeFocus={onResumeFocus}
      canSnooze={canSnooze}
    >
      <div className="flex flex-col items-center justify-center font-mono">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] border border-[var(--accent-line)] bg-[var(--accent-wash)] rounded-[3px]">
            Movement
          </span>
        </div>

        <h2 className="text-[20px] font-medium tracking-[0.16em] uppercase text-[var(--text)] mb-8">
          {activity.name}
        </h2>

        {/* Circular Progress Arc (No Number Inside) */}
        <div className="relative flex items-center justify-center">
          <svg className="w-[260px] h-[260px] -rotate-90 pointer-events-none" viewBox="0 0 260 260">
            <circle
              cx="130"
              cy="130"
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="2"
            />
            <circle
              cx="130"
              cy="130"
              r={ringRadius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>
        </div>

        {activity.note && (
          <p className="mt-8 text-[13px] text-[var(--muted)] tracking-[0.06em] text-center max-w-md">
            {activity.note}
          </p>
        )}
      </div>
    </SharedShell>
  )
}
