import React, { useEffect, useState, useRef } from 'react'
import {
  Activity,
  SessionSnapshot,
  BreathingScheduleItem
} from '../../../shared/types'

export interface BreathingPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  onResumeFocus?: () => void;
  onSnooze?: () => void;
  canSnooze?: boolean;
}

export function BreathingPlayer({
  activity,
  snapshot,
  onResumeFocus,
  onSnooze,
  canSnooze
}: BreathingPlayerProps): React.JSX.Element {
  const { remainingMs, totalMs, breathingSchedule } = snapshot

  const [displayedSec, setDisplayedSec] = useState<number>(4)
  const [phaseWord, setPhaseWord] = useState<string>('INHALE')

  const orbRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)

  // Stable ref to schedule so incoming 250ms ticks don't tear down the animation loop
  const scheduleRef = useRef<BreathingScheduleItem[] | undefined>(breathingSchedule)
  scheduleRef.current = breathingSchedule

  const lastSecRef = useRef<number>(-1)
  const lastIndexRef = useRef<number>(-1)

  // Direct Escape key listener (no visible buttons on screen)
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

  // SVG circular ring circumference (r=115, circumference = 2 * PI * 115 ≈ 722.566)
  const ringRadius = 115
  const circumference = 2 * Math.PI * ringRadius

  // Authoritative single-clock visual update loop driven directly by Date.now() against the schedule
  useEffect(() => {
    let animId: number | null = null

    const tick = () => {
      const now = Date.now()
      const schedule = scheduleRef.current || []

      if (schedule.length === 0) {
        animId = requestAnimationFrame(tick)
        return
      }

      // 1. Resolve current active phase item from schedule
      let currentItem: BreathingScheduleItem | null = null
      for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i]
        const phaseEndsAt = item.startEpochMs + item.durationMs
        if (now >= item.startEpochMs && now < phaseEndsAt) {
          currentItem = item
          break
        }
      }

      if (!currentItem) {
        if (now < schedule[0].startEpochMs) {
          currentItem = schedule[0]
        } else {
          currentItem = schedule[schedule.length - 1]
        }
      }

      const phaseEndsAt = currentItem.startEpochMs + currentItem.durationMs
      const durationMs = Math.max(1, currentItem.durationMs)
      const elapsed = Math.max(0, Math.min(durationMs, now - currentItem.startEpochMs))
      const progress = elapsed / durationMs

      // 2. Derive mature phase word (INHALE / HOLD / EXHALE)
      const rawKind = currentItem.kind
      const normalizedKind =
        rawKind === 'in' || rawKind === 'inhale'
          ? 'in'
          : rawKind === 'out' || rawKind === 'exhale'
          ? 'out'
          : 'hold'

      const word =
        normalizedKind === 'in'
          ? 'INHALE'
          : normalizedKind === 'out'
          ? 'EXHALE'
          : 'HOLD'

      if (currentItem.index !== lastIndexRef.current) {
        lastIndexRef.current = currentItem.index
        setPhaseWord(word)
      }

      // 3. Smooth Hardware Updates on DOM (runs every frame at 60/120fps with zero React state overhead)

      // A. Continuous Progress Ring (starts at 0, sweeps smoothly to 100% over the exact duration)
      if (circleRef.current) {
        const offset = circumference * (1 - progress)
        circleRef.current.style.strokeDashoffset = `${offset.toFixed(2)}px`
      }

      // B. Smooth Organic Diaphragm Breathing Curve for Orb Scale
      // Smooth sinusoidal easing: natural acceleration and deceleration
      const ease = (1 - Math.cos(progress * Math.PI)) / 2

      let startScale = 0.65
      let targetScale = 1.0

      if (normalizedKind === 'in') {
        startScale = 0.65
        targetScale = 1.0
      } else if (normalizedKind === 'out') {
        startScale = 1.0
        targetScale = 0.65
      } else {
        // Hold phase: keep scale stable based on whether hold is full (after inhale) or empty (after exhale)
        const phases = activity.phases || []
        const prevIdx = (currentItem.phaseIndex - 1 + phases.length) % phases.length
        const prevKind = phases[prevIdx]?.kind
        const isFull = prevKind === 'in' || prevKind === 'inhale'
        startScale = isFull ? 1.0 : 0.65
        targetScale = startScale
      }

      const currentScale = startScale + (targetScale - startScale) * ease

      if (orbRef.current) {
        orbRef.current.style.transform = `scale(${currentScale.toFixed(4)})`
        const glowSpread = 25 + 30 * ((currentScale - 0.65) / 0.35)
        const glowAlpha = 0.12 + 0.14 * ((currentScale - 0.65) / 0.35)
        orbRef.current.style.boxShadow = `0 0 ${glowSpread.toFixed(1)}px rgba(175, 221, 255, ${glowAlpha.toFixed(3)})`
      }

      // 4. Countdown Integer Seconds inside the Orb:
      // Computes Math.ceil((phaseEndsAt - now) / 1000) and updates React state ONLY when the integer changes (1 Hz)
      const remainingInPhaseSec = Math.max(1, Math.ceil((phaseEndsAt - now) / 1000))
      if (remainingInPhaseSec !== lastSecRef.current) {
        lastSecRef.current = remainingInPhaseSec
        setDisplayedSec(remainingInPhaseSec)
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [activity.phases, circumference])

  // Overall rest countdown in top bar
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const mins = Math.floor(remainingSec / 60)
  const secs = remainingSec % 60
  const overallFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Overall rest progress across the full rest session
  const restProgressPct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between select-none overflow-hidden font-mono bg-transparent z-10">
      {/* Quiet Top Bar: Rest N of M + Activity Name + Pulsating Dot + Overall Rest Countdown */}
      <header className="w-full flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-3">
          <span className="text-[11px] tracking-[0.14em] uppercase text-[var(--muted,#8a99a8)] font-mono">
            Rest {snapshot.loopIndex + 1} of {snapshot.loopCount}
          </span>
          <span className="text-[11px] text-white/30 font-mono">·</span>
          <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--accent,#afddff)] border border-[var(--accent-line,rgba(175,221,255,0.35))] bg-[var(--accent-wash,rgba(175,221,255,0.08))] rounded-[3px]">
            Breathing
          </span>
          <span className="text-[12px] text-[var(--text,#ffffff)] tracking-[0.08em] font-medium font-mono">
            {activity.name}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--accent,#afddff)] shadow-[0_0_8px_var(--accent,#afddff)] animate-pulse" />
          <span className="text-[12px] text-[var(--text,#ffffff)] tracking-[0.1em] tabular-nums">
            {overallFormatted}
          </span>
        </div>
      </header>

      {/* Main Breathing Centerpiece */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 max-w-2xl px-4">
        <div className="relative w-[280px] h-[280px] flex items-center justify-center">
          {/* Phase Progress Ring SVG */}
          <svg className="absolute inset-0 w-[280px] h-[280px] -rotate-90 pointer-events-none" viewBox="0 0 280 280">
            {/* Background Track */}
            <circle
              cx="140"
              cy="140"
              r={ringRadius}
              fill="none"
              stroke="rgba(175, 221, 255, 0.08)"
              strokeWidth="2"
            />
            {/* Dynamic Sweep Arc */}
            <circle
              ref={circleRef}
              cx="140"
              cy="140"
              r={ringRadius}
              fill="none"
              stroke="var(--accent, #afddff)"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
            />
          </svg>

          {/* Luminous Breath Core (Hardware Accelerated Smooth Scale) */}
          <div
            ref={orbRef}
            className="w-[190px] h-[190px] rounded-full flex items-center justify-center pointer-events-none will-change-transform"
            style={{
              transform: 'scale(0.65)',
              background: 'radial-gradient(circle, rgba(175, 221, 255, 0.18) 0%, rgba(175, 221, 255, 0.04) 65%, transparent 100%)',
              border: '1px solid rgba(175, 221, 255, 0.25)',
              boxShadow: '0 0 35px rgba(175, 221, 255, 0.14)'
            }}
          >
            {/* Seconds Counter inside Orb */}
            <span className="text-[48px] font-light text-[var(--text, #ffffff)] tracking-[0.04em] tabular-nums select-none drop-shadow-[0_0_12px_rgba(175,221,255,0.45)]">
              {displayedSec}
            </span>
          </div>
        </div>

        {/* Mature, Elegant Phase Word (INHALE / HOLD / EXHALE) */}
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          <span
            key={phaseWord}
            className="text-[40px] md:text-[46px] font-medium tracking-[0.2em] uppercase text-white transition-opacity duration-300"
            style={{
              fontFamily: 'var(--font-display, inherit)',
              lineHeight: 1.1,
              letterSpacing: '0.22em'
            }}
          >
            {phaseWord}
          </span>
        </div>

        {/* Activity Name, Tagline & Detailed Notes/Instructions directly below Inhale & Exhale */}
        <div className="mt-5 flex flex-col items-center text-center max-w-xl px-2 animate-fade-in">
          <div className="text-[12px] uppercase tracking-[0.16em] text-[var(--accent,#afddff)] font-medium mb-1 font-mono">
            {activity.name}
          </div>
          {activity.tagline && (
            <div className="text-[11px] text-white/70 tracking-[0.04em] mb-2 font-mono">
              {activity.tagline}
            </div>
          )}
          {(activity.notes || activity.note) && (
            <div className="max-h-[110px] overflow-y-auto px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(175,221,255,0.18)] text-[11px] text-white/70 leading-relaxed font-mono text-center">
              {activity.notes || activity.note}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Press ESC to escape & Hairline Rest Progress at Bottom Edge */}
      <footer className="w-full flex flex-col z-20">
        <div className="w-full flex items-center justify-between px-8 py-3.5">
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[var(--muted,#8a99a8)] tracking-[0.08em] select-none font-mono">
              Press ESC to escape.
            </span>
            {canSnooze && !snapshot.snoozeUsed && onSnooze && (
              <button
                type="button"
                onClick={onSnooze}
                className="px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted,#8a99a8)] hover:text-white border border-[var(--hair,rgba(255,255,255,0.08))] hover:border-[var(--faint,rgba(255,255,255,0.28))] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] rounded-[4px] transition-all cursor-pointer font-mono"
              >
                Snooze 2m
              </button>
            )}
          </div>
        </div>

        <div className="w-full h-[2px] bg-[rgba(255,255,255,0.08)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent,#afddff)] transition-all duration-300 ease-out shadow-[0_0_8px_var(--accent,#afddff)]"
            style={{ width: `${restProgressPct}%` }}
          />
        </div>
      </footer>
    </div>
  )
}
