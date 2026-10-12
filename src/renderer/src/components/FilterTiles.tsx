import React from 'react'
import { Activity, ActivityType } from '../../../shared/types'
import { Icon } from './Icon'

export type FilterCategory = 'all' | ActivityType

interface FilterTilesProps {
  activities: Activity[];
  currentFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
}

const filterConfigs: { key: FilterCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'all' },
  { key: 'breathing', label: 'Breathing', icon: 'breathing' },
  { key: 'custom', label: 'Custom', icon: 'custom' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
  { key: 'spotify', label: 'Spotify', icon: 'spotify' }
]

export const FilterTiles: React.FC<FilterTilesProps> = ({
  activities,
  currentFilter,
  onSelectFilter
}) => {
  const getCount = (key: FilterCategory): number => {
    if (key === 'all') return activities.length
    return activities.filter((a) => a.type === key).length
  }

  const handleClick = (key: FilterCategory) => {
    if (currentFilter === key) {
      onSelectFilter('all')
    } else {
      onSelectFilter(key)
    }
  }

  return (
    <div className="tiles" role="group" aria-label="Activity category filters">
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
          >
            <Icon name={f.icon} />
            <b>{count}</b>
            <span>{f.label}</span>
          </button>
        )
      })}
    </div>
  )
}
