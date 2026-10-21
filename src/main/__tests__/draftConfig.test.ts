import { describe, it, expect, beforeEach } from 'vitest'
import { getDraftConfig, saveDraftConfig, pruneDraftSlotChoicesOnStart, initStore } from '../store'

describe('Draft Session Config in Store', () => {
  beforeEach(() => {
    const store = initStore()
    // Reset draftConfig to null
    store.set('draftConfig', null)
  })

  it('uses defaults (30 / 5 / 2 with 2 slots) when nothing has ever been saved', () => {
    const draft = getDraftConfig()
    expect(draft.config.focusMinutes).toBe(30)
    expect(draft.config.restMinutes).toBe(5)
    expect(draft.config.loopCount).toBe(2)
    expect(draft.config.restActivityIds).toEqual([null, null])
  })

  it('saves changes immediately and retrieves them', () => {
    saveDraftConfig({
      focusMinutes: 15,
      restMinutes: 4,
      loopCount: 3,
      restActivityIds: ['act-a', 'act-b', 'act-c'],
      savedSlotChoices: ['act-a', 'act-b', 'act-c']
    })

    const draft = getDraftConfig()
    expect(draft.config.focusMinutes).toBe(15)
    expect(draft.config.restMinutes).toBe(4)
    expect(draft.config.loopCount).toBe(3)
    expect(draft.config.restActivityIds).toEqual(['act-a', 'act-b', 'act-c'])
  })

  it('changing rounds count keeps earlier choices when reducing and increasing rounds', () => {
    // User sets 4 rounds and selects 4 activities
    saveDraftConfig({
      focusMinutes: 25,
      restMinutes: 5,
      loopCount: 4,
      restActivityIds: ['act-1', 'act-2', 'act-3', 'act-4'],
      savedSlotChoices: ['act-1', 'act-2', 'act-3', 'act-4']
    })

    // User reduces rounds to 2
    const reduced = saveDraftConfig({
      focusMinutes: 25,
      restMinutes: 5,
      loopCount: 2,
      restActivityIds: ['act-1', 'act-2'],
      savedSlotChoices: ['act-1', 'act-2', 'act-3', 'act-4']
    })

    expect(reduced.config.loopCount).toBe(2)
    expect(reduced.config.restActivityIds).toEqual(['act-1', 'act-2'])
    expect(reduced.savedSlotChoices).toEqual(['act-1', 'act-2', 'act-3', 'act-4'])

    // User increases rounds back to 4 -> earlier choices act-3 and act-4 are restored
    const reIncreased = saveDraftConfig({
      focusMinutes: 25,
      restMinutes: 5,
      loopCount: 4,
      restActivityIds: ['act-1', 'act-2', 'act-3', 'act-4'],
      savedSlotChoices: reduced.savedSlotChoices
    })

    expect(reIncreased.config.loopCount).toBe(4)
    expect(reIncreased.config.restActivityIds).toEqual(['act-1', 'act-2', 'act-3', 'act-4'])
  })

  it('prunes choices beyond active loopCount only when Start is pressed', () => {
    saveDraftConfig({
      focusMinutes: 25,
      restMinutes: 5,
      loopCount: 2,
      restActivityIds: ['act-1', 'act-2'],
      savedSlotChoices: ['act-1', 'act-2', 'act-3', 'act-4']
    })

    pruneDraftSlotChoicesOnStart(2)

    const draft = getDraftConfig()
    expect(draft.savedSlotChoices).toEqual(['act-1', 'act-2'])
  })
})
