import React from 'react'
import { SessionSnapshot } from '../../../shared/types'

export interface SharedShellProps {
  snapshot: SessionSnapshot;
  onSnooze?: () => void;
  onResumeFocus: () => void;
  children: React.ReactNode;
  canSnooze?: boolean;
}

export function SharedShell({
  snapshot,
  onSnooze,
  onResumeFocus,
  children,
  canSnooze = true
}: SharedShellProps): React.JSX.Element {
  const { loopIndex, loopCount, remainingMs, totalMs, snoozeUsed } = snapshot
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const mins = Math.floor(remainingSec / 60)
  const secs = remainingSec % 60
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const progressPct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none z-10">
      {/* Quiet Top Bar */}
      <header className="w-full flex items-center justify-between px-8 py-6 z-20">
        <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--muted)] font-mono">
          Rest {loopIndex + 1} of {loopCount}
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse" />
          <span className="text-[12px] text-[var(--text)] tracking-[0.1em] tabular-nums">
            {timeFormatted}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 z-10">
        {children}
      </main>

      {/* Bottom Bar: Hairline progress + Action button */}
      <footer className="w-full flex flex-col z-20">
        <div className="w-full flex items-center justify-between px-8 py-5">
          <div>
            {canSnooze && !snoozeUsed && onSnooze && (
              <button
                type="button"
                onClick={onSnooze}
                className="px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] hover:text-white border border-[var(--hair)] hover:border-[var(--faint)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] rounded-[4px] transition-all cursor-pointer font-mono"
              >
                Snooze 2m
              </button>
            )}
          </div>

          <div>
            <button
              type="button"
              id="resume-focus-btn"
              onClick={onResumeFocus}
              className="px-6 py-2.5 text-[11px] font-medium tracking-[0.14em] uppercase text-[#020407] bg-[var(--accent)] hover:bg-[var(--accent-hi)] rounded-full transition-all cursor-pointer shadow-[0_0_12px_rgba(175,221,255,0.35)] active:scale-[0.98] font-mono"
            >
              Resume focus
            </button>
          </div>
        </div>

        {/* 2px Hairline Progress Bar */}
        <div className="w-full h-[2px] bg-[rgba(255,255,255,0.08)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 ease-out shadow-[0_0_8px_var(--accent)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </footer>
    </div>
  )
}
