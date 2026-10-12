import { describe, it, expect, beforeEach } from 'vitest'
import { SessionEngine, Clock, TRANSITION_DURATION_MS } from '../sessionEngine'
import { SessionConfig, PersistedSessionState, SessionSnapshot } from '../../shared/types'

class MockClock implements Clock {
  public currentTime = 1000000
  private timers: { id: number; due: number; type: 'timeout' | 'interval'; ms: number; cb: () => void }[] = []
  private nextId = 1

  now(): number {
    return this.currentTime
  }

  setTimeout(cb: () => void, ms: number): number {
    const id = this.nextId++
    this.timers.push({ id, due: this.currentTime + ms, type: 'timeout', ms, cb })
    return id
  }

  clearTimeout(id: number): void {
    this.timers = this.timers.filter((t) => t.id !== id)
  }

  setInterval(cb: () => void, ms: number): number {
    const id = this.nextId++
    this.timers.push({ id, due: this.currentTime + ms, type: 'interval', ms, cb })
    return id
  }

  clearInterval(id: number): void {
    this.timers = this.timers.filter((t) => t.id !== id)
  }

  advanceTime(ms: number): void {
    const targetTime = this.currentTime + ms
    while (true) {
      // Find earliest timer due <= targetTime
      const dueTimers = this.timers
        .filter((t) => t.due <= targetTime)
        .sort((a, b) => a.due - b.due)

      if (dueTimers.length === 0) {
        this.currentTime = targetTime
        break
      }

      const earliest = dueTimers[0]
      this.currentTime = earliest.due
      if (earliest.type === 'timeout') {
        this.clearTimeout(earliest.id)
        earliest.cb()
      } else {
        earliest.due = this.currentTime + earliest.ms
        earliest.cb()
      }
    }
  }
}

