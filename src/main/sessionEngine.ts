import {
  SessionConfig,
  SessionPhase,
  SessionSnapshot,
  PersistedSessionState,
  Activity,
  BreathingScheduleItem,
  BreathingPhase
} from '../shared/types'

export interface Clock {
  now: () => number;
  setTimeout: (cb: () => void, ms: number) => any;
  clearTimeout: (id: any) => void;
  setInterval: (cb: () => void, ms: number) => any;
  clearInterval: (id: any) => void;
}

export interface SessionEngineOptions {
  clock?: Clock;
  isPackaged?: boolean;
  onSnapshot?: (snapshot: SessionSnapshot) => void;
  onPersist?: (state: PersistedSessionState | null) => void;
  onRestWarning?: () => void;
  getDefaultRestActivityId?: () => string | null;
  getActivityById?: (id: string) => Activity | undefined;
}

const defaultClock: Clock = {
  now: () => Date.now(),
  setTimeout: (cb, ms) => setTimeout(cb, ms),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (cb, ms) => setInterval(cb, ms),
  clearInterval: (id) => clearInterval(id)
}

export const TRANSITION_DURATION_MS = 1200
export const TICK_INTERVAL_MS = 250

export class SessionEngine {
  private clock: Clock
  private isPackaged: boolean
  private onSnapshot?: (snapshot: SessionSnapshot) => void
  private onPersist?: (state: PersistedSessionState | null) => void
  private onRestWarning?: () => void
  private getDefaultRestActivityId: () => string | null
  private getActivityById?: (id: string) => Activity | undefined

  private phase: SessionPhase = 'idle'
  private loopIndex: number = 0
  private config: SessionConfig = {
    focusMinutes: 30,
    restMinutes: 5,
    loopCount: 2,
    restActivityIds: [null, null, null, null, null, null, null, null]
  }
  private phaseStartedAt: number = 0
  private phaseEndsAt: number = 0
  private restActivityId: string | null = null
  private snoozeUsedInCurrentRest: boolean = false
  private isSnoozePeriod: boolean = false
  private breathingSchedule: BreathingScheduleItem[] = []
  private restWarningFired: boolean = false

  private tickTimer: any = null
  private transitionTimer: any = null

  constructor(options: SessionEngineOptions = {}) {
    this.clock = options.clock ?? defaultClock
    this.isPackaged = options.isPackaged ?? false
    this.onSnapshot = options.onSnapshot
    this.onPersist = options.onPersist
    this.onRestWarning = options.onRestWarning
    this.getDefaultRestActivityId = options.getDefaultRestActivityId ?? (() => null)
    this.getActivityById = options.getActivityById
  }

  public getMsPerMinute(): number {
    const rawSpeed = process.env.REVIVE_DEV_SPEED || process.env.STILL_DEV_SPEED
    if (!this.isPackaged && rawSpeed) {
      const speed = Number(rawSpeed)
      if (Number.isFinite(speed) && speed > 0) {
        return Math.max(1, Math.round(60000 / speed))
      }
    }
    return 60000
  }

  public clampConfig(raw: Partial<SessionConfig>): SessionConfig {
    const focusMinutes = Math.min(180, Math.max(5, Math.round(raw.focusMinutes ?? 30)))
    const restMinutes = Math.min(60, Math.max(1, Math.round(raw.restMinutes ?? 5)))
    const loopCount = Math.min(8, Math.max(1, Math.round(raw.loopCount ?? 2)))

    const rawActivities = Array.isArray(raw.restActivityIds) ? raw.restActivityIds : []
    const restActivityIds: (string | null)[] = []
    for (let i = 0; i < 8; i++) {
      restActivityIds[i] = typeof rawActivities[i] === 'string' ? rawActivities[i] : null
    }

    return {
      focusMinutes,
      restMinutes,
      loopCount,
      restActivityIds
    }
  }

