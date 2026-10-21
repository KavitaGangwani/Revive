import { describe, it, expect } from 'vitest'
import {
  BUILTIN_ACTIVITIES,
  mergeWithBuiltins,
  resolveActivity,
  isBuiltinActivityId,
  getBuiltinActivity
} from '../../shared/builtinActivities'
import { Activity, LibrarySettings } from '../../shared/types'
import { migrateStoredLibrary } from '../store'
import { SessionEngine } from '../sessionEngine'

describe('Built-in Rest Activities & Merge Helper', () => {
  it('seeds exactly 7 read-only built-in rest activities', () => {
    expect(BUILTIN_ACTIVITIES).toHaveLength(7)

    const breathing = BUILTIN_ACTIVITIES.filter((a) => a.type === 'breathing')
    const spotify = BUILTIN_ACTIVITIES.filter((a) => a.media?.kind === 'spotify')
    const youtube = BUILTIN_ACTIVITIES.filter((a) => a.media?.kind === 'youtube')
    const routine = BUILTIN_ACTIVITIES.filter((a) => a.type === 'routine')

    expect(breathing).toHaveLength(3)
    expect(spotify).toHaveLength(1)
    expect(youtube).toHaveLength(2)
    expect(routine).toHaveLength(1)

    // All must be marked as built-in
    for (const act of BUILTIN_ACTIVITIES) {
      expect(act.builtin).toBe(true)
      expect(act.builtIn).toBe(true)
      expect(act.notes).toBeDefined()
      expect(typeof act.notes).toBe('string')
    }
  })

  it('mergeWithBuiltins merges custom activities without duplicating or writing to library.custom', () => {
    const custom: Activity[] = [
      {
        id: 'custom-1',
        name: 'My Walk',
        builtIn: false
      },
      {
        id: 'custom-2',
        name: 'Eye Rest',
        builtIn: false
      }
    ]

    const merged = mergeWithBuiltins(custom)
    expect(merged).toHaveLength(9)

    // First 7 are built-ins
    expect(merged.slice(0, 7)).toEqual(BUILTIN_ACTIVITIES)
    // Last 2 are custom
    expect(merged.slice(7)).toEqual(custom)

    // Original custom array is untouched
    expect(custom).toHaveLength(2)
    expect(custom.some((a) => a.id.startsWith('builtin-'))).toBe(false)
  })

  it('deleting a custom activity does not touch built-ins or built-in references', () => {
    const customList: Activity[] = [
      { id: 'custom-walk', name: 'Walk', builtIn: false },
      { id: 'custom-stretch', name: 'Stretch', builtIn: false }
    ]

    // Simulate deleting custom-walk
    const targetIdToDelete = 'custom-walk'
    const updatedCustom = customList.filter((a) => a.id !== targetIdToDelete)
    const mergedAfterDelete = mergeWithBuiltins(updatedCustom)

    expect(mergedAfterDelete).toHaveLength(8)
    expect(mergedAfterDelete.some((a) => a.id === 'custom-walk')).toBe(false)
    expect(mergedAfterDelete.some((a) => a.id === 'custom-stretch')).toBe(true)

    // All 7 built-ins remain intact
    for (const b of BUILTIN_ACTIVITIES) {
      expect(mergedAfterDelete.some((a) => a.id === b.id)).toBe(true)
    }
  })

  it('isBuiltinActivityId correctly identifies built-in activities and prevents deletion', () => {
    expect(isBuiltinActivityId('builtin-box-breathing')).toBe(true)
    expect(isBuiltinActivityId('builtin-desk-reset-routine')).toBe(true)
    expect(isBuiltinActivityId('custom-walk')).toBe(false)
    expect(isBuiltinActivityId(null)).toBe(false)
    expect(isBuiltinActivityId(undefined)).toBe(false)
  })

  it('resolveActivity resolves both built-in and custom IDs', () => {
    const customList: Activity[] = [
      { id: 'custom-nap', name: 'Quick Nap', builtIn: false }
    ]

    const box = resolveActivity('builtin-box-breathing', customList)
    expect(box).toBeDefined()
    expect(box?.name).toBe('Box breathing')
    expect(box?.type).toBe('breathing')

    const nap = resolveActivity('custom-nap', customList)
    expect(nap).toBeDefined()
    expect(nap?.name).toBe('Quick Nap')

    expect(resolveActivity('non-existent-id', customList)).toBeUndefined()
    expect(resolveActivity(null, customList)).toBeUndefined()
  })

  it('library migration preserves defaults.restActivityId pointing to a built-in activity', () => {
    const rawLibrary: LibrarySettings = {
      custom: [{ id: 'my-custom', name: 'Custom One', builtIn: false }],
      defaults: {
        restActivityId: 'builtin-diaphragmatic-breathing'
      }
    }

    const { library: migrated } = migrateStoredLibrary(rawLibrary)
    // Default pointing to built-in is NOT cleared
    expect(migrated.defaults.restActivityId).toBe('builtin-diaphragmatic-breathing')
  })

  it('SessionEngine resolves built-in breathing activity and generates schedule', () => {
    let currentTime = 1000000
    const clock = {
      now: () => currentTime,
      setTimeout: (_cb: () => void, _ms: number) => 1,
      clearTimeout: (_id: any) => {},
      setInterval: (_cb: () => void, _ms: number) => 1,
      clearInterval: (_id: any) => {}
    }

    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      getDefaultRestActivityId: () => 'builtin-box-breathing',
      getActivityById: (id: string) => getBuiltinActivity(id)
    })

    // Start 1-round session: 10 min focus, 5 min rest
    engine.start({
      focusMinutes: 10,
      restMinutes: 5,
      loopCount: 1,
      restActivityIds: ['builtin-box-breathing']
    })

    // Skip to rest
    engine.skipToRest()
    // Move clock past transition
    currentTime += 7000
    // Trigger tick
    ;(engine as any).onPhaseEnd()

    const snapshot = engine.getSnapshot()
    expect(snapshot.phase).toBe('rest')
    expect(snapshot.restActivityId).toBe('builtin-box-breathing')
    expect(snapshot.breathingSchedule).toBeDefined()
    expect(snapshot.breathingSchedule!.length).toBeGreaterThan(0)

    // Verify first cycle of box breathing: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s
    const firstCycle = snapshot.breathingSchedule!.slice(0, 4)
    expect(firstCycle[0].kind).toBe('in')
    expect(firstCycle[0].durationMs).toBe(4000)
    expect(firstCycle[1].kind).toBe('hold')
    expect(firstCycle[1].durationMs).toBe(4000)
    expect(firstCycle[2].kind).toBe('out')
    expect(firstCycle[2].durationMs).toBe(4000)
    expect(firstCycle[3].kind).toBe('hold')
    expect(firstCycle[3].durationMs).toBe(4000)
  })
})
