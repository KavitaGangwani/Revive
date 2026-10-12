import React, { useMemo } from 'react'

interface StarData {
  id: number;
  left: string;
  top: string;
  duration: string;
  delay: string;
}

export const Stars: React.FC = () => {
  const stars = useMemo<StarData[]>(() => {
    const list: StarData[] = []
    for (let i = 0; i < 40; i++) {
      list.push({
        id: i,
        left: `${(Math.sin(i * 997 + 13) * 0.5 + 0.5) * 100}%`,
        top: `${(Math.cos(i * 613 + 37) * 0.5 + 0.5) * 100}%`,
        duration: `${3 + (i % 5)}s`,
        delay: `-${(i % 8)}s`
      })
    }
    return list
  }, [])

  return (
    <div className="stars" id="stars" aria-hidden="true">
      {stars.map((s) => (
        <i
          key={s.id}
          style={
            {
              left: s.left,
              top: s.top,
              '--d': s.duration,
              '--l': s.delay
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
