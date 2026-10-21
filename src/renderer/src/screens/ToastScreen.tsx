import React, { useEffect, useState, useRef } from 'react'
import { REST_WARNING_SECONDS } from '../../../shared/types'
import chimeSoundUrl from '../../../../assets/sounds/notification-chime.wav'

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
  const [note, setNote] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSavedTick, setShowSavedTick] = useState(false)

  const queryParams = new URLSearchParams(window.location.search)
  const canSnoozeParam = queryParams.get('canSnooze') !== 'false'
  const [snoozeUsed, setSnoozeUsed] = useState(false)

  const cardRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const savedTimerRef = useRef<any>(null)

  useEffect(() => {
    document.body.style.background = 'transparent'
  }, [])

  // Dynamic measuring and window resize
  useEffect(() => {
    if (!cardRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.ceil(
          entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height
        )
        if (height > 0) {
          window.toastApi?.resize?.(toastId, 380, height)
        }
      }
    })
    ro.observe(cardRef.current)
    return () => ro.disconnect()
  }, [toastId])

  useEffect(() => {
    // Play chime sound whenever rest warning notification arrives
    if (type === 'restWarning') {
      const playChime = async () => {
        try {
          const settings = await window.settingsApi?.getSettings()
          const enabled = settings?.sound?.notificationSounds ?? true
          if (enabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch((err) => {
              console.warn('[ToastScreen] HTML5 audio play failed:', err)
            })
          }
        } catch (err) {
          console.warn('[ToastScreen] Failed to read settings or play chime:', err)
        }
      }
      playChime()
    }
  }, [type])

  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    // If the input has focus or text (and has not been submitted), do not auto-dismiss!
    if (type === 'restWarning' && !isSubmitted && (isFocused || note.length > 0)) {
      setDraining(false)
      setIsExiting(false)
      if (window.toastApi?.keepOpen) {
        window.toastApi.keepOpen(toastId)
      }
      return
    }

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
  }, [durationMs, type, isFocused, note, toastId, isSubmitted])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 200)
    setNote(val)
    if (window.toastApi?.keepOpen) {
      window.toastApi.keepOpen(toastId)
    }
    const api = window.revive || window.still
    api?.session?.setLeftOffNote?.(val)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    if (window.toastApi?.keepOpen) {
      window.toastApi.keepOpen(toastId)
    }
  }

  const handleInputBlur = () => {
    setIsFocused(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const api = window.revive || window.still
      api?.session?.setLeftOffNote?.(note)
      inputRef.current?.blur()
      setIsFocused(false)
      setIsSubmitted(true)
      setShowSavedTick(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => {
        handleDismiss()
      }, 350)
    }
  }

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

  const handleSnooze = async () => {
    setSnoozeUsed(true)
    setIsExiting(true)
    try {
      if (window.toastApi?.snooze) {
        await window.toastApi.snooze()
      } else if (window.revive?.session?.snooze) {
        await window.revive.session.snooze()
      }
    } catch (err) {
      console.error('Failed to snooze from toast:', err)
    }
    setTimeout(() => {
      if (window.toastApi?.dismiss) {
        window.toastApi.dismiss(toastId)
      } else if (window.revive?.toast?.dismiss) {
        window.revive.toast.dismiss(toastId)
      }
    }, 200)
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
    defaultLabel = `Rest in ${REST_WARNING_SECONDS} seconds`
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
      ref={cardRef}
      className={`toast-card ${type === 'restWarning' ? 'toast-warning-card' : ''} ${
        isExiting ? 'toast-exiting' : 'toast-entering'
      }`}
      role="alert"
      aria-live="polite"
    >
      {/* HTML5 audio element for notification chime */}
      <audio ref={audioRef} src={chimeSoundUrl} preload="auto" />

      {/* Luminous Top Edge */}
      <div className="toast-luminous-edge" />

      {/* Main Content Row */}
      <div className="toast-inner">
        {/* Ringed Circle Icon */}
        <div className="toast-icon-ring">{iconSvg}</div>

        {/* Text Block */}
        <div className="toast-body">
          <div className="toast-caps-label">{displayLabel}</div>
          <div className="toast-text-line">{displayText}</div>
        </div>

        {/* Snooze Button for Rest Warning */}
        {type === 'restWarning' && canSnoozeParam && !snoozeUsed && (
          <button
            type="button"
            className="toast-snooze-btn"
            onClick={handleSnooze}
            aria-label="Snooze rest takeover"
          >
            Snooze
          </button>
        )}

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

      {/* Optional single-line input for rest warning */}
      {type === 'restWarning' && (
        <div className="toast-note-container">
          <input
            ref={inputRef}
            type="text"
            className="toast-note-input"
            placeholder="Where are you leaving off?"
            maxLength={200}
            value={note}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            aria-label="Where are you leaving off?"
          />
          {showSavedTick && (
            <div className="toast-saved-badge">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>Saved</span>
            </div>
          )}
        </div>
      )}

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
