import React, { useState, useRef, useMemo } from 'react'
import { Activity, LibrarySettings } from '../../../shared/types'
import { FilterTiles, FilterCategory } from './FilterTiles'
import { ActivityRow } from './ActivityRow'
import { AddActivityForm } from './AddActivityForm'

interface ActivitiesScreenProps {
  library: LibrarySettings;
  pickForRestIndex: number | null;
  onSelectActivityForSlot: (activityId: string | null) => void;
  onCancelPick: () => void;
  onAddActivity: (
    input: Omit<Activity, 'id' | 'isBuiltIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  onUpdateActivity: (
    id: string,
    input: Omit<Activity, 'id' | 'isBuiltIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  onDuplicateActivity: (
    id: string
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  onDeleteActivity: (id: string) => Promise<void>;
  onSetDefault: (id: string | null) => Promise<void>;
}

export const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({
  library,
  pickForRestIndex,
  onSelectActivityForSlot,
  onCancelPick,
  onAddActivity,
  onUpdateActivity,
  onDuplicateActivity,
  onDeleteActivity,
  onSetDefault
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const isPicking = pickForRestIndex !== null
  const defaultId = library.defaults?.restActivityId ?? null

  const editingActivity = useMemo(() => {
    if (!editingActivityId) return null
    return (library.activities || []).find((a) => a.id === editingActivityId) || null
  }, [library.activities, editingActivityId])

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let items = (library.activities || []).filter((a) => {
      if (filter === 'all') return true
      return a.type === filter
    })

    // Sort: Default first, then insertion order
    return [...items].sort((a, b) => {
      const aIsDef = a.id === defaultId ? 1 : 0
      const bIsDef = b.id === defaultId ? 1 : 0
      return bIsDef - aIsDef
    })
  }, [library.activities, filter, defaultId])

  const handleToggleDefault = async (activityId: string) => {
    if (defaultId === activityId) {
      await onSetDefault(null)
    } else {
      await onSetDefault(activityId)
    }
  }

  const handleDelete = async (activityId: string) => {
    if (editingActivityId === activityId) {
      setEditingActivityId(null)
    }
    await onDeleteActivity(activityId)
  }

  const handleDuplicate = async (activityId: string) => {
    const res = await onDuplicateActivity(activityId)
    if (res.ok) {
      setEditingActivityId(res.activity.id)
      setTimeout(() => {
        const rowEl = document.getElementById(`activity-row-${res.activity.id}`)
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 50)
    }
  }

  const handleFormSuccess = (activity: Activity) => {
    if (editingActivity) {
      // Finished saving edits: keep current filter, scroll to row and highlight
      setEditingActivityId(null)
      setHighlightedId(activity.id)

      setTimeout(() => {
        const rowEl = document.getElementById(`activity-row-${activity.id}`)
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 50)

      setTimeout(() => {
        setHighlightedId(null)
      }, 1500)
    } else {
      // Finished adding: reset filter to all, scroll to bottom and highlight
      setFilter('all')
      setHighlightedId(activity.id)

      setTimeout(() => {
        if (listContainerRef.current) {
          listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight
        }
      }, 50)

      setTimeout(() => {
        setHighlightedId(null)
      }, 1500)
    }
  }

  return (
    <main className="main">
      {/* Top Strip: Filter Tiles */}
      <section className="card hero">
        <FilterTiles
          activities={library.activities || []}
          currentFilter={filter}
          onSelectFilter={setFilter}
        />
      </section>

      {/* Left Card: Your activities */}
      <section className="card">
        <h2>Your activities</h2>
        <p className="sub">Tap a tile above to filter. Set one as your default.</p>

        {/* Pick Mode Banner */}
        {isPicking && (
          <div className="pick" role="status">
            <span>Choosing for Rest {pickForRestIndex + 1}</span>
            <button
              type="button"
              className="pill"
              onClick={onCancelPick}
              aria-label="Cancel rest selection"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Activity Rows List */}
        <div className="list" ref={listContainerRef}>
          {filteredActivities.length > 0 ? (
            filteredActivities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                isDefault={a.id === defaultId}
                isPicking={isPicking}
                isHighlighted={a.id === highlightedId}
                isEditing={a.id === editingActivityId}
                onUse={() => onSelectActivityForSlot(a.id)}
                onToggleDefault={() => handleToggleDefault(a.id)}
                onEdit={() => setEditingActivityId(a.id)}
                onDuplicate={() => handleDuplicate(a.id)}
                onDelete={() => handleDelete(a.id)}
              />
            ))
          ) : (
            <p className="empty">Nothing here yet. Add one on the right.</p>
          )}
        </div>
      </section>

      {/* Right Card: Add / Edit activity */}
      <section className="card">
        {editingActivity ? (
          <>
            <h2>Edit activity</h2>
            <p className="sub">Editing &ldquo;{editingActivity.name}&rdquo;</p>
          </>
        ) : (
          <>
            <h2>Add activity</h2>
            <p className="sub">Pick a type, then fill it in.</p>
          </>
        )}

        <AddActivityForm
          editingActivity={editingActivity}
          onAddActivity={onAddActivity}
          onUpdateActivity={onUpdateActivity}
          onCancelEdit={() => setEditingActivityId(null)}
          onSuccess={handleFormSuccess}
        />
      </section>
    </main>
  )
}
