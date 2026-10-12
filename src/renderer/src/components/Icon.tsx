import React from 'react'

export type IconName =
  | 'all'
  | 'breathing'
  | 'custom'
  | 'youtube'
  | 'spotify'
  | 'x'
  | 'edit'
  | 'duplicate'
  | 'toggle'
  | 'focus'
  | 'activities'
  | 'settings'

interface IconProps {
  name: IconName | string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  switch (name) {
    case 'all':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
        </svg>
      )
    case 'breathing':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M3 9h11a3 3 0 1 0-3-3M3 15h14a3 3 0 1 1-3 3M3 12h7" />
        </svg>
      )
    case 'custom':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3" y="6" width="18" height="12" rx="4" />
          <path d="M10.5 9.5v5l4.2-2.5z" />
        </svg>
      )
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 9.5c3.5-1 7.5-.6 10.5 1.2M7.8 12.5c2.8-.8 6-.4 8.4 1M8.6 15.4c2.2-.6 4.5-.3 6.4.8" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
        </svg>
      )
    case 'duplicate':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M8 8h11v11H8zM5 16V5h11" />
        </svg>
      )
    case 'toggle':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
          <path d="M9.5 4.5v15" />
        </svg>
      )
    case 'focus':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'activities':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path d="M4 12h3l2.5-6 4 12 2.5-6H20" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6" />
        </svg>
      )
    default:
      return null
  }
}
