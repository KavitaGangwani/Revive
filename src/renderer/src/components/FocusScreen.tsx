import React from 'react'
import { Activity, SessionConfig, SessionSnapshot } from '../../../shared/types'

interface FocusScreenProps {
  config: SessionConfig;
  snapshot: SessionSnapshot;
  library: Activity[];
  onChangeConfig: (newConfig: SessionConfig) => void;
  onPickActivityForRest: (index: number) => void;
  onStartSession: () => void;
  onSkipToRest: () => void;
  onAnotherOne: () => void;
  onDoneForNow: () => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  config,
  library,
  onChangeConfig,
  onPickActivityForRest,
  onStartSession
}) => {
  // Counter stepping helpers
  const handleStep = (key: 'focusMinutes' | 'restMinutes' | 'loopCount', delta: number) => {
    let nextFocus = config.focusMinutes
    let nextRest = config.restMinutes
    let nextLoops = config.loopCount

    if (key === 'focusMinutes') {
      nextFocus = Math.min(180, Math.max(5, config.focusMinutes + delta * 5))
    } else if (key === 'restMinutes') {
      nextRest = Math.min(60, Math.max(1, config.restMinutes + delta))
    } else if (key === 'loopCount') {
      nextLoops = Math.min(8, Math.max(1, config.loopCount + delta))
    }

    onChangeConfig({
      ...config,
      focusMinutes: nextFocus,
      restMinutes: nextRest,
      loopCount: nextLoops
    })
  }

  // Calculate note summary
  const n = config.loopCount
  const totalMinutes = n * (config.focusMinutes + config.restMinutes)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const noteText = `You'll have ${n} rest${n > 1 ? 's' : ''} · about ${
    hours ? `${hours}h ` : ''
  }${mins ? `${mins}m` : ''}`.trim()

  // Helper to resolve activity title
  const getActivityTitle = (id: string | null): string | null => {
    if (!id) return null
    const found = library.find((a) => a.id === id)
    return found ? (found.name || found.title || id) : id
  }

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
