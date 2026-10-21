import React, { useEffect, useRef } from 'react'

interface ResumeDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDiscard: () => void;
}

export const ResumeDialog: React.FC<ResumeDialogProps> = ({
  isOpen,
  onConfirm,
  onDiscard
}) => {
  const continueBtnRef = useRef<HTMLButtonElement | null>(null)
  const discardBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        continueBtnRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDiscard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onDiscard])

  if (!isOpen) return null

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDiscard()
        }
      }}
      role="presentation"
    >
      <div
        className="close-notice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-dialog-title"
        aria-describedby="resume-dialog-desc"
      >
        <div className="close-notice-icon-tile" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
          </svg>
        </div>

        <h2 id="resume-dialog-title" className="close-notice-title">
          Continue your session?
        </h2>

        <p id="resume-dialog-desc" className="close-notice-body">
          You have an active session from less than 10 minutes ago. Would you like to resume it, or start fresh?
        </p>

        <div className="close-notice-actions">
          <button
            ref={discardBtnRef}
            type="button"
            className="notice-btn-ghost"
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            ref={continueBtnRef}
            type="button"
            className="notice-btn-primary"
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
