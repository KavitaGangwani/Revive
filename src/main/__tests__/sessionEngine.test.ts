import { describe, it, expect, beforeEach } from 'vitest'
import {
  SessionEngine,
  Clock,
  TRANSITION_SECONDS,
  INTRO_TRANSITION_MS,
  FOCUS_TRANSITION_NO_NOTE_MS,
  FOCUS_TRANSITION_WITH_NOTE_MS
} from '../sessionEngine'
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

    // Advance through Intro Transition (6000ms)
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().remainingMs).toBe(2 * 60 * 1000)
    expect(engine.getSnapshot().restActivityId).toBe('act-box')

    // Advance through Rest loop 0 (2 mins)
    clock.advanceTime(2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Advance through Focus Transition (4000ms)
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    expect(engine.getSnapshot().remainingMs).toBe(5 * 60 * 1000)

    // Advance through Focus loop 1 (5 mins)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    expect(engine.getSnapshot().restActivityId).toBe('act-478')

    // Advance through Intro Transition (6000ms)
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Advance through Rest loop 1 (2 mins) -> should end session
    clock.advanceTime(2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
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
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Attempt skip while in rest (must be ignored)
    engine.skipToRest()
    expect(engine.getSnapshot().phase).toBe('rest')
  })

  it('resets correctly on anotherOne and doneForNow', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 10, restMinutes: 3, loopCount: 1 })
    clock.advanceTime(10 * 60 * 1000 + INTRO_TRANSITION_MS + 3 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')

    // anotherOne starts focus immediately, reusing config
    const anotherSnap = engine.anotherOne()
    expect(anotherSnap.phase).toBe('focus')
    expect(anotherSnap.loopIndex).toBe(0)
    expect(anotherSnap.config.focusMinutes).toBe(10)

    // Complete session and test doneForNow
    clock.advanceTime(10 * 60 * 1000 + INTRO_TRANSITION_MS + 3 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')

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

    clock.advanceTime(INTRO_TRANSITION_MS + 5 * 60 * 1000 + FOCUS_TRANSITION_NO_NOTE_MS)
    // Now in loop 1 focus -> skip to rest
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    engine.skipToRest()
    // Loop 1 has null, so falls back to default 'act-default'
    expect(engine.getSnapshot().restActivityId).toBe('act-default')

    // Now remove default activity
    defaultActivityId = null
    clock.advanceTime(INTRO_TRANSITION_MS + 5 * 60 * 1000 + FOCUS_TRANSITION_NO_NOTE_MS)
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
    expect(engine.getSnapshot().remainingMs).toBe(INTRO_TRANSITION_MS)
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
    clock.advanceTime(INTRO_TRANSITION_MS)
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
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Attempt second snooze in same rest cycle -> should be ignored
    const doubleSnoozeSnap = engine.snooze(2)
    expect(doubleSnoozeSnap.phase).toBe('rest')
  })

  it('handles resumeFocus early exit for soft-timed activities', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 2 })
    engine.skipToRest()
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Early exit
    const resumedSnap = engine.resumeFocus()
    expect(resumedSnap.phase).toBe('transition-to-focus')
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
  })

  it('treats minutes as seconds when STILL_DEV_FAST=1 in unpackaged mode', () => {
    const origEnv = process.env.STILL_DEV_FAST
    process.env.STILL_DEV_FAST = '1'
    try {
      const engine = createEngine(false)
      expect(engine.getMsPerMinute()).toBe(1000)

      const snap = engine.start({ focusMinutes: 5, restMinutes: 2, loopCount: 1 })
      expect(snap.remainingMs).toBe(5000) // 5 seconds instead of 5 minutes!
    } finally {
      if (origEnv !== undefined) {
        process.env.STILL_DEV_FAST = origEnv
      } else {
        delete process.env.STILL_DEV_FAST
      }
    }
  })

  it('sizes restActivityIds to loopCount (one entry per round)', () => {
    const engine = createEngine()
    const config = engine.clampConfig({
      focusMinutes: 10,
      restMinutes: 5,
      loopCount: 3,
      restActivityIds: ['act1', 'act2', 'act3', 'act4', 'act5']
    })
    expect(config.restActivityIds.length).toBe(3)
    expect(config.restActivityIds).toEqual(['act1', 'act2', 'act3'])
  })

  it('persists savedAt timestamp in persisted state', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 25, restMinutes: 5, loopCount: 2 })
    const lastPersisted = persistedStates[persistedStates.length - 1]
    expect(lastPersisted).toBeTruthy()
    expect(lastPersisted?.savedAt).toBe(clock.currentTime)
  })

  it('fires rest warning 90 seconds before focus ends for normal focus duration', () => {
    let warningFired = false
    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      onRestWarning: () => {
        warningFired = true
      }
    })
    // 5 minutes focus = 300,000 ms. 90s = 90,000 ms.
    // Warning fires at 300,000 - 90,000 = 210,000 ms.
    engine.start({ focusMinutes: 5, restMinutes: 2, loopCount: 1 })
    expect(warningFired).toBe(false)

    clock.advanceTime(209000)
    expect(warningFired).toBe(false)

    clock.advanceTime(2000)
    expect(warningFired).toBe(true)
  })

  it('fires rest warning at half the focus time if focus duration is shorter than 90 seconds', () => {
    let warningFired = false
    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      onRestWarning: () => {
        warningFired = true
      }
    })

    // Start with a short focus duration of 40,000 ms (< 90s = 90,000 ms)
    ;(engine as any).transitionTo('focus', 40000)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().remainingMs).toBe(40000)

    // Warning should fire at half the focus time: 40,000 / 2 = 20,000 ms before end
    // That is, after 20,000 ms has elapsed in this focus period
    clock.advanceTime(19000)
    expect(warningFired).toBe(false)

    clock.advanceTime(2000)
    expect(warningFired).toBe(true)
  })

  it('manages leftOffNote lifecycle and backToWork in transition-to-focus', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 5, restMinutes: 2, loopCount: 2 })

    // Set left off note
    engine.setLeftOffNote('Working on user authentication logic')
    expect(engine.getSnapshot().leftOffNote).toBe('Working on user authentication logic')

    // Persisted state includes leftOffNote
    const lastPersisted = persistedStates[persistedStates.length - 1]
    expect(lastPersisted?.leftOffNote).toBe('Working on user authentication logic')

    // Move to rest
    engine.skipToRest()
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Rest ends (advance 2 minutes = 120,000ms)
    clock.advanceTime(120000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')
    expect(engine.getSnapshot().leftOffNote).toBe('Working on user authentication logic')

    // Because note is present, it does NOT auto-advance past transition-to-focus
    clock.advanceTime(10000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')

    // User clicks "Back to work"
    const snap = engine.backToWork()
    expect(snap.phase).toBe('focus')
    expect(snap.loopIndex).toBe(1)
    expect(snap.leftOffNote).toBeFalsy()

    // Clear on doneForNow
    engine.setLeftOffNote('Another note')
    expect(engine.getSnapshot().leftOffNote).toBe('Another note')
    engine.doneForNow()
    expect(engine.getSnapshot().leftOffNote).toBeFalsy()
  })

  it('runs a 4-round session start to finish including one skip and one snooze, ensuring all 4 focus phases and 4 rests happen in order', () => {
    const history: { phase: string; loopIndex: number }[] = []
    let lastRecorded = ''

    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      onSnapshot: (snap) => {
        const key = `${snap.phase}-${snap.loopIndex}`
        if (key !== lastRecorded) {
          lastRecorded = key
          history.push({ phase: snap.phase, loopIndex: snap.loopIndex })
        }
      }
    })

    // 4 rounds: 10m focus, 5m rest
    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 4 })

    // Round 1 (loopIndex 0): Focus 10 min. At 510,000ms warning fires.
    clock.advanceTime(510000)
    // Snooze 5 min during focus
    engine.snooze(5)
    expect(engine.getSnapshot().remainingMs).toBe(90000 + 300000)

    // Complete remaining focus (390,000ms)
    clock.advanceTime(390000)
    // Intro transition (6000ms)
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Complete Round 1 Rest (5 min)
    clock.advanceTime(5 * 60 * 1000)
    // Transition to focus (4000ms)
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)

    // Round 2 (loopIndex 1): Focus. Run 2 min then skip to rest
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    clock.advanceTime(2 * 60 * 1000)
    engine.skipToRest()
    // Intro transition (6000ms)
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Complete Round 2 Rest (5 min)
    clock.advanceTime(5 * 60 * 1000)
    // Transition to focus (4000ms)
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)

    // Round 3 (loopIndex 2): Focus (10 min)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(2)
    clock.advanceTime(10 * 60 * 1000)
    // Intro transition (6000ms)
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(2)

    // Complete Round 3 Rest (5 min)
    clock.advanceTime(5 * 60 * 1000)
    // Transition to focus (4000ms)
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)

    // Round 4 (loopIndex 3): Focus (10 min)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(3)
    clock.advanceTime(10 * 60 * 1000)
    // Intro transition (6000ms)
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(3)

    // Complete Round 4 Rest (5 min) -> session complete!
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
    expect(engine.getSnapshot().remainingMs).toBe(0)

    // Extract all focus and rest phases from history
    const focusPhases = history.filter((h) => h.phase === 'focus')
    const restPhases = history.filter((h) => h.phase === 'rest')

    expect(focusPhases).toEqual([
      { phase: 'focus', loopIndex: 0 },
      { phase: 'focus', loopIndex: 1 },
      { phase: 'focus', loopIndex: 2 },
      { phase: 'focus', loopIndex: 3 }
    ])

    expect(restPhases).toEqual([
      { phase: 'rest', loopIndex: 0 },
      { phase: 'rest', loopIndex: 1 },
      { phase: 'rest', loopIndex: 2 },
      { phase: 'rest', loopIndex: 3 }
    ])
  })

  it('focus 10 min, snooze 5: asserts phaseEndsAt moved by 5 min and the warning re-armed', () => {
    let warningFiredCount = 0
    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      onRestWarning: () => {
        warningFiredCount++
      }
    })

    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 2 })
    expect(engine.getSnapshot().remainingMs).toBe(10 * 60 * 1000)

    // Advance 510,000ms (90 seconds before 600,000ms end) -> warning fires
    clock.advanceTime(510000)
    expect(warningFiredCount).toBe(1)
    expect(engine.getSnapshot().remainingMs).toBe(90000)

    // Snooze 5 minutes (300,000ms)
    const snoozedSnap = engine.snooze(5)
    // Remaining time must now be 90,000 + 300,000 = 390,000ms
    expect(snoozedSnap.phase).toBe('focus')
    expect(snoozedSnap.remainingMs).toBe(390000)
    expect(snoozedSnap.snoozeUsed).toBe(true)

    // Advance 100,000ms past the old end time (which would have been at 600,000ms = 90,000ms after snooze)
    clock.advanceTime(100000)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(warningFiredCount).toBe(1)

    // Advance to 90 seconds before the new end (total focus is 15m = 900,000ms; warning fires at 810,000ms)
    // Current time: 510,000 + 100,000 = 610,000ms.
    // Need 200,000ms more to reach 810,000ms:
    clock.advanceTime(200000)
    expect(warningFiredCount).toBe(2)

    // Double snooze in the same focus round must be ignored
    const doubleSnoozeSnap = engine.snooze(5)
    expect(doubleSnoozeSnap.remainingMs).toBe(engine.getSnapshot().remainingMs)
  })

  // --- Round Transition & Authority Tests ---

  it('a) rounds=1: focus -> skip -> rest ends -> idle (no new focus)', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 25, restMinutes: 5, loopCount: 1 })
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Skip focus to rest
    engine.skipToRest()
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Rest ends (5 minutes)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
    expect(engine.getSnapshot().remainingMs).toBe(0)

    // Advance more time to prove no new focus round starts
    clock.advanceTime(10 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
  })

  it('b) rounds=1: focus ends naturally -> rest ends -> idle', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 25, restMinutes: 5, loopCount: 1 })
    expect(engine.getSnapshot().phase).toBe('focus')

    // Focus ends naturally (25 minutes)
    clock.advanceTime(25 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Rest ends naturally (5 minutes)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
    expect(engine.getSnapshot().remainingMs).toBe(0)

    // Prove idle remains
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
  })

  it('c) rounds=2: skip focus in round 1 -> rest -> focus (round 2) -> rest -> idle', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 25, restMinutes: 5, loopCount: 2 })
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Skip focus in round 1
    engine.skipToRest()
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Rest in round 1 ends -> advances to focus transition
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)

    // Round 2 focus begins
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Round 2 focus ends naturally
    clock.advanceTime(25 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Round 2 rest ends -> session ends (idle)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
  })

  it('d) rounds=3: skip rest in round 2 -> still 3 rounds total', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 20, restMinutes: 5, loopCount: 3 })
    expect(engine.getSnapshot().loopCount).toBe(3)

    // Round 1 (loopIndex 0): focus ends -> intro -> rest
    clock.advanceTime(20 * 60 * 1000 + INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Round 1 rest ends -> transition-to-focus -> Round 2 focus
    clock.advanceTime(5 * 60 * 1000 + FOCUS_TRANSITION_NO_NOTE_MS)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Round 2 focus ends -> intro -> Round 2 rest
    clock.advanceTime(20 * 60 * 1000 + INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Skip rest in round 2
    engine.resumeFocus()
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')
    expect(engine.getSnapshot().loopIndex).toBe(2)
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)

    // Round 3 focus begins; loopCount is STILL 3
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(2)
    expect(engine.getSnapshot().loopCount).toBe(3)

    // Round 3 focus ends -> intro -> rest
    clock.advanceTime(20 * 60 * 1000 + INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(2)

    // Round 3 rest ends -> idle
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
  })

  it('e) restore from persistedSession mid-rest with rounds=1 -> idle after rest', () => {
    const engine = createEngine()
    const now = clock.now()
    const persisted: PersistedSessionState = {
      phase: 'rest',
      loopIndex: 0,
      phaseEndsAt: now + 3 * 60 * 1000,
      savedAt: now,
      config: {
        focusMinutes: 25,
        restMinutes: 5,
        loopCount: 1,
        restActivityIds: [null]
      }
    }

    const restored = engine.resumeFromPersisted(persisted)
    expect(restored).toBe(true)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)
    expect(engine.getSnapshot().loopCount).toBe(1)

    // Rest ends (3 minutes)
    clock.advanceTime(3 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
    expect(engine.getSnapshot().remainingMs).toBe(0)

    // Prove no new focus starts
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
  })

  it('transition countdowns are 5 seconds and never show on final rest end', () => {
    expect(TRANSITION_SECONDS).toBe(5)
    expect(INTRO_TRANSITION_MS).toBe(5000)
    expect(FOCUS_TRANSITION_NO_NOTE_MS).toBe(5000)

    const engine = createEngine()
    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 2 })

    // Advance to focus end -> transition-to-rest
    clock.advanceTime(10 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')
    expect(engine.getSnapshot().remainingMs).toBe(5000)
    expect(Math.ceil(engine.getSnapshot().remainingMs / 1000)).toBe(5)

    clock.advanceTime(2000)
    expect(Math.ceil(engine.getSnapshot().remainingMs / 1000)).toBe(3)

    clock.advanceTime(3000)
    expect(engine.getSnapshot().phase).toBe('rest')

    // Rest round 1 finishes -> transition-to-focus (round 2 follows)
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')
    expect(engine.getSnapshot().remainingMs).toBe(5000)
    expect(Math.ceil(engine.getSnapshot().remainingMs / 1000)).toBe(5)

    clock.advanceTime(5000)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)
    // Starts completely from the start with full 10 minutes
    expect(engine.getSnapshot().remainingMs).toBe(10 * 60 * 1000)

    // Complete round 2 focus -> transition-to-rest -> rest round 2
    clock.advanceTime(10 * 60 * 1000 + INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Last round rest ends -> engine immediately ends session (idle); NO transition-to-focus
    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('idle')
    expect(engine.getSnapshot().phase).not.toBe('transition-to-focus')
  })

  it('proves that after skipping to rest, the next focus session starts fresh from the beginning', () => {
    const engine = createEngine()
    engine.start({ focusMinutes: 25, restMinutes: 5, loopCount: 2 })

    // Skip after 5 minutes (leaving 20 mins of focus)
    clock.advanceTime(5 * 60 * 1000)
    engine.skipToRest()
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')

    // Begin rest and advance through rest
    clock.advanceTime(INTRO_TRANSITION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')

    clock.advanceTime(5 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('transition-to-focus')

    // Advance into round 2 focus
    clock.advanceTime(FOCUS_TRANSITION_NO_NOTE_MS)
    expect(engine.getSnapshot().phase).toBe('focus')
    expect(engine.getSnapshot().loopIndex).toBe(1)

    // Must be full 25 minutes, NOT 20 minutes from the old session
    expect(engine.getSnapshot().remainingMs).toBe(25 * 60 * 1000)
  })
})