describe('SessionEngine', () => {
  let clock: MockClock
  let snapshots: SessionSnapshot[]
  let persistedStates: (PersistedSessionState | null)[]
  let defaultActivityId: string | null = null

  beforeEach(() => {
    clock = new MockClock()
    snapshots = []
    persistedStates = []
    defaultActivityId = null
    delete process.env.STILL_DEV_SPEED
  })

  function createEngine(isPackaged = true) {
    return new SessionEngine({
      clock,
      isPackaged,
      onSnapshot: (s) => snapshots.push(s),
      onPersist: (p) => persistedStates.push(p),
      getDefaultRestActivityId: () => defaultActivityId
    })
  }

  it('clamps invalid configurations correctly', () => {
    const engine = createEngine()
    const clamped = engine.clampConfig({
      focusMinutes: 999, // max 180
      restMinutes: 0, // min 1
      loopCount: 20, // max 8
      restActivityIds: ['act-1']
    })

    expect(clamped.focusMinutes).toBe(180)
    expect(clamped.restMinutes).toBe(1)
    expect(clamped.loopCount).toBe(8)
    expect(clamped.restActivityIds[0]).toBe('act-1')
    expect(clamped.restActivityIds.length).toBe(8)

    const clampedMin = engine.clampConfig({
      focusMinutes: 1, // min 5
      restMinutes: 100, // max 60
      loopCount: 0 // min 1
    })

    expect(clampedMin.focusMinutes).toBe(5)
    expect(clampedMin.restMinutes).toBe(60)
    expect(clampedMin.loopCount).toBe(1)
  })

  it('executes a full 2-loop run accurately', () => {
    const engine = createEngine()
    const config: SessionConfig = {
      focusMinutes: 5,
      restMinutes: 2,
      loopCount: 2,
      restActivityIds: ['act-box', 'act-478', null, null, null, null, null, null]
    }

    // Start session
    const startSnap = engine.start(config)
    expect(startSnap.phase).toBe('focus')
    expect(startSnap.loopIndex).toBe(0)
    expect(startSnap.loopCount).toBe(2)
    expect(startSnap.remainingMs).toBe(5 * 60 * 1000)

    // Advance through Focus loop 0 (5 mins)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    expect(engine.getSnapshot().restActivityId).toBe('act-box')

    // Advance through Transition (1200ms)
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().remainingMs).toBe(2 * 60 * 1000)
    expect(engine.getSnapshot().restActivityId).toBe('act-box')

    // Advance through Rest loop 0 (2 mins)
    clock.advanceTime(2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Advance through Transition (1200ms)
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    expect(engine.getSnapshot().remainingMs).toBe(5 * 60 * 1000)

    // Advance through Focus loop 1 (5 mins)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    expect(engine.getSnapshot().restActivityId).toBe('act-478')

    // Advance through Transition (1200ms)
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Advance through Rest loop 1 (2 mins) -> should end session
    clock.advanceTime(2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('session-complete')
    expect(persistedStates[persistedStates.length - 1]).toBeNull()
  })

  it('handles skip-to-rest and forbids skipping outside focus', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 20, restMinutes: 5, loopCount: 1 })
    expect(engine.getSnapshot().phase).toBe('focus')

    // Advance 5 mins into focus
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().remainingMs).toBe(15 * 60 * 1000)

    // Skip to rest
    engine.skipToRest()
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')

    // Advance to rest
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Attempt skip while in rest (must be ignored)
    engine.skipToRest()
    expect(engine.getSnapshot().phase).toBe('rest')
  })

  it('resets correctly on anotherOne and doneForNow', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 10, restMinutes: 3, loopCount: 1 })
    clock.advanceTime(10 * 60 * 1000 + TRANSITION_DURATION_MS + 3 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('session-complete')

    // anotherOne starts focus immediately, reusing config
    const anotherSnap = engine.anotherOne()
    expect(anotherSnap.phase).toBe('focus')
    expect(anotherSnap.loopIndex).toBe(0)
    expect(anotherSnap.config.focusMinutes).toBe(10)

    // Complete session and test doneForNow
    clock.advanceTime(10 * 60 * 1000 + TRANSITION_DURATION_MS + 3 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('session-complete')

    const doneSnap = engine.doneForNow()
    expect(doneSnap.phase).toBe('idle')
    expect(persistedStates[persistedStates.length - 1]).toBeNull()
  })

  it('resolves restActivityId with fallback order: slot config -> default rest activity -> null', () => {
    defaultActivityId = 'act-default'
    const engine = createEngine()
    engine.start({
      focusMinutes: 10,
      restMinutes: 5,
      loopCount: 3,
      restActivityIds: ['act-chosen', null, null]
    })

    // Loop 0 has explicit 'act-chosen'
    engine.skipToRest()
    expect(engine.getSnapshot().restActivityId).toBe('act-chosen')

    clock.advanceTime(TRANSITION_DURATION_MS + 5 * 60 * 1000 + TRANSITION_DURATION_MS)
    // Now in loop 1 focus -> skip to rest
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    engine.skipToRest()
    // Loop 1 has null, so falls back to default 'act-default'
    expect(engine.getSnapshot().restActivityId).toBe('act-default')

    // Now remove default activity
    defaultActivityId = null
    clock.advanceTime(TRANSITION_DURATION_MS + 5 * 60 * 1000 + TRANSITION_DURATION_MS)
    // Now in loop 2 focus -> skip to rest
    expect(engine.getSnapshot().loopIndex).toBe(2)
    engine.skipToRest()
    // Loop 2 has null and default is null -> resolves to null
    expect(engine.getSnapshot().restActivityId).toBeNull()
  })

  it('resumes correctly when phase is still running vs when phase end has passed', () => {
    const engine = createEngine()
    const baseConfig: SessionConfig = {
      focusMinutes: 10,
      restMinutes: 5,
      loopCount: 2,
      restActivityIds: [null, null, null, null, null, null, null, null]
    }

    // 1. Resume when focus has 4 mins remaining
    const startTime = clock.now()
    const activeState: PersistedSessionState = {
      config: baseConfig,
      loopIndex: 0,
      phase: 'focus',
      phaseEndsAt: startTime + 4 * 60 * 1000
    }

    const resumed = engine.resumeFromPersisted(activeState)
    expect(resumed).toBe(true)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().remainingMs).toBe(4 * 60 * 1000)

    // 2. Resume when phaseEndsAt has already passed (e.g. system was asleep or app was closed)
    // Advance clock past the end
    clock.advanceTime(10 * 60 * 1000)
    const expiredState: PersistedSessionState = {
      config: baseConfig,
      loopIndex: 0,
      phase: 'focus',
      phaseEndsAt: clock.now() - 5000 // ended 5s ago
    }

    const resumedExpired = engine.resumeFromPersisted(expiredState)
    expect(resumedExpired).toBe(true)
    // Should advance to transition-to-rest starting now, NOT replaying old history
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    expect(engine.getSnapshot().remainingMs).toBe(TRANSITION_DURATION_MS)
  })

  it('scales speed when STILL_DEV_SPEED is set in non-packaged mode', () => {
    process.env.STILL_DEV_SPEED = '60'
    const engine = createEngine(false)
    expect(engine.getMsPerMinute()).toBe(1000)

    engine.start({ focusMinutes: 5, restMinutes: 1, loopCount: 1 })
    // 5 minutes should equal 5000ms
    expect(engine.getSnapshot().remainingMs).toBe(5000)

    clock.advanceTime(5000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
  })

  it('allows one snooze of 2 minutes during rest and prevents double snooze', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 2 })
    engine.skipToRest()
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Snooze for 2 minutes
    const snoozedSnap = engine.snooze(2)
    expect(snoozedSnap.phase).toBe('focus')
    expect(snoozedSnap.remainingMs).toBe(2 * 60 * 1000)
    expect(snoozedSnap.snoozeUsed).toBe(true)
    expect(snoozedSnap.isSnoozed).toBe(true)

    // Advance 2 minutes to end of snooze
    clock.advanceTime(2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Attempt second snooze in same rest cycle -> should be ignored
    const doubleSnoozeSnap = engine.snooze(2)
    expect(doubleSnoozeSnap.phase).toBe('rest')
  })

  it('handles resumeFocus early exit for soft-timed activities', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 2 })
    engine.skipToRest()
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Early exit
    const resumedSnap = engine.resumeFocus()
    expect(resumedSnap.phase).toBe('transition-to-focus')
    clock.advanceTime(TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
  })
})
