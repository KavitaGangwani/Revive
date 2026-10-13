import React, { useState, useEffect, useRef } from 'react'
import { Activity, SessionSnapshot } from '../../../shared/types'
import { soundRegistry } from '../audio/soundRegistry'

export interface RoutinePlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  onResumeFocus: () => void;
}

export function RoutinePlayer({
  activity,
  snapshot,
  onResumeFocus
}: RoutinePlayerProps): React.JSX.Element {
  const { remainingMs, totalMs } = snapshot

  // Default steps fallback if routine has no steps defined
  const rawSteps = activity.steps && activity.steps.length > 0
    ? activity.steps
    : [
        { name: 'Shoulder rolls', seconds: 30 },
        { name: 'Neck rolls', seconds: 30 },
        { name: 'Wrist stretches', seconds: 30 },
        { name: 'Standing stretch', seconds: 30 }
      ]

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [stepSecondsRemaining, setStepSecondsRemaining] = useState<number>(rawSteps[0].seconds)

  const activeStep = rawSteps[currentStepIndex] || rawSteps[0]
  const nextStepIndex = (currentStepIndex + 1) % rawSteps.length
  const nextStep = rawSteps[nextStepIndex]

  // Track step timer
  const lastStepIndexRef = useRef<number>(currentStepIndex)
  lastStepIndexRef.current = currentStepIndex

  useEffect(() => {
    // Reset to step duration whenever current step changes
    setStepSecondsRemaining(rawSteps[currentStepIndex]?.seconds || 30)
  }, [currentStepIndex, rawSteps])

  useEffect(() => {
    const interval = setInterval(() => {
      setStepSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Play transition chime cue
          soundRegistry.playRoutineStepChime()
          // Advance to next step
          setCurrentStepIndex((curr) => (curr + 1) % rawSteps.length)
          return rawSteps[nextStepIndex]?.seconds || 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [rawSteps, nextStepIndex])

  // Overall rest timer formatting
  const overallSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const overallMins = Math.floor(overallSec / 60)
  const overallSecs = overallSec % 60
  const overallFormatted = `${String(overallMins).padStart(2, '0')}:${String(overallSecs).padStart(2, '0')}`

  // Overall rest progress percentage
  const overallProgressPct = totalMs > 0 ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0

  // Step ring animation
  const stepTotalSec = activeStep.seconds || 30
  const stepProgressPct = Math.min(1, Math.max(0, (stepTotalSec - stepSecondsRemaining) / stepTotalSec))
  const ringRadius = 110
  const circumference = 2 * Math.PI * ringRadius
  const strokeDashoffset = circumference * (1 - stepProgressPct)

  const handlePrevStep = () => {
    setCurrentStepIndex((curr) => (curr - 1 + rawSteps.length) % rawSteps.length)
  }

  const handleNextStep = () => {
    setCurrentStepIndex((curr) => (curr + 1) % rawSteps.length)
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between select-none z-10 font-mono">
      {/* Top Header: Left Activity Info + Top-Right Overall Rest Countdown */}
      <header className="w-full flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] border border-[var(--accent-line)] bg-[var(--accent-wash)] rounded-[3px]">
            Routine
          </span>
          <span className="text-[12px] text-[var(--text)] tracking-[0.08em] font-medium">
            {activity.name}
          </span>
        </div>

        {/* Top-Right Rest Timer Badge */}
        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_12px_rgba(0,0,0,0.5)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Rest timer
          </span>
          <span className="text-[13px] text-[var(--text)] tracking-[0.1em] font-medium tabular-nums text-shadow">
            {overallFormatted}
          </span>
        </div>
      </header>

      {/* Main Guided Routine Stage */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 z-10">
        {/* Step Index & Total */}
        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--accent)] mb-2 font-medium">
          Step {currentStepIndex + 1} of {rawSteps.length}
        </div>

        {/* Dynamic Prompt: "Time for shoulder rolls, 30 seconds" */}
        <h2 className="text-[24px] sm:text-[28px] font-medium tracking-[0.08em] uppercase text-[var(--text)] text-center mb-8 max-w-xl animate-[fadeRise_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          Time for {activeStep.name}
        </h2>

        {/* Circular Ring Timer */}
        <div className="relative flex items-center justify-center">
          <svg className="w-[260px] h-[260px] -rotate-90 pointer-events-none" viewBox="0 0 260 260">
            <circle
              cx="130"
              cy="130"
              r={ringRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="2"
            />
            <circle
              cx="130"
              cy="130"
              r={ringRadius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-300 ease-linear"
            />
          </svg>

          {/* Time Display Inside Ring */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[44px] font-light text-[var(--text)] tracking-[0.04em] tabular-nums drop-shadow-[0_0_16px_rgba(175,221,255,0.45)]">
              {stepSecondsRemaining}
              <span className="text-[20px] font-normal text-[var(--muted)] ml-0.5">s</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] mt-0.5">
              Step remaining
            </span>
          </div>
        </div>

        {/* Step Navigation & Next Up Preview */}
        <div className="mt-8 flex items-center gap-6">
          <button
            type="button"
            onClick={handlePrevStep}
            className="px-3 py-1 text-[11px] text-[var(--muted)] hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.02] rounded-full transition-all cursor-pointer"
            aria-label="Previous step"
          >
            ← Prev
          </button>

          <div className="text-[11.5px] text-[var(--muted)] tracking-[0.06em] text-center">
            Next: <span className="text-[var(--text)] font-medium">{nextStep.name}</span> ({nextStep.seconds}s)
          </div>

          <button
            type="button"
            onClick={handleNextStep}
            className="px-3 py-1 text-[11px] text-[var(--muted)] hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.02] rounded-full transition-all cursor-pointer"
            aria-label="Skip to next step"
          >
            Skip →
          </button>
        </div>

        {activity.note && (
          <p className="mt-6 text-[12px] text-[var(--muted)] tracking-[0.04em] text-center max-w-md">
            {activity.note}
          </p>
        )}
      </main>

      {/* Footer: Centered Esc reminder + Hairline Rest Progress */}
      <footer className="w-full flex flex-col z-20">
        <div className="w-full flex items-center justify-center px-8 py-3.5">
          <span className="text-[11px] text-[var(--muted)] tracking-[0.08em] select-none">
            Press Escape to escape.
          </span>
        </div>

        {/* 2px Hairline Progress Bar for Overall Rest */}
        <div className="w-full h-[2px] bg-[rgba(255,255,255,0.08)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 ease-out shadow-[0_0_8px_var(--accent)]"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>
      </footer>
    </div>
  )
}