  public getSnapshot(): SessionSnapshot {
    const now = this.clock.now()
    const totalMs = this.phase === 'idle' || this.phase === 'session-complete'
      ? 0
      : Math.max(0, this.phaseEndsAt - this.phaseStartedAt)

    const remainingMs = this.phase === 'idle' || this.phase === 'session-complete'
      ? 0
      : Math.max(0, this.phaseEndsAt - now)

    return {
      phase: this.phase,
      loopIndex: this.loopIndex,
      loopCount: this.config.loopCount,
      remainingMs,
      totalMs,
      restActivityId: this.restActivityId,
      config: {
        ...this.config,
        restActivityIds: [...this.config.restActivityIds]
      },
      breathingSchedule: this.breathingSchedule.length > 0 ? [...this.breathingSchedule] : undefined,
      snoozeUsed: this.snoozeUsedInCurrentRest,
      isSnoozed: this.isSnoozePeriod
    }
  }

  public start(rawConfig: Partial<SessionConfig>): SessionSnapshot {
    this.clearTimers()
    this.config = this.clampConfig(rawConfig)
    this.loopIndex = 0
    this.snoozeUsedInCurrentRest = false
    this.isSnoozePeriod = false
    this.enterFocus()
    return this.getSnapshot()
  }

  public skipToRest(): SessionSnapshot {
    if (this.phase !== 'focus') {
      return this.getSnapshot()
    }
    this.clearTimers()
    this.restWarningFired = true // Avoid firing warning on manual skip
    this.isSnoozePeriod = false
    this.enterTransitionToRest()
    return this.getSnapshot()
  }

  public anotherOne(): SessionSnapshot {
    this.clearTimers()
    this.loopIndex = 0
    this.snoozeUsedInCurrentRest = false
    this.isSnoozePeriod = false
    this.enterFocus()
    return this.getSnapshot()
  }

  public doneForNow(): SessionSnapshot {
    this.clearTimers()
    this.phase = 'idle'
    this.loopIndex = 0
    this.phaseStartedAt = 0
    this.phaseEndsAt = 0
    this.restActivityId = null
    this.snoozeUsedInCurrentRest = false
    this.isSnoozePeriod = false
    this.breathingSchedule = []
    this.persist(null)
    this.broadcast()
    return this.getSnapshot()
  }

  /**
   * Snooze the current rest session for specified minutes (default: 2 minutes)
   * Allowed only ONCE per rest cycle.
   */
  public snooze(snoozeMinutes: number = 2): SessionSnapshot {
    if (this.snoozeUsedInCurrentRest) {
      return this.getSnapshot()
    }
    if (this.phase !== 'rest' && this.phase !== 'transition-to-rest') {
      return this.getSnapshot()
    }

    this.clearTimers()
    this.snoozeUsedInCurrentRest = true
    this.isSnoozePeriod = true
    this.phase = 'focus'

    const duration = Math.max(1, snoozeMinutes) * this.getMsPerMinute()
    this.phaseStartedAt = this.clock.now()
    this.phaseEndsAt = this.phaseStartedAt + duration
    this.breathingSchedule = []

    this.persistCurrentState()
    this.scheduleTimers()
    this.broadcast()

    return this.getSnapshot()
  }

  /**
   * Early exit for soft-timed activities ("Resume focus" button)
   */
  public resumeFocus(): SessionSnapshot {
    if (this.phase !== 'rest' && this.phase !== 'transition-to-rest') {
      return this.getSnapshot()
    }

    this.clearTimers()
    this.isSnoozePeriod = false
    this.breathingSchedule = []

    if (this.loopIndex + 1 < this.config.loopCount) {
      this.loopIndex++
      this.enterTransitionToFocus()
    } else {
      this.enterSessionComplete()
    }

    return this.getSnapshot()
  }

  public setRestActivity(index: number, activityId: string | null): SessionConfig {
    if (index >= 0 && index < 8) {
      const updated = [...this.config.restActivityIds]
      updated[index] = activityId
      this.config.restActivityIds = updated
      if (this.phase === 'rest' && this.loopIndex === index) {
        this.restActivityId = activityId ?? this.getDefaultRestActivityId() ?? null
        this.generateBreathingSchedule()
      }
      this.broadcast()
    }
    return {
      ...this.config,
      restActivityIds: [...this.config.restActivityIds]
    }
  }

