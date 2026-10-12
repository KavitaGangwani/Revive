import React, { useEffect, useRef } from 'react'

interface CloseNoticeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onChoice: (choice: 'hide' | 'quit') => void;
}

export const CloseNoticeModal: React.FC<CloseNoticeModalProps> = ({
  isOpen,
  onDismiss,
  onChoice
}) => {
  const gotItBtnRef = useRef<HTMLButtonElement | null>(null)
  const quitBtnRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Initial focus on Got it button when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        gotItBtnRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Handle ESC key and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
        return
      }

      if (e.key === 'Tab') {
        const focusableElements = [quitBtnRef.current, gotItBtnRef.current].filter(
          Boolean
        ) as HTMLElement[]
        if (focusableElements.length < 2) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onDismiss])

  if (!isOpen) return null

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss()
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="close-notice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-notice-title"
        aria-describedby="close-notice-desc"
      >
        {/* 1. 36px Round Icon Tile with Focus Icon */}
        <div className="close-notice-icon-tile" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        {/* 2. Heading */}
        <h2 id="close-notice-title" className="close-notice-title">
          Revive keeps running
        </h2>

        {/* 3. Body Text */}
        <p id="close-notice-desc" className="close-notice-body">
          Your session is still going, so Revive stays in the tray and your rest will
          arrive on time. To stop it, right-click the tray icon and choose Quit.
        </p>

        {/* 4. Action Buttons */}
        <div className="close-notice-actions">
          <button
            ref={quitBtnRef}
            type="button"
            className="notice-btn-ghost"
            onClick={() => onChoice('quit')}
          >
            Quit session
          </button>
          <button
            ref={gotItBtnRef}
            type="button"
            className="notice-btn-primary"
            onClick={() => onChoice('hide')}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
