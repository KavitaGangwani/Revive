import React from 'react'

interface SessionCompleteProps {
  onAnotherOne: () => void;
  onDoneForNow: () => void;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  onAnotherOne,
  onDoneForNow
}) => {
  return (
    <div className="session-complete-container">
      {/* 1. Staggered Ring with Drawn Checkmark */}
      <div className="session-complete-ring-wrap">
        <svg className="session-complete-svg" viewBox="0 0 112 112" width="112" height="112">
          {/* Subtle Outer Track */}
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2.5"
          />
          {/* Closing Accent Ring */}
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeDasharray={2 * Math.PI * 48}
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(175, 221, 255, 0.5))',
              animation: 'completeRingDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          />
          {/* Animated Drawn Check */}
          <path
            d="M36 56 L49 69 L76 42"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="60"
            strokeDashoffset="60"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(175, 221, 255, 0.6))',
              animation: 'completeCheckDraw 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards'
            }}
          />
        </svg>
      </div>

      {/* 2. Heading */}
      <h1 className="session-complete-heading">
        Nice work — that's one done.
      </h1>

      {/* 3. Sub-line */}
      <p className="session-complete-line">
        Another one, or done for now?
      </p>

      {/* 4. Action text links with hairline divider */}
      <div className="session-complete-actions">
        <button
          type="button"
          onClick={onAnotherOne}
          className="session-action-link another-one"
        >
          <span>Another one</span>
          <span className="action-underline active-default" />
        </button>

        <div className="session-action-divider" />

        <button
          type="button"
          onClick={onDoneForNow}
          className="session-action-link done-for-now"
        >
          <span>Done for now</span>
          <span className="action-underline" />
        </button>
      </div>
    </div>
  )
}
