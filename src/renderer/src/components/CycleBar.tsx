import React from 'react'

interface CycleBarProps {
  phases: { label: string; seconds: number }[]
}

export const CycleBar: React.FC<CycleBarProps> = ({ phases }) => {
  const totalSeconds = phases.reduce((acc, p) => acc + (Number(p.seconds) || 0), 0)

  return (
    <div className="f" style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Visual Segment Bar */}
      <div
        className="cyc"
        style={{
          display: 'flex',
          gap: '3px',
          height: '6px',
          width: '100%'
        }}
      >
        {phases.map((p, i) => {
          const flexVal = Number(p.seconds) > 0 ? Number(p.seconds) : 1
          const opacity = i % 2 === 0 ? 0.85 : 0.3
          return (
            <i
              key={i}
              style={{
                flex: flexVal,
                borderRadius: '3px',
                background: 'var(--accent)',
                opacity,
                minWidth: '2px'
              }}
            />
          )
        })}
      </div>

      {/* Segment Labels */}
      <div
        className="cl"
        style={{
          display: 'flex',
          gap: '3px',
          fontSize: '9px',
          color: 'var(--faint)'
        }}
      >
        {phases.map((p, i) => {
          const flexVal = Number(p.seconds) > 0 ? Number(p.seconds) : 1
          return (
            <span
              key={i}
              style={{
                flex: flexVal,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}
            >
              {p.label || `P${i + 1}`}
            </span>
          )
        })}
      </div>

      <span
        className="hint"
        style={{
          fontSize: '9.5px',
          color: 'var(--muted)',
          letterSpacing: '0.08em',
          marginTop: '2px'
        }}
      >
        Cycle: {totalSeconds}s · repeats until rest ends
      </span>
    </div>
  )
}
