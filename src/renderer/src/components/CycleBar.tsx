import React from 'react'
import { BreathingPhase } from '../../../shared/types'

interface CycleBarProps {
  phases: BreathingPhase[];
}

export const CycleBar: React.FC<CycleBarProps> = ({ phases }) => {
  const totalSeconds = phases.reduce((acc, p) => acc + (Number(p.seconds) || 0), 0)

  return (
    <div className="f" style={{ marginTop: '4px' }}>
      {/* Visual Segment Bar */}
      <div className="cyc">
        {phases.map((p, i) => {
          const flexVal = Number(p.seconds) > 0 ? Number(p.seconds) : 1
          const opacity = i % 2 === 0 ? 0.85 : 0.3
          return (
            <i
              key={i}
              style={{
                flex: flexVal,
                opacity
              }}
            />
          )
        })}
      </div>

      {/* Segment Labels */}
      <div className="cl">
        {phases.map((p, i) => {
          const flexVal = Number(p.seconds) > 0 ? Number(p.seconds) : 1
          return (
            <span
              key={i}
              style={{
                flex: flexVal
              }}
            >
              {p.label || `Phase ${i + 1}`}
            </span>
          )
        })}
      </div>

      <span className="hint" style={{ marginTop: '2px' }}>
        Cycle: {totalSeconds}s · repeats until rest ends
      </span>
    </div>
  )
}
