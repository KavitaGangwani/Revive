import { describe, it, expect } from 'vitest'
import { AppSettings, DeepPartial, SessionSnapshot } from '../../shared/types'
import {
  defaultSettings,
  clampAndMergeSettings,
  clamp,
  snapToStep
} from '../store'
import { TrayManager } from '../tray'
import { NudgeScheduler } from '../nudgeScheduler'

describe('Settings Data and Clamping', () => {
  it('has the correct default settings', () => {
    expect(defaultSettings).toEqual({
      nudges: {
        eyeBreak: { enabled: true, intervalMinutes: 20 },
        drinkWater: { enabled: true, intervalMinutes: 45 },
        standaloneInBackground: false
      },
      takeover: {
        windowMode: 'window',
        allDisplays: true,
        allowSnooze: true,
        snoozeMinutes: 5,
        restWarning: true
      },
      sound: {
        chimeAtRestStart: true,
        chimeAtRestEnd: true
      },
      autostart: false,
      miniFocusWindow: true
    })
  })

  it('clamps and snaps eye break interval to 5-120 in steps of 5', () => {
    const current = { ...defaultSettings }

    // Out of bounds low
    const low = clampAndMergeSettings(current, {
      nudges: { eyeBreak: { intervalMinutes: 2 } }
    })
    expect(low.nudges.eyeBreak.intervalMinutes).toBe(5)

    // Out of bounds high
    const high = clampAndMergeSettings(current, {
      nudges: { eyeBreak: { intervalMinutes: 200 } }
    })
    expect(high.nudges.eyeBreak.intervalMinutes).toBe(120)

    // Off-step (e.g. 23 -> 25, 22 -> 20)
    const stepUp = clampAndMergeSettings(current, {
      nudges: { eyeBreak: { intervalMinutes: 23 } }
    })
    expect(stepUp.nudges.eyeBreak.intervalMinutes).toBe(25)

    const stepDown = clampAndMergeSettings(current, {
      nudges: { eyeBreak: { intervalMinutes: 22 } }
    })
    expect(stepDown.nudges.eyeBreak.intervalMinutes).toBe(20)
  })

  it('clamps and snaps drink water interval to 5-180 in steps of 5', () => {
    const current = { ...defaultSettings }

    const low = clampAndMergeSettings(current, {
      nudges: { drinkWater: { intervalMinutes: -10 } }
    })
    expect(low.nudges.drinkWater.intervalMinutes).toBe(5)

    const high = clampAndMergeSettings(current, {
      nudges: { drinkWater: { intervalMinutes: 999 } }
    })
    expect(high.nudges.drinkWater.intervalMinutes).toBe(180)

    const step = clampAndMergeSettings(current, {
      nudges: { drinkWater: { intervalMinutes: 47 } }
    })
    expect(step.nudges.drinkWater.intervalMinutes).toBe(45)
  })

  it('clamps snooze length to 1-15 in steps of 1', () => {
    const current = { ...defaultSettings }

    const low = clampAndMergeSettings(current, {
      takeover: { snoozeMinutes: 0 }
    })
    expect(low.takeover.snoozeMinutes).toBe(1)

    const high = clampAndMergeSettings(current, {
      takeover: { snoozeMinutes: 20 }
    })
    expect(high.takeover.snoozeMinutes).toBe(15)

    const normal = clampAndMergeSettings(current, {
      takeover: { snoozeMinutes: 7.2 }
    })
    expect(normal.takeover.snoozeMinutes).toBe(7)
  })

  it('preserves untouched settings when applying a partial patch', () => {
    const current = { ...defaultSettings }
    const patch: DeepPartial<AppSettings> = {
      takeover: { allDisplays: false },
      sound: { chimeAtRestEnd: false }
    }
    const merged = clampAndMergeSettings(current, patch)

    expect(merged.takeover.allDisplays).toBe(false)
    expect(merged.sound.chimeAtRestEnd).toBe(false)
    // untouched fields
    expect(merged.nudges.eyeBreak.enabled).toBe(true)
    expect(merged.nudges.eyeBreak.intervalMinutes).toBe(20)
    expect(merged.takeover.allowSnooze).toBe(true)
    expect(merged.sound.chimeAtRestStart).toBe(true)
  })
})

describe('Tray Manager & Session Running Logic', () => {
  let miniEnabled = true
  const trayManager = new TrayManager({
    getMainWindow: () => null,
    onQuit: () => {},
    onSkipToRest: () => {},
    onToggleMiniWindow: () => { miniEnabled = !miniEnabled },
    getMiniWindowEnabled: () => miniEnabled
  })

  it('accurately identifies running phases vs non-running phases', () => {
    expect(trayManager.isSessionRunning('focus')).toBe(true)
    expect(trayManager.isSessionRunning('transition-to-rest')).toBe(true)
    expect(trayManager.isSessionRunning('rest')).toBe(true)
    expect(trayManager.isSessionRunning('transition-to-focus')).toBe(true)

    expect(trayManager.isSessionRunning('idle')).toBe(false)
    expect(trayManager.isSessionRunning('session-complete')).toBe(false)
  })
})

describe('NudgeScheduler Session Behavior', () => {
  it('only fires nudges during active focus session unless standaloneInBackground is enabled', () => {
    let shownToasts: string[] = []
    let currentSettings: AppSettings = {
      ...defaultSettings,
      nudges: {
        eyeBreak: { enabled: true, intervalMinutes: 1 },
        drinkWater: { enabled: true, intervalMinutes: 1 },
        standaloneInBackground: false
      }
    }

    const mockToastManager = {
      showToast: (kind: string) => { shownToasts.push(kind) }
    } as any

    const scheduler = new NudgeScheduler({
      getSettings: () => currentSettings,
      toastManager: mockToastManager,
      isOverlayActive: () => false
    })

    // 1. In idle phase with standaloneInBackground = false: no toasts
    scheduler.handleSnapshot({ phase: 'idle' } as SessionSnapshot)
    ;(scheduler as any).nextEyeBreakMs = Date.now() - 1000
    ;(scheduler as any).checkNudges()
    expect(shownToasts.length).toBe(0)

    // 2. In focus phase: toasts fire
    scheduler.handleSnapshot({ phase: 'focus' } as SessionSnapshot)
    ;(scheduler as any).nextEyeBreakMs = Date.now() - 1000
    ;(scheduler as any).checkNudges()
    expect(shownToasts).toContain('eyeBreak')

    // 3. In idle phase with standaloneInBackground = true: toasts fire
    shownToasts = []
    currentSettings = {
      ...currentSettings,
      nudges: {
        ...currentSettings.nudges,
        standaloneInBackground: true
      }
    }
    scheduler.handleSnapshot({ phase: 'idle' } as SessionSnapshot)
    ;(scheduler as any).nextDrinkWaterMs = Date.now() - 1000
    ;(scheduler as any).checkNudges()
    expect(shownToasts).toContain('drinkWater')

    scheduler.destroy()
  })
})