  public resumeFromPersisted(persisted: PersistedSessionState | null): boolean {
    if (!persisted || persisted.phase === 'idle' || persisted.phase === 'session-complete') {
      this.phase = 'idle'
      return false
    }

    this.clearTimers()
    this.config = this.clampConfig(persisted.config)
    this.loopIndex = Math.min(this.config.loopCount - 1, Math.max(0, persisted.loopIndex))
    this.snoozeUsedInCurrentRest = Boolean(persisted.snoozeUsed)

    const now = this.clock.now()

    if (now < persisted.phaseEndsAt) {
      // Current phase is still running
      this.phase = persisted.phase
      this.phaseEndsAt = persisted.phaseEndsAt

      let totalDuration = 0
      if (this.phase === 'focus') {
        totalDuration = this.config.focusMinutes * this.getMsPerMinute()
        this.restActivityId = null
      } else if (this.phase === 'rest') {
        totalDuration = this.config.restMinutes * this.getMsPerMinute()
        this.restActivityId = this.resolveRestActivity(this.loopIndex)
        this.generateBreathingSchedule()
      } else {
        totalDuration = TRANSITION_DURATION_MS
        this.restActivityId = this.phase === 'transition-to-rest' ? this.resolveRestActivity(this.loopIndex) : null
        if (this.phase === 'transition-to-rest') {
          this.generateBreathingSchedule()
        }
      }

      this.phaseStartedAt = this.phaseEndsAt - totalDuration
      this.scheduleTimers()
      this.persistCurrentState()
      this.broadcast()
      return true
    } else {
      // Phase end has passed: advance to the next phase starting now
      this.advanceFromExpiredPhase(persisted.phase)
      return true
    }
  }

  public handleSystemResume(): void {
    if (this.phase === 'idle' || this.phase === 'session-complete') {
      return
    }

    const now = this.clock.now()
    if (now >= this.phaseEndsAt) {
      this.clearTimers()
      this.advanceFromExpiredPhase(this.phase)
    } else {
      this.broadcast()
    }
  }

  private advanceFromExpiredPhase(expiredPhase: SessionPhase): void {
    if (expiredPhase === 'focus') {
      this.isSnoozePeriod = false
      this.enterTransitionToRest()
    } else if (expiredPhase === 'transition-to-rest') {
      this.enterRest()
    } else if (expiredPhase === 'rest') {
      this.isSnoozePeriod = false
      if (this.loopIndex + 1 < this.config.loopCount) {
        this.loopIndex++
        this.enterTransitionToFocus()
      } else {
        this.enterSessionComplete()
      }
    } else if (expiredPhase === 'transition-to-focus') {
      this.enterFocus()
    } else {
      this.enterSessionComplete()
    }
  }

  private enterFocus(): void {
    this.phase = 'focus'
    this.restWarningFired = false
    const duration = this.config.focusMinutes * this.getMsPerMinute()
    this.phaseStartedAt = this.clock.now()
    this.phaseEndsAt = this.phaseStartedAt + duration
    this.restActivityId = null
    this.breathingSchedule = []

    this.persistCurrentState()
    this.scheduleTimers()
    this.broadcast()
  }

  private enterTransitionToRest(): void {
    this.phase = 'transition-to-rest'
    this.phaseStartedAt = this.clock.now()
    this.phaseEndsAt = this.phaseStartedAt + TRANSITION_DURATION_MS
    this.restActivityId = this.resolveRestActivity(this.loopIndex)
    this.generateBreathingSchedule()

    this.persistCurrentState()
    this.scheduleTimers()
    this.broadcast()
  }

  private enterRest(): void {
    this.phase = 'rest'
    const duration = this.config.restMinutes * this.getMsPerMinute()
    this.phaseStartedAt = this.clock.now()
    this.phaseEndsAt = this.phaseStartedAt + duration
    this.restActivityId = this.resolveRestActivity(this.loopIndex)
    this.generateBreathingSchedule()

    this.persistCurrentState()
    this.scheduleTimers()
    this.broadcast()
  }

  private enterTransitionToFocus(): void {
    this.phase = 'transition-to-focus'
    this.phaseStartedAt = this.clock.now()
    this.phaseEndsAt = this.phaseStartedAt + TRANSITION_DURATION_MS
    this.restActivityId = null
    this.breathingSchedule = []
    this.snoozeUsedInCurrentRest = false // reset for next loop

    this.persistCurrentState()
    this.scheduleTimers()
    this.broadcast()
  }

  private enterSessionComplete(): void {
    this.clearTimers()
    this.phase = 'session-complete'
    this.phaseStartedAt = this.clock.now()
    this.phaseEndsAt = this.phaseStartedAt
    this.restActivityId = null
    this.breathingSchedule = []
    this.snoozeUsedInCurrentRest = false
    this.isSnoozePeriod = false

    this.persist(null)
    this.broadcast()
  }

