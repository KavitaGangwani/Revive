import React from 'react'

export type AppRoute = 'focus' | 'activities' | 'settings'

interface SidebarProps {
  currentRoute: AppRoute;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  collapsed,
  onToggleCollapse,
  onNavigate
}) => {
  return (
    <aside className="side">
      <div className="side-top">
        <button
          className="icon-btn"
          id="toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg viewBox="0 0 24 24">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M9.5 4.5v15" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        className={`nav ${currentRoute === 'focus' ? 'active' : ''}`}
        onClick={() => onNavigate('focus')}
        title="Focus"
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Focus</span>
      </button>

      <button
        type="button"
        className={`nav ${currentRoute === 'activities' ? 'active' : ''}`}
        onClick={() => onNavigate('activities')}
        title="Activities"
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 12h3l2.5-6 4 12 2.5-6H20" />
        </svg>
        <span>Activities</span>
      </button>

      <div className="spacer" />

      <button
        type="button"
        className={`nav ${currentRoute === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
        title="Settings"
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6" />
        </svg>
        <span>Settings</span>
      </button>
    </aside>
  )
}
