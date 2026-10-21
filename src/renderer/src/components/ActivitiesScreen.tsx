import React, { useState, useRef, useMemo } from 'react'
import { Activity, LibraryPayload } from '../../../shared/types'
import { FilterTiles, FilterCategory } from './FilterTiles'
import { ActivityRow } from './ActivityRow'
import { AddActivityForm } from './AddActivityForm'

interface ActivitiesScreenProps {
  library: LibraryPayload
  pickForRestIndex: number | null
  currentSlotActivityId?: string | null
  onSelectActivityForSlot: (activityId: string | null) => void
  onCancelPick: () => void
  onAddActivity: (
    input: Omit<Activity, 'id' | 'builtIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>
  onUpdateActivity: (
    id: string,
    input: Omit<Activity, 'id' | 'builtIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>
  onDeleteActivity: (id: string) => Promise<void>
  onSetDefault: (id: string | null) => Promise<void>
}

export const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({
  library,
  pickForRestIndex,
  currentSlotActivityId,
  onSelectActivityForSlot,
  onCancelPick,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onSetDefault
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  const isPicking = pickForRestIndex !== null
  const defaultId = library.defaultId ?? (library as any).defaults?.restActivityId ?? null

  const allActivities = library.activities || []

  // Split into built-in and custom groups
  const builtInActivities = useMemo(() => {
    const list = allActivities.filter((a) => Boolean(a.builtin || a.builtIn || a.isBuiltIn))
    return [...list].sort((a, b) => {
      const aIsDef = a.id === defaultId ? 1 : 0
      const bIsDef = b.id === defaultId ? 1 : 0
      return bIsDef - aIsDef
    })
  }, [allActivities, defaultId])

  const customActivities = useMemo(() => {
    const list = allActivities.filter((a) => !a.builtin && !a.builtIn && !a.isBuiltIn)
    return [...list].sort((a, b) => {
      const aIsDef = a.id === defaultId ? 1 : 0
      const bIsDef = b.id === defaultId ? 1 : 0
      return bIsDef - aIsDef
    })
  }, [allActivities, defaultId])

  const editingActivity = useMemo(() => {
    if (!editingActivityId) return null
    return allActivities.find((a) => a.id === editingActivityId) || null
  }, [allActivities, editingActivityId])

  const handleToggleDefault = async (activityId: string): Promise<void> => {
    if (defaultId === activityId) {
      await onSetDefault(null)
    } else {
      await onSetDefault(activityId)
    }
  }

  const handleDelete = async (activityId: string): Promise<void> => {
    if (editingActivityId === activityId) {
      setEditingActivityId(null)
    }
    await onDeleteActivity(activityId)
  }

  const handleFormSuccess = (activity: Activity): void => {
    if (editingActivityId) {
      // Finished editing
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
      // Finished adding
      setFilter('all')
      setHighlightedId(activity.id)

      setTimeout(() => {
        const rowEl = document.getElementById(`activity-row-${activity.id}`)
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        } else if (listContainerRef.current) {
          listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight
        }
      }, 50)

      setTimeout(() => {
        setHighlightedId(null)
      }, 1500)
    }
  }

  return (
    <main
      className="main activities-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        gap: '14px',
        padding: '48px 20px 16px 20px',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Top Strip: Filter Tiles (spans both columns) */}
      <section
        className="card hero"
        style={{
          gridColumn: '1 / -1',
          padding: '10px 12px',
          borderRadius: '18px',
          display: 'block'
        }}
      >
        <FilterTiles
          activities={allActivities}
          currentFilter={filter}
          onSelectFilter={setFilter}
        />
      </section>

      {/* Left Card: Your activities */}
      <section
        className="card your-activities-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          borderRadius: '20px',
          padding: '22px 18px',
          background: 'var(--surface)',
          border: '1px solid var(--hair)'
        }}
      >
        <h2>Your activities</h2>
        <p className="sub" style={{ margin: '4px 0 12px' }}>
          Build your own, and add a song or video to any of them.
        </p>

