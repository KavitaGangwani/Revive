import React, { useEffect, useState, useRef } from 'react'
import {
  Activity,
  SessionSnapshot,
  SoundPack,
  PhaseKind,
  BreathingScheduleItem
} from '../../../shared/types'

export interface BreathingPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  soundPacks?: SoundPack[];
  initialSoundPackId?: string | null;
  volume?: number;
  onResumeFocus?: () => void;
  onSnooze?: () => void;
  canSnooze?: boolean;
}

export function BreathingPlayer({
  activity,
  snapshot,
  onResumeFocus
}: BreathingPlayerProps): React.JSX.Element {
  const { remainingMs, totalMs, breathingSchedule } = snapshot
  const [currentPhaseKind, setCurrentPhaseKind] = useState<PhaseKind>('in')
  const [currentPhaseLabel, setCurrentPhaseLabel] = useState<string>('INHALE')
  const [phaseCurrentSecond, setPhaseCurrentSecond] = useState<number>(1)
  const [phaseTotalSeconds, setPhaseTotalSeconds] = useState<number>(4)
  const [phaseProgressPct, setPhaseProgressPct] = useState<number>(0)
  const [orbScale, setOrbScale] = useState<number>(0.6)

  const animFrameRef = useRef<number | null>(null)

  // Direct Escape key handler inside the component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onResumeFocus?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [onResumeFocus])

  // Single-clock Visual Update Loop tied to Epoch time
  useEffect(() => {
    const updateVisuals = () => {
      const nowEpoch = Date.now()
      const schedule = breathingSchedule || []

      // Find current schedule item
      let currentItem: BreathingScheduleItem | null = null
      for (const item of schedule) {
        if (nowEpoch >= item.startEpochMs && nowEpoch < item.startEpochMs + item.durationMs) {
          currentItem = item
          break
        }
      }

      if (!currentItem && schedule.length > 0) {
        if (nowEpoch < schedule[0].startEpochMs) {
          currentItem = schedule[0]
        } else {
          currentItem = schedule[schedule.length - 1]
        }
      }

      if (currentItem) {
        setCurrentPhaseKind(currentItem.kind)
        setCurrentPhaseLabel(currentItem.label.toUpperCase())

        const elapsedInPhase = Math.max(0, nowEpoch - currentItem.startEpochMs)
        const progress = Math.min(1, elapsedInPhase / currentItem.durationMs)
        setPhaseProgressPct(progress)

        // Seconds counter running 1, 2, 3... at natural 1-second cadence
        const totalSecs = Math.max(1, Math.round(currentItem.durationMs / 1000))
        const secTick = Math.min(totalSecs, Math.max(1, Math.floor(elapsedInPhase / 1000) + 1))
        setPhaseTotalSeconds(totalSecs)
        setPhaseCurrentSecond(secTick)

        // Smooth breathing orb scaling
        // Inhale: 0.6 -> 1.0
        // Hold (after Inhale): stays 1.0
        // Exhale: 1.0 -> 0.6
        // Hold (after Exhale): stays 0.6
        const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
        const easedProgress = easeInOut(progress)

        if (currentItem.kind === 'in') {
          setOrbScale(0.6 + 0.4 * easedProgress)
        } else if (currentItem.kind === 'out') {
          setOrbScale(1.0 - 0.4 * easedProgress)
        } else {
          const phases = activity.phases || []
          const prevIdx = (currentItem.phaseIndex - 1 + phases.length) % phases.length
          const prevKind = phases[prevIdx]?.kind
          setOrbScale(prevKind === 'in' ? 1.0 : 0.6)
        }
      } else {
        // Fallback default calculation
        setOrbScale(0.75)
        setCurrentPhaseLabel('REST')
        const sec = Math.max(1, Math.ceil(remainingMs / 1000))
        setPhaseCurrentSecond(sec)
        setPhaseTotalSeconds(sec)
      }

      animFrameRef.current = requestAnimationFrame(updateVisuals)
    }

    animFrameRef.current = requestAnimationFrame(updateVisuals)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [breathingSchedule, activity.phases, remainingMs])

  // Overall rest progress across the full rest session
  const restProgressPct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0

  // SVG ring circumference (r=110, circumference ≈ 691.15)
  const ringRadius = 110
  const circumference = 2 * Math.PI * ringRadius
  const strokeDashoffset = circumference * (1 - phaseProgressPct)

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between select-none overflow-hidden font-mono bg-[#020407]">
      {/* Top spacer */}
      <div className="h-10 w-full" />

      {/* Clean, Serene Center Breathing Circle */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <div className="relative w-[260px] h-[260px] flex items-center justify-center">
          {/* Phase Progress Circle SVG */}
          <svg className="absolute inset-0 w-[260px] h-[260px] -rotate-90 pointer-events-none" viewBox="0 0 260 260">
            {/* Background Track */}
            <circle
              cx="130"
              cy="130"
              r={ringRadius}
              fill="none"
              stroke="rgba(175, 221, 255, 0.08)"
              strokeWidth="2"
            />
            {/* Active Accent Progress */}
            <circle
              cx="130"
              cy="130"
              r={ringRadius}
              fill="none"
              stroke="var(--accent, #afddff)"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-100 ease-linear"
            />
          </svg>

          {/* Clean, Soothing Light Orb */}
          <div
            className="w-[180px] h-[180px] rounded-full flex items-center justify-center pointer-events-none transition-transform duration-100 ease-linear"
            style={{
              transform: `scale(${orbScale})`,
              background: 'radial-gradient(circle, rgba(175, 221, 255, 0.16) 0%, rgba(175, 221, 255, 0.04) 65%, transparent 100%)',
              border: '1px solid rgba(175, 221, 255, 0.22)',
              boxShadow: '0 0 35px rgba(175, 221, 255, 0.12)'
            }}
          >
            {/* Seconds Counter: counting up 1, 2, 3... */}
            <span className="text-[44px] font-light text-[var(--text, #ffffff)] tracking-[0.06em] tabular-nums select-none drop-shadow-[0_0_10px_rgba(175,221,255,0.4)]">
              {phaseCurrentSecond}
            </span>
          </div>
        </div>

        {/* Phase Name & Instruction Below Orb */}
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          <span
            key={currentPhaseLabel}
            className="text-[14px] font-medium tracking-[0.2em] uppercase text-[var(--text, #ffffff)]"
          >
            {currentPhaseLabel} · {phaseTotalSeconds}s
          </span>
          <span className="text-[12px] text-[var(--muted, #8a99a8)] tracking-[0.04em] mt-1.5 font-normal">
            {currentPhaseKind === 'in'
              ? 'Inhale slowly through your nose'
              : currentPhaseKind === 'out'
              ? 'Exhale gently through your mouth'
              : 'Hold your breath gently'}
          </span>
        </div>
      </div>

      {/* Bottom Area: Centered Escape Hint + Rest Progress */}
      <div className="w-full flex flex-col items-center z-20 pb-0">
        <div className="w-full flex items-center justify-center px-8 py-4">
          <span className="text-[11px] text-[var(--muted, #8a99a8)] tracking-[0.08em] select-none font-mono">
            Press Escape to escape.
          </span>
        </div>

        {/* 2px Hairline Rest Progress at Bottom Edge */}
        <div className="w-full h-[2px] bg-[rgba(255,255,255,0.08)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent, #afddff)] transition-all duration-300 ease-out shadow-[0_0_8px_var(--accent, #afddff)]"
            style={{ width: `${restProgressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
