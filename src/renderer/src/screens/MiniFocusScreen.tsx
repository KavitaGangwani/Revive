import React, { useEffect, useState } from 'react'
import { SessionSnapshot } from '../../../shared/types'

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const MiniFocusScreen: React.FC = () => {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)

  const getApi = () => window.revive || window.still

  useEffect(() => {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.documentElement.classList.add('html-mini-window')
    document.body.classList.add('body-mini-window')
    document.body.classList.remove('bg-bg')

    const api = getApi()
    api?.session?.getSnapshot().then((snap) => {
      if (snap) setSnapshot(snap)
    })

    const unsub = api?.session?.onTick((newSnap) => {
      setSnapshot(newSnap)
    })

    return () => {
      if (unsub) unsub()
    }
  }, [])

  const handleSkipToRest = (e: React.MouseEvent) => {
    e.stopPropagation()
    const api = getApi()
    api?.session?.skipToRest()
  }

  const handleOpenRevive = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.windowApi?.showMainWindow) {
      window.windowApi.showMainWindow()
    } else if (window.windowControls?.show) {
      window.windowControls.show()
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.miniWindowApi?.setEnabled) {
      window.miniWindowApi.setEnabled(false)
    }
  }

  const loopIndex = (snapshot?.loopIndex ?? 0) + 1
  const loopCount = snapshot?.loopCount ?? 2
  const remainingMs = snapshot?.remainingMs ?? 0
  const totalMs = snapshot?.totalMs ?? 1
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0
  const strokeDash = 2 * Math.PI * 48

  return (
    <div className="mini-focus-card" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Dismiss button */}
      <button
        type="button"
        className="mini-close-btn"
        onClick={handleDismiss}
        title="Hide mini timer"
        aria-label="Hide mini timer"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" fill="none">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
      {/* 112px Progress Ring with Countdown Timer */}
      <div className="mini-ring-container">
        <svg className="mini-ring-svg" viewBox="0 0 112 112" width="112" height="112">
          {/* Hairline Background Track */}
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="var(--hair)"
            strokeWidth="2.5"
          />
          {/* Accent Progress Ring */}
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeDasharray={strokeDash}
            strokeDashoffset={strokeDash * (1 - progress)}
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(175, 221, 255, 0.45))',
              transition: 'stroke-dashoffset 0.25s linear'
            }}
          />
        </svg>

        <div className="mini-time-text">
          {formatCountdown(remainingMs)}
        </div>
      </div>

      {/* Caps Label */}
      <div className="mini-caps-label">
        Focus · {loopIndex} of {loopCount}
      </div>

      {/* Two Round Icon Buttons */}
      <div className="mini-actions-row" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          type="button"
          className="mini-icon-btn"
          onClick={handleSkipToRest}
          title="Skip to rest"
          aria-label="Skip to rest"
        >
          <svg viewBox="0 0 24 24" width="13" height="13">
            <path d="M5 4l8 8-8 8V4zm9 0l8 8-8 8V4z" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          className="mini-icon-btn"
          onClick={handleOpenRevive}
          title="Open Revive"
          aria-label="Open Revive"
        >
          <svg viewBox="0 0 24 24" width="13" height="13">
            <path d="M4 4h7v2H6v5H4V4zm16 0h-7v2h5v5h2V4zM4 20h7v-2H6v-5H4v7zm16 0h-7v-2h5v-5h2v7z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
