import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Activity,
  SessionSnapshot,
  SoundPack,
  BreathingPhase,
  PhaseKind,
  BreathingScheduleItem
} from '../../../shared/types'
import { SoundEngine } from '../audio/SoundEngine'

export interface BreathingPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  soundPacks: SoundPack[];
  initialSoundPackId?: string | null;
  volume?: number;
  onSnooze?: () => void;
  canSnooze?: boolean;
}

export function BreathingPlayer({
  activity,
  snapshot,
  soundPacks,
  initialSoundPackId = 'soft-tones',
  volume = 0.8,
  onSnooze,
  canSnooze = true
}: BreathingPlayerProps): React.JSX.Element {
  const { remainingMs, totalMs, snoozeUsed, breathingSchedule } = snapshot
  const [controlsVisible, setControlsVisible] = useState<boolean>(true)
  const [selectedPackId, setSelectedPackId] = useState<string>(initialSoundPackId || 'soft-tones')
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0)
  const [currentPhaseKind, setCurrentPhaseKind] = useState<PhaseKind>('in')
  const [currentPhaseLabel, setCurrentPhaseLabel] = useState<string>('INHALE')
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(4)
  const [phaseProgressPct, setPhaseProgressPct] = useState<number>(0)
  const [orbScale, setOrbScale] = useState<number>(0.55)

  const controlsTimeoutRef = useRef<any>(null)
  const soundEngineRef = useRef<SoundEngine | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Calculate pack list including Off
  const allPacks: SoundPack[] = [
    { id: 'off', name: 'Sound: Off', isBuiltIn: true },
    ...(soundPacks || [])
  ]

  const currentPack = allPacks.find((p) => p.id === selectedPackId) || allPacks[0]

  // Show floating controls for 6 seconds on initial load, then hide
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, 4000)
  }, [])

  useEffect(() => {
    resetControlsTimer()
    const handleMouseMove = () => resetControlsTimer()
    const handleKeyDown = () => resetControlsTimer()

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [resetControlsTimer])

  // Initialize and maintain SoundEngine
  useEffect(() => {
    const engine = new SoundEngine()
    soundEngineRef.current = engine
    engine.init()

    if (currentPack.id !== 'off') {
      engine.predecodeBuffers(currentPack).then(() => {
        if (breathingSchedule && breathingSchedule.length > 0) {
          engine.scheduleCues(breathingSchedule, currentPack, volume)
        }
      })
    }

    return () => {
      engine.dispose()
      soundEngineRef.current = null
    }
  }, [])

  // Sync sound schedule when pack or schedule changes
  useEffect(() => {
    const engine = soundEngineRef.current
    if (engine) {
      if (currentPack.id === 'off') {
        engine.stopAll()
      } else {
        engine.predecodeBuffers(currentPack).then(() => {
          if (breathingSchedule && breathingSchedule.length > 0) {
            engine.scheduleCues(breathingSchedule, currentPack, volume)
          }
        })
      }
    }
  }, [selectedPackId, breathingSchedule, volume])

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
        setCurrentPhaseIndex(currentItem.phaseIndex)
        setCurrentPhaseKind(currentItem.kind)
        setCurrentPhaseLabel(currentItem.label.toUpperCase())

        const elapsedInPhase = Math.max(0, nowEpoch - currentItem.startEpochMs)
        const progress = Math.min(1, elapsedInPhase / currentItem.durationMs)
        setPhaseProgressPct(progress)

        const secRemaining = Math.max(1, Math.ceil((currentItem.durationMs - elapsedInPhase) / 1000))
        setPhaseSecondsRemaining(secRemaining)

        // Orb Scaling Calculation: ease-in-out per phase
        // in: 0.55 -> 1.0
        // hold (if in): 1.0
        // out: 1.0 -> 0.55
        // hold (if out): 0.55
        const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
        const easedProgress = easeInOut(progress)

        if (currentItem.kind === 'in') {
          setOrbScale(0.55 + 0.45 * easedProgress)
        } else if (currentItem.kind === 'out') {
          setOrbScale(1.0 - 0.45 * easedProgress)
        } else {
          // Hold: check previous phase kind to stay expanded or contracted
          const phases = activity.phases || []
          const prevIdx = (currentItem.phaseIndex - 1 + phases.length) % phases.length
          const prevKind = phases[prevIdx]?.kind
          setOrbScale(prevKind === 'in' ? 1.0 : 0.55)
        }
      } else {
        // Fallback default calculation
        setOrbScale(0.75)
        setCurrentPhaseLabel('REST')
        setPhaseSecondsRemaining(Math.ceil(remainingMs / 1000))
      }

      animFrameRef.current = requestAnimationFrame(updateVisuals)
    }

    animFrameRef.current = requestAnimationFrame(updateVisuals)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [breathingSchedule, activity.phases, remainingMs])

  const handleCycleSoundPack = () => {
    const currentIndex = allPacks.findIndex((p) => p.id === selectedPackId)
    const nextIndex = (currentIndex + 1) % allPacks.length
    const nextPack = allPacks[nextIndex]
    setSelectedPackId(nextPack.id)
    if (window.libraryApi?.setSoundSettings) {
      window.libraryApi.setSoundSettings(nextPack.id === 'off' ? null : nextPack.id, volume)
    }
  }

  // 2px Hairline overall rest progress
  const restProgressPct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0

  // SVG ring circumference (r=120, circumference ≈ 754)
  const ringRadius = 120
  const circumference = 2 * Math.PI * ringRadius
  const strokeDashoffset = circumference * (1 - phaseProgressPct)

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden font-mono">
      {/* Immersive Center Graphic */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer 60s Orbiting Ring */}
        <div className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-[rgba(255,255,255,0.06)] animate-[spin_60s_linear_infinite] pointer-events-none flex items-start justify-center">
          <span className="w-2 h-2 -mt-1 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
        </div>

        {/* Phase Progress Circle */}
        <svg className="w-[280px] h-[280px] -rotate-90 pointer-events-none" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r={ringRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1.5"
          />
          <circle
            cx="140"
            cy="140"
            r={ringRadius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </svg>

        {/* Dynamic Light Core Orb */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full flex items-center justify-center pointer-events-none transition-transform duration-100 ease-linear"
          style={{
            transform: `scale(${orbScale})`,
            background: 'radial-gradient(circle, rgba(175, 221, 255, 0.35) 0%, rgba(175, 221, 255, 0.12) 45%, transparent 70%)',
            boxShadow: '0 0 45px rgba(175, 221, 255, 0.25)'
          }}
        >
          {/* Seconds Count Inside Orb */}
          <span className="text-[38px] font-light text-[var(--text)] tracking-[0.08em] tabular-nums select-none drop-shadow-[0_0_12px_rgba(175,221,255,0.6)]">
            {phaseSecondsRemaining}
          </span>
        </div>

        {/* Phase Word Below Orb (Crossfades and rises 8px) */}
        <div className="mt-8 h-8 flex items-center justify-center overflow-hidden">
          <span
            key={currentPhaseLabel}
            className="text-[14px] font-medium tracking-[0.24em] uppercase text-[var(--text)] animate-[fadeRise_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
          >
            {currentPhaseLabel}
          </span>
        </div>
      </div>

      {/* Floating Hidden Controls (Fade in on open for 6s / mousemove) */}
      <div
        className={`absolute bottom-8 left-8 right-8 flex items-center justify-between transition-opacity duration-700 pointer-events-auto ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Snooze Button */}
        <div>
          {canSnooze && !snoozeUsed && onSnooze && (
            <button
              type="button"
              onClick={onSnooze}
              className="px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] hover:text-white border border-[var(--hair)] hover:border-[var(--faint)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] rounded-[4px] transition-all cursor-pointer"
            >
              Snooze 2m
            </button>
          )}
        </div>

        {/* Sound Mode Toggle */}
        <div>
          <button
            type="button"
            onClick={handleCycleSoundPack}
            className="px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--accent)] border border-[var(--hair)] hover:border-[var(--accent-line)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(175,221,255,0.06)] rounded-[4px] transition-all cursor-pointer flex items-center gap-2"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${selectedPackId !== 'off' ? 'bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]' : 'bg-[var(--faint)]'}`} />
            <span>{currentPack.name}</span>
          </button>
        </div>
      </div>

      {/* 2px Hairline Rest Progress at Bottom Edge */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out shadow-[0_0_8px_var(--accent)]"
          style={{ width: `${restProgressPct}%` }}
        />
      </div>
    </div>
  )
}