        {/* Pick Mode Banner */}
        {isPicking && (
          <div
            className="pick-banner"
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: '14px',
              border: '1px solid var(--accent-line)',
              background: 'var(--accent-wash)',
              marginBottom: '12px'
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent)'
              }}
            >
              Choosing for Rest {pickForRestIndex + 1}
            </span>
            <button
              type="button"
              className="pill"
              onClick={onCancelPick}
              aria-label="Cancel rest selection"
              style={{
                height: '22px',
                padding: '0 10px',
                fontSize: '10px',
                borderRadius: '999px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Scrollable list of activities */}
        <div
          className="list"
          ref={listContainerRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px'
          }}
        >
          {/* Section: All Filter */}
          {filter === 'all' && (
            <>
              {/* Built-in group (only if n > 0) */}
              {builtInActivities.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--muted)',
                      padding: '4px 4px 2px'
                    }}
                  >
                    <span>Built-in</span>
                    <span>{builtInActivities.length}</span>
                  </div>
                  {builtInActivities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      isDefault={a.id === defaultId}
                      isPicking={isPicking}
                      isChosen={currentSlotActivityId === a.id}
                      isHighlighted={a.id === highlightedId}
                      isEditing={a.id === editingActivityId}
                      onUse={() => onSelectActivityForSlot(a.id)}
                      onToggleDefault={() => handleToggleDefault(a.id)}
                    />
                  ))}
                </div>
              )}

              {/* Custom group (always) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--muted)',
                    padding: '4px 4px 2px'
                  }}
                >
                  <span>Custom</span>
                  <span>{customActivities.length}</span>
                </div>
                {customActivities.length > 0 ? (
                  customActivities.map((a) => (
                    <ActivityRow
                      key={a.id}
                      activity={a}
                      isDefault={a.id === defaultId}
                      isPicking={isPicking}
                      isChosen={currentSlotActivityId === a.id}
                      isHighlighted={a.id === highlightedId}
                      isEditing={a.id === editingActivityId}
                      onUse={() => onSelectActivityForSlot(a.id)}
                      onToggleDefault={() => handleToggleDefault(a.id)}
                      onEdit={() => setEditingActivityId(a.id)}
                      onDelete={() => handleDelete(a.id)}
                    />
                  ))
                ) : (
                  <p className="empty" style={{ fontSize: '11px', color: 'var(--faint)', textTransform: 'none', padding: '8px 4px' }}>
                    Nothing here yet. Build your own on the right.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Section: Built-in filter only */}
          {filter === 'built-in' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {builtInActivities.length > 0 ? (
                builtInActivities.map((a) => (
                  <ActivityRow
                    key={a.id}
                    activity={a}
                    isDefault={a.id === defaultId}
                    isPicking={isPicking}
                    isChosen={currentSlotActivityId === a.id}
                    isHighlighted={a.id === highlightedId}
                    isEditing={a.id === editingActivityId}
                    onUse={() => onSelectActivityForSlot(a.id)}
                    onToggleDefault={() => handleToggleDefault(a.id)}
                  />
                ))
              ) : (
                <p className="empty" style={{ fontSize: '11px', color: 'var(--faint)', textTransform: 'none', padding: '8px 4px' }}>
                  No built-in activities yet.
                </p>
              )}
            </div>
          )}

          {/* Section: Custom filter only */}
          {filter === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {customActivities.length > 0 ? (
                customActivities.map((a) => (
                  <ActivityRow
                    key={a.id}
                    activity={a}
                    isDefault={a.id === defaultId}
                    isPicking={isPicking}
                    isChosen={currentSlotActivityId === a.id}
                    isHighlighted={a.id === highlightedId}
                    isEditing={a.id === editingActivityId}
                    onUse={() => onSelectActivityForSlot(a.id)}
                    onToggleDefault={() => handleToggleDefault(a.id)}
                    onEdit={() => setEditingActivityId(a.id)}
                    onDelete={() => handleDelete(a.id)}
                  />
                ))
              ) : (
                <p className="empty" style={{ fontSize: '11px', color: 'var(--faint)', textTransform: 'none', padding: '8px 4px' }}>
                  Nothing here yet. Build your own on the right.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Right Card: Add / Edit activity form */}
      <AddActivityForm
        editingActivity={editingActivity}
        onAddActivity={onAddActivity}
        onUpdateActivity={onUpdateActivity}
        onCancelEdit={() => setEditingActivityId(null)}
        onSuccess={handleFormSuccess}
      />
    </main>
  )
}