  private onPhaseEnd(): void {
    this.clearTimers()
    if (this.phase === 'focus') {
      this.enterTransitionToRest()
    } else if (this.phase === 'transition-to-rest') {
      this.enterRest()
    } else if (this.phase === 'rest') {
      if (this.loopIndex + 1 < this.config.loopCount) {
        this.loopIndex++
        this.enterTransitionToFocus()
      } else {
        this.enterSessionComplete()
      }
    } else if (this.phase === 'transition-to-focus') {
      this.enterFocus()
    }
  }

  private resolveRestActivity(index: number): string | null {
    const fromConfig = this.config.restActivityIds[index]
    if (fromConfig) {
      return fromConfig
    }
    const fromDefault = this.getDefaultRestActivityId()
    return fromDefault ?? null
  }

  /**
   * Generates single-clock epoch schedule for breathing activity
   */
  private generateBreathingSchedule(): void {
    if (!this.restActivityId) {
      this.breathingSchedule = []
      return
    }

    let act: Activity | undefined
    if (this.getActivityById) {
      act = this.getActivityById(this.restActivityId)
    }

    if (!act || act.type !== 'breathing' || !Array.isArray(act.phases) || act.phases.length === 0) {
      this.breathingSchedule = []
      return
    }

    const phases: BreathingPhase[] = act.phases
    const schedule: BreathingScheduleItem[] = []
    const restDurationMs = this.config.restMinutes * this.getMsPerMinute()
    const restStartEpoch = this.phase === 'transition-to-rest'
      ? this.phaseEndsAt // starts when transition ends
      : this.phaseStartedAt
    const restEndEpoch = restStartEpoch + restDurationMs

    let currentEpoch = restStartEpoch
    let index = 0

    while (currentEpoch < restEndEpoch) {
      const phaseIndex = index % phases.length
      const p = phases[phaseIndex]
      const durationMs = p.seconds * 1000
      const actualDurationMs = Math.min(durationMs, Math.max(0, restEndEpoch - currentEpoch))

      if (actualDurationMs <= 0) break

      schedule.push({
        index,
        phaseIndex,
        kind: p.kind,
        label: p.label,
        startEpochMs: currentEpoch,
        durationMs: actualDurationMs,
        soundId: p.soundId
      })

      currentEpoch += actualDurationMs
      index++
    }

    this.breathingSchedule = schedule
  }

  private scheduleTimers(): void {
    this.clearTimers()

    const now = this.clock.now()
    const msUntilEnd = Math.max(0, this.phaseEndsAt - now)

    this.transitionTimer = this.clock.setTimeout(() => {
      this.onPhaseEnd()
    }, msUntilEnd)

    this.tickTimer = this.clock.setInterval(() => {
      const currentNow = this.clock.now()
      if (currentNow >= this.phaseEndsAt) {
        this.onPhaseEnd()
      } else {
        if (this.phase === 'focus') {
          const remainingMs = this.phaseEndsAt - currentNow
          if (
            !this.restWarningFired &&
            this.config.focusMinutes >= 2 &&
            remainingMs <= 60000 &&
            remainingMs > 0
          ) {
            this.restWarningFired = true
            if (this.onRestWarning) {
              this.onRestWarning()
            }
          }
        }
        this.broadcast()
      }
    }, TICK_INTERVAL_MS)
  }

  private clearTimers(): void {
    if (this.transitionTimer !== null) {
      this.clock.clearTimeout(this.transitionTimer)
      this.transitionTimer = null
    }
    if (this.tickTimer !== null) {
      this.clock.clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  }

  private persistCurrentState(): void {
    this.persist({
      config: {
        ...this.config,
        restActivityIds: [...this.config.restActivityIds]
      },
      loopIndex: this.loopIndex,
      phase: this.phase,
      phaseEndsAt: this.phaseEndsAt,
      snoozeUsed: this.snoozeUsedInCurrentRest
    })
  }

  private persist(state: PersistedSessionState | null): void {
    if (this.onPersist) {
      this.onPersist(state)
    }
  }

  private broadcast(): void {
    if (this.onSnapshot) {
      this.onSnapshot(this.getSnapshot())
    }
  }
}
