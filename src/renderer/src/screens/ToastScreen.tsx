import React, { useEffect, useState } from 'react'

export interface ToastScreenProps {
  type: string;
  toastId: string;
  label?: string;
  text?: string;
  durationMs?: number;
}

export const ToastScreen: React.FC<ToastScreenProps> = ({
  type,
  toastId,
  label: customLabel,
  text: customText,
  durationMs = 8000
}) => {
  const [draining, setDraining] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start progress bar drain immediately after mount
    const timer = setTimeout(() => {
      setDraining(true)
    }, 50)

    // Trigger exit animation before closing
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, durationMs - 400)

    return () => {
      clearTimeout(timer)
      clearTimeout(exitTimer)
    }
  }, [durationMs])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      if (window.toastApi?.dismiss) {
        window.toastApi.dismiss(toastId)
      } else if (window.revive?.toast?.dismiss) {
        window.revive.toast.dismiss(toastId)
      }
    }, 250)
  }

  // Determine icon, label, text based on type
  let iconSvg = (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
  let defaultLabel = 'Reminder'
  let defaultText = ''

  if (type === 'eyeBreak') {
    defaultLabel = 'Eye break'
    defaultText = 'Look at something far away for 20 seconds.'
    iconSvg = (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  } else if (type === 'drinkWater') {
    defaultLabel = 'Drink water'
    defaultText = 'Take a few sips. Your body will thank you.'
    iconSvg = (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    )
  } else if (type === 'restWarning') {
    defaultLabel = 'Rest in 1 minute'
    defaultText = 'Find a good stopping point. Revive will take over the screen soon.'
    iconSvg = (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }

  const displayLabel = customLabel || defaultLabel
  const displayText = customText || defaultText

  return (
    <div
      className={`toast-card ${isExiting ? 'toast-exiting' : 'toast-entering'}`}
      role="alert"
      aria-live="polite"
    >
      {/* Luminous Top Edge */}
      <div className="toast-luminous-edge" />

      {/* Main Content Row */}
      <div className="toast-inner">
        {/* Ringed Circle Icon */}
        <div className="toast-icon-ring">
          {iconSvg}
        </div>

        {/* Text Block */}
        <div className="toast-body">
          <div className="toast-caps-label">{displayLabel}</div>
          <div className="toast-text-line">{displayText}</div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          className="toast-close-btn"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>

      {/* 1px Draining Progress Bar */}
      <div className="toast-progress-track">
        <div
          className="toast-progress-fill"
          style={{
            transform: draining ? 'scaleX(0)' : 'scaleX(1)',
            transition: draining ? `transform ${durationMs}ms linear` : 'none'
          }}
        />
      </div>
    </div>
  )
}
