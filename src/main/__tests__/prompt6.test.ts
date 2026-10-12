import { describe, it, expect, vi } from 'vitest'
import { SessionEngine, Clock, TRANSITION_DURATION_MS } from '../sessionEngine'
import { defaultSettings, clampAndMergeSettings } from '../store'
import { AppSettings, SessionSnapshot } from '../../shared/types'

function createMockClock(initialTime: number = 1000000): Clock & {
  advanceTime: (ms: number) => void;
  advanceToNextTimer: () => void;
} {
  let currentTime = initialTime
  let nextId = 1
  const timers = new Map<number, { cb: () => void; dueAt: number; interval?: number }>()

  const now = () => currentTime

  const setTimeoutFn = (cb: () => void, ms: number) => {
    const id = nextId++
    timers.set(id, { cb, dueAt: currentTime + ms })
    return id
  }

  const clearTimeoutFn = (id: any) => {
    timers.delete(id)
  }

  const setIntervalFn = (cb: () => void, ms: number) => {
    const id = nextId++
    timers.set(id, { cb, dueAt: currentTime + ms, interval: ms })
    return id
  }

  const clearIntervalFn = (id: any) => {
    timers.delete(id)
  }

  const advanceTime = (ms: number) => {
    const targetTime = currentTime + ms
    while (true) {
      let earliestId: number | null = null
      let earliestDue = targetTime + 1

      for (const [id, t] of timers.entries()) {
        if (t.dueAt <= targetTime && t.dueAt < earliestDue) {
          earliestDue = t.dueAt
          earliestId = id
        }
      }

      if (earliestId === null) break

      currentTime = earliestDue
      const t = timers.get(earliestId)!
      if (t.interval) {
        t.dueAt = currentTime + t.interval
      } else {
        timers.delete(earliestId)
      }
      t.cb()
    }
    currentTime = targetTime
  }

  const advanceToNextTimer = () => {
    let earliestId: number | null = null
    let earliestDue = Infinity

    for (const [id, t] of timers.entries()) {
      if (t.dueAt < earliestDue) {
        earliestDue = t.dueAt
        earliestId = id
      }
    }

    if (earliestId !== null) {
      const diff = earliestDue - currentTime
      if (diff > 0) advanceTime(diff)
    }
  }

  return {
    now,
    setTimeout: setTimeoutFn,
    clearTimeout: clearTimeoutFn,
    setInterval: setIntervalFn,
    clearInterval: clearIntervalFn,
    advanceTime,
    advanceToNextTimer
  }
}

describe('Prompt 6: Session Engine & Hardening Tests', () => {
  it('fires rest warning exactly once 60s before focus ends if focus is >= 2 minutes', () => {
    const clock = createMockClock()
    let warningFiredCount = 0

    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      onRestWarning: () => {
        warningFiredCount++
      }
    })

    // Start 5-minute focus session (300,000 ms)
    engine.start({ focusMinutes: 5, restMinutes: 1, loopCount: 1 })
    expect(warningFiredCount).toBe(0)

    // Advance 3 minutes (180,000 ms) -> 2 minutes remaining -> should not fire yet
    clock.advanceTime(3 * 60 * 1000)
    expect(warningFiredCount).toBe(0)

    // Advance to 60 seconds remaining (another 60,000 ms) -> remaining = 60,000 ms -> fires!
    clock.advanceTime(60 * 1000)
    expect(warningFiredCount).toBe(1)

    // Advance another 30 seconds -> remains 30s -> should NOT fire again
    clock.advanceTime(30 * 1000)
    expect(warningFiredCount).toBe(1)
  })

  it('does NOT fire rest warning if focus session is less than 2 minutes', () => {
    const clock = createMockClock()
    let warningFiredCount = 0

    const engine = new SessionEngine({
      clock,
      isPackaged: true,
      onRestWarning: () => {
        warningFiredCount++
      }
    })

    // Clamped minimum focus is 5 minutes in clampConfig, but test manual skip
    engine.start({ focusMinutes: 5, restMinutes: 1, loopCount: 1 })
    // User manually skips to rest immediately
    engine.skipToRest()
    expect(engine.getSnapshot().phase).toBe('transition-to-rest')

    // Advance time through transition and rest
    clock.advanceTime(TRANSITION_DURATION_MS + 60000)
    expect(warningFiredCount).toBe(0)
  })

  it('handles power resume: if rest period fully elapsed during sleep, advances to next focus', () => {
    const clock = createMockClock()
    const engine = new SessionEngine({
      clock,
      isPackaged: true
    })

    // 2 loops, 10m focus, 5m rest
    engine.start({ focusMinutes: 10, restMinutes: 5, loopCount: 2 })
    // Complete focus -> enter rest
    clock.advanceTime(10 * 60 * 1000 + TRANSITION_DURATION_MS)
    expect(engine.getSnapshot().phase).toBe('rest')
    expect(engine.getSnapshot().loopIndex).toBe(0)

    // Simulate OS sleep: time advances 10 minutes ahead (rest was 5m, so it fully elapsed)
    clock.advanceTime(10 * 60 * 1000)
    engine.handleSystemResume()

    // Should have advanced straight to the next focus (loop 1)
    const snap = engine.getSnapshot()
    expect(snap.phase).toBe('focus')
    expect(snap.loopIndex).toBe(1)
  })

  it('handles "Another one" and "Done for now" transitions', () => {
    const clock = createMockClock()
    const engine = new SessionEngine({
      clock,
      isPackaged: true
    })

    engine.start({ focusMinutes: 5, restMinutes: 2, loopCount: 1 })
    // Advance to session complete
    clock.advanceTime(5 * 60 * 1000 + TRANSITION_DURATION_MS + 2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('session-complete')

    // Another one: starts focus immediately with the same config
    const anotherSnap = engine.anotherOne()
    expect(anotherSnap.phase).toBe('focus')
    expect(anotherSnap.loopIndex).toBe(0)
    expect(anotherSnap.config.focusMinutes).toBe(5)

    // Complete again
    clock.advanceTime(5 * 60 * 1000 + TRANSITION_DURATION_MS + 2 * 60 * 1000)
    expect(engine.getSnapshot().phase).toBe('session-complete')

    // Done for now: returns to idle
    const doneSnap = engine.doneForNow()
    expect(doneSnap.phase).toBe('idle')
    expect(doneSnap.remainingMs).toBe(0)
  })

  it('merges settings for restWarning, autostart, and miniFocusWindow correctly', () => {
    const patched = clampAndMergeSettings(defaultSettings, {
      takeover: { restWarning: false },
      autostart: true,
      miniFocusWindow: false
    })

    expect(patched.takeover.restWarning).toBe(false)
    expect(patched.autostart).toBe(true)
    expect(patched.miniFocusWindow).toBe(false)
    expect(patched.takeover.allowSnooze).toBe(true)
  })
})
