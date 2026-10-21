import React from 'react'
import { Activity, SessionConfig, SessionSnapshot } from '../../../shared/types'
import { SessionComplete } from './SessionComplete'
import { useSessionConfig } from '../context/SessionConfigContext'

interface FocusScreenProps {
  config?: SessionConfig;
  snapshot: SessionSnapshot;
  library: Activity[];
  onChangeConfig?: (newConfig: SessionConfig) => void;
  onPickActivityForRest: (index: number) => void;
  onStartSession?: () => void;
  onSkipToRest: () => void;
  onAnotherOne: () => void;
  onDoneForNow: () => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  config: propConfig,
  snapshot,
  library,
  onPickActivityForRest,
  onStartSession: propOnStartSession,
  onSkipToRest,
  onAnotherOne,
  onDoneForNow
}) => {
  const sessionCtx = useSessionConfig()
  const config = propConfig || sessionCtx.config
  const onStartSession = propOnStartSession || sessionCtx.startSession
  // Format MM:SS for countdown timer
  const formatRemaining = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Helper to resolve activity title
  const getActivityTitle = (id: string | null): string | null => {
    if (!id) return null
    const found = library.find((a) => a.id === id)
    return found ? (found.name || (found as any).title || id) : id
  }

  // 1. Session Complete View
  if (snapshot.phase === 'session-complete') {
    return (
      <main className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SessionComplete onAnotherOne={onAnotherOne} onDoneForNow={onDoneForNow} />
      </main>
    )
  }

  // 2. Running Session View (Focus / Rest)
  const isRunning =
    snapshot.phase === 'focus' ||
    snapshot.phase === 'transition-to-rest' ||
    snapshot.phase === 'rest' ||
    snapshot.phase === 'transition-to-focus'

  if (isRunning) {
    const currentRound = (snapshot.loopIndex ?? 0) + 1
    const totalRounds = snapshot.loopCount || config.loopCount || 1

    return (
      <main className="main focus-grid">
        {/* Left Card: Active Session */}
        <section className="card focus">
          <h1>{snapshot.phase === 'rest' ? 'Rest in progress' : 'Focus in progress'}</h1>
          <p className="desc">
            {snapshot.phase === 'rest'
              ? 'Enjoy your break. Revive will guide you back to focus.'
              : 'Revive is keeping track of your focus time. Stay in flow.'}
          </p>

          <span className="label cap">
            {snapshot.phase === 'rest' ? 'Rest Time Remaining' : 'Focus Time Remaining'}
          </span>

          {/* Big Live Timer */}
          <div className="counter big" style={{ minWidth: '220px' }}>
            <div className="num" style={{ width: '100%', justifyContent: 'center' }}>
              <b style={{ fontSize: '38px', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {formatRemaining(snapshot.remainingMs)}
              </b>
              <span>remaining</span>
            </div>
          </div>

          {/* Session Progress Note */}
          <p className="note" id="note">
            Round {currentRound} of {totalRounds} · Session in progress
          </p>

          {/* Open Mini Widget Option */}
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => {
                window.miniWindowApi?.setEnabled(true)
              }}
              className="pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '10.5px',
                color: 'var(--accent)',
                borderColor: 'var(--accent-line)',
                background: 'var(--accent-wash)',
                cursor: 'pointer'
              }}
              title="Open floating desktop focus timer widget"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M15 3v6h6" />
              </svg>
              Open mini widget
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', width: '100%', maxWidth: '280px' }}>
            <button
              type="button"
              onClick={onSkipToRest}
              className="btn"
              style={{
                margin: 0,
                flex: 1,
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                padding: '0 12px',
                fontSize: '11px'
              }}
            >
              Skip to rest
            </button>
            <button
              type="button"
              onClick={onDoneForNow}
              className="cancel-btn"
              style={{
                flex: 1,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                padding: '0 12px',
                fontSize: '11px'
              }}
            >
              End session
            </button>
          </div>
        </section>

        {/* Right Card: Rest activities */}
        <section className="card rest">
          <h2>Rest activities</h2>
          <p className="rest-sub">
            Choose what you'll do in each rest. Empty ones use your default, or ask you when the time comes.
          </p>

          <div className="slots" id="slots">
            {Array.from({ length: totalRounds }, (_, i) => {
              const rawActivityId = config.restActivityIds[i]
              const activityTitle = getActivityTitle(rawActivityId)
              const isSet = Boolean(activityTitle)
              const isCurrent = i === (snapshot.loopIndex ?? 0)

              return (
                <div
                  key={i}
                  className={`slot ${isSet ? 'set' : ''}`}
                  style={isCurrent ? { borderColor: 'var(--accent-line)', background: 'var(--accent-wash)' } : undefined}
                >
                  <div className="t">
                    <span className="label">
                      Rest {i + 1} {isCurrent ? '· Next' : ''}
                    </span>
                    <span className="name">
                      <i className="dot" />
                      {activityTitle || 'No activity chosen'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPickActivityForRest(i)}
                    className="pill"
                  >
                    {isSet ? 'Change' : 'Choose activity'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    )
  }

  // 3. Idle Setup View
  // Counter stepping helpers
  const handleStep = (key: 'focusMinutes' | 'restMinutes' | 'loopCount', delta: number) => {
    if (key === 'focusMinutes') {
      sessionCtx.stepFocusMinutes(delta)
    } else if (key === 'restMinutes') {
      sessionCtx.stepRestMinutes(delta)
    } else if (key === 'loopCount') {
      sessionCtx.stepLoopCount(delta)
    }
  }

  // Calculate note summary
  const n = config.loopCount
  const totalMinutes = n * (config.focusMinutes + config.restMinutes)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const noteText = `You'll have ${n} rest${n > 1 ? 's' : ''} · about ${
    hours ? `${hours}h ` : ''
  }${mins ? `${mins}m` : ''}`.trim()



  // Pure Focus Screen: setup screen with counters and rest activities slots
  return (
    <main className="main focus-grid">
      {/* Left Card: Get ready to focus */}
      <section className="card focus">
        <h1>Get ready to focus</h1>
        <p className="desc">
          When focus ends, Revive takes over the screen so you actually rest.
        </p>

        <span className="label cap">Focus</span>

        {/* Big Focus Counter */}
        <div className="counter big">
          <div className="num">
            <b>{config.focusMinutes}</b>
            <span>mins</span>
          </div>
          <div className="chev">
            <button
              type="button"
              onClick={() => handleStep('focusMinutes', 1)}
              aria-label="More focus time"
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleStep('focusMinutes', -1)}
              aria-label="Less focus time"
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pair of Mini Counters: Rest & Rounds */}
        <div className="pair cap sm">
          <div>
            <span className="label" style={{ marginBottom: '6px' }}>Rest</span>
            <div className="counter mini">
              <div className="num">
                <b>{config.restMinutes}</b>
                <span>mins</span>
              </div>
              <div className="chev">
                <button
                  type="button"
                  onClick={() => handleStep('restMinutes', 1)}
                  aria-label="More rest time"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleStep('restMinutes', -1)}
                  aria-label="Less rest time"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div>
            <span className="label" style={{ marginBottom: '6px' }}>Rounds</span>
            <div className="counter mini">
              <div className="num">
                <b>{config.loopCount}</b>
                <span>today</span>
              </div>
              <div className="chev">
                <button
                  type="button"
                  onClick={() => handleStep('loopCount', 1)}
                  aria-label="More rounds"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleStep('loopCount', -1)}
                  aria-label="Fewer rounds"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Note line */}
        <p className="note" id="note">
          {noteText}
        </p>

        {/* Start session button */}
        <button
          type="button"
          onClick={onStartSession}
          className="btn"
        >
          <svg viewBox="0 0 24 24">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
          Start session
        </button>
      </section>

      {/* Right Card: Rest activities */}
      <section className="card rest">
        <h2>Rest activities</h2>
        <p className="rest-sub">
          Choose what you'll do in each rest. Empty ones use your default, or ask you when the time comes.
        </p>

        <div className="slots" id="slots">
          {Array.from({ length: config.loopCount }, (_, i) => {
            const rawActivityId = config.restActivityIds[i]
            const activityTitle = getActivityTitle(rawActivityId)
            const isSet = Boolean(activityTitle)

            return (
              <div
                key={i}
                className={`slot ${isSet ? 'set' : ''}`}
              >
                <div className="t">
                  <span className="label">Rest {i + 1}</span>
                  <span className="name">
                    <i className="dot" />
                    {activityTitle || 'No activity chosen'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onPickActivityForRest(i)}
                  className="pill"
                >
                  {isSet ? 'Change' : 'Choose activity'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
