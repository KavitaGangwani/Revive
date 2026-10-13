import React from 'react'
import { Activity } from '../../../shared/types'
import { Icon } from './Icon'

export type FilterCategory = 'all' | 'built-in' | 'custom'

interface FilterTilesProps {
  activities: Activity[]
  currentFilter: FilterCategory
  onSelectFilter: (filter: FilterCategory) => void
}

const filterConfigs: { key: FilterCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'all' },
  { key: 'built-in', label: 'Built-in', icon: 'built-in' },
  { key: 'custom', label: 'Custom', icon: 'custom' }
]

export const FilterTiles: React.FC<FilterTilesProps> = ({
  activities,
  currentFilter,
  onSelectFilter
}) => {
  const getCount = (key: FilterCategory): number => {
    if (key === 'all') return activities.length
    if (key === 'built-in') return activities.filter((a) => a.builtIn || a.isBuiltIn).length
    if (key === 'custom') return activities.filter((a) => !a.builtIn && !a.isBuiltIn).length
    return 0
  }

  const handleClick = (key: FilterCategory): void => {
    if (currentFilter === key) {
      onSelectFilter('all')
    } else {
      onSelectFilter(key)
    }
  }

  return (
    <div
      className="tiles filter-tiles-strip"
      role="group"
      aria-label="Activity group filters"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        width: '100%'
      }}
    >
      {filterConfigs.map((f) => {
        const isSelected = currentFilter === f.key
        const count = getCount(f.key)

        return (
          <button
            type="button"
            key={f.key}
            className={`tile ${isSelected ? 'on' : ''}`}
            onClick={() => handleClick(f.key)}
            aria-pressed={isSelected}
            aria-label={`Filter by ${f.label} (${count} activities)`}
            style={{
              height: '62px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              border: isSelected ? '1px solid var(--accent-edge)' : '1px solid var(--hair)',
              background: isSelected ? 'var(--accent-wash)' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: isSelected ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={f.icon} style={{ width: '16px', height: '16px' }} />
            </div>
            <b
              style={{
                fontSize: '22px',
                lineHeight: 1,
                fontWeight: 400,
                color: 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 0 14px rgba(175, 221, 255, 0.45)'
              }}
            >
              {count}
            </b>
            <span
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: isSelected ? 'var(--accent)' : 'var(--muted)'
              }}
            >
              {f.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
