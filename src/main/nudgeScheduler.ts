import { AppSettings, SessionPhase, SessionSnapshot } from '../shared/types'
import { ToastManager } from './toastManager'

export interface NudgeSchedulerOptions {
  getSettings: () => AppSettings;
  toastManager: ToastManager;
  isOverlayActive: () => boolean;
}

export class NudgeScheduler {
  private getSettings: () => AppSettings
  private toastManager: ToastManager
  private isOverlayActive: () => boolean

  private nextEyeBreakMs: number = 0
  private nextDrinkWaterMs: number = 0
  private lastPhase: SessionPhase = 'idle'
  private checkIntervalTimer: any = null

  constructor(options: NudgeSchedulerOptions) {
    this.getSettings = options.getSettings
    this.toastManager = options.toastManager
    this.isOverlayActive = options.isOverlayActive
    this.initTimers()
    this.startLoop()
  }

  public initTimers(): void {
    const now = Date.now()
    const settings = this.getSettings()

    const eyeIntervalMs = (settings?.nudges?.eyeBreak?.intervalMinutes ?? 20) * 60000
    const waterIntervalMs = (settings?.nudges?.drinkWater?.intervalMinutes ?? 45) * 60000

    this.nextEyeBreakMs = now + eyeIntervalMs
    this.nextDrinkWaterMs = now + waterIntervalMs
  }

  public resetTimers(): void {
    this.initTimers()
  }

  public handleSnapshot(snapshot: SessionSnapshot): void {
    const currentPhase = snapshot.phase
    const wasRest = this.lastPhase === 'rest' || this.lastPhase === 'transition-to-rest'
    const isNowFocusOrIdle = currentPhase === 'focus' || currentPhase === 'idle'

    if (wasRest && isNowFocusOrIdle) {
      // Rest has ended: reset nudge timers
      this.resetTimers()
    }

    this.lastPhase = currentPhase
  }

  private startLoop(): void {
    if (this.checkIntervalTimer) clearInterval(this.checkIntervalTimer)

    this.checkIntervalTimer = setInterval(() => {
      this.checkNudges()
    }, 1000)
  }

  private checkNudges(): void {
    const now = Date.now()
    const settings = this.getSettings()
    const overlayShowing = this.isOverlayActive()

    // 1. Eye Break Check
    if (settings?.nudges?.eyeBreak?.enabled) {
      const eyeIntervalMs = (settings.nudges.eyeBreak.intervalMinutes ?? 20) * 60000
      if (now >= this.nextEyeBreakMs) {
        if (!overlayShowing) {
          this.toastManager.showToast('eyeBreak')
        }
        // Advance timer even if skipped
        this.nextEyeBreakMs = now + eyeIntervalMs
      }
    }

    // 2. Drink Water Check
    if (settings?.nudges?.drinkWater?.enabled) {
      const waterIntervalMs = (settings.nudges.drinkWater.intervalMinutes ?? 45) * 60000
      if (now >= this.nextDrinkWaterMs) {
        if (!overlayShowing) {
          this.toastManager.showToast('drinkWater')
        }
        // Advance timer even if skipped
        this.nextDrinkWaterMs = now + waterIntervalMs
      }
    }
  }

  public destroy(): void {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer)
      this.checkIntervalTimer = null
    }
  }
}
