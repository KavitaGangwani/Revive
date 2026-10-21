import {
  SessionConfig,
  SessionPhase,
  SessionSnapshot,
  PersistedSessionState,
  Activity,
  BreathingScheduleItem,
  BreathingPhase,
  PhaseKind,
  REST_WARNING_SECONDS
} from '../shared/types'
import { inferPhaseKind } from './store'

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
  awaitOverlayClose?: () => Promise<void>;
}

const defaultClock: Clock = {
  now: () => Date.now(),
  setTimeout: (cb, ms) => setTimeout(cb, ms),
  clearTimeout: (id) => clearTimeout(id),
  setInterval: (cb, ms) => setInterval(cb, ms),
  clearInterval: (id) => clearInterval(id)
}

export const TRANSITION_SECONDS = 5
export const INTRO_TRANSITION_MS = TRANSITION_SECONDS * 1000
export const FOCUS_TRANSITION_NO_NOTE_MS = TRANSITION_SECONDS * 1000
export const FOCUS_TRANSITION_WITH_NOTE_MS = 15000
export const TRANSITION_DURATION_MS = TRANSITION_SECONDS * 1000
export const TICK_INTERVAL_MS = 250

export class SessionEngine {
  private clock: Clock
  private isPackaged: boolean
  private onSnapshot?: (snapshot: SessionSnapshot) => void
  private onPersist?: (state: PersistedSessionState | null) => void
  private onRestWarning?: () => void
  private getDefaultRestActivityId: () => string | null
  private getActivityById?: (id: string) => Activity | undefined
  private awaitOverlayClose?: () => Promise<void>

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
  private snoozeUsedInCurrentRound: boolean = false
  private isSnoozePeriod: boolean = false
  private breathingSchedule: BreathingScheduleItem[] = []
  private restWarningFired: boolean = false
  private disruptedFocusRemainingMs: number = 0
  private leftOffNote: string = ''

  private timerHandle: any = null
  private isTransitioning: boolean = false

  constructor(options: SessionEngineOptions = {}) {
    this.clock = options.clock ?? defaultClock
    this.isPackaged = options.isPackaged ?? false
    this.onSnapshot = options.onSnapshot
    this.onPersist = options.onPersist
    this.onRestWarning = options.onRestWarning
    this.getDefaultRestActivityId = options.getDefaultRestActivityId ?? (() => null)
    this.getActivityById = options.getActivityById
    this.awaitOverlayClose = options.awaitOverlayClose
  }

  public getMsPerMinute(): number {
    if (!this.isPackaged && (process.env.STILL_DEV_FAST === '1' || process.env.REVIVE_DEV_FAST === '1')) {
      return 1000
    }
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
    for (let i = 0; i < loopCount; i++) {
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
      snoozeUsed: this.snoozeUsedInCurrentRound || this.snoozeUsedInCurrentRest,
      isSnoozed: this.isSnoozePeriod,
      leftOffNote: this.leftOffNote || null,
      isClosing: this.phase === 'closing' || this.isTransitioning
    }
  }

  public start(rawConfig: Partial<SessionConfig>): SessionSnapshot {
    this.clearTimers()
    this.config = this.clampConfig(rawConfig)
    this.loopIndex = 0
    this.snoozeUsedInCurrentRest = false
    this.snoozeUsedInCurrentRound = false
    this.isSnoozePeriod = false
    this.disruptedFocusRemainingMs = 0
    void this.transitionTo('focus')
    return this.getSnapshot()
  }

  public skipToRest(): SessionSnapshot {
    if (this.phase !== 'focus') {
      return this.getSnapshot()
    }
    this.disruptedFocusRemainingMs = 0
    this.clearTimers()
    this.restWarningFired = true // Avoid firing warning on manual skip
    this.isSnoozePeriod = false
    void this.transitionTo('transition-to-rest')
    return this.getSnapshot()
  }

  public anotherOne(): SessionSnapshot {
    this.clearTimers()
    this.loopIndex = 0
    this.snoozeUsedInCurrentRest = false
    this.snoozeUsedInCurrentRound = false
    this.isSnoozePeriod = false
    this.disruptedFocusRemainingMs = 0
    void this.transitionTo('focus')
    return this.getSnapshot()
  }

  public doneForNow(): SessionSnapshot {
    void this.transitionTo('idle')
    return this.getSnapshot()
  }

  public setLeftOffNote(note: string): void {
    const trimmed = (note || '').trim().slice(0, 200)
    this.leftOffNote = trimmed
    this.persistCurrentState()
    this.broadcast()
  }

  public backToWork(): SessionSnapshot {
    if (this.phase === 'transition-to-focus') {
      this.leftOffNote = ''
      this.disruptedFocusRemainingMs = 0
      void this.transitionTo('focus')
    }
    return this.getSnapshot()
  }

  public beginRestNow(): SessionSnapshot {
    if (this.phase === 'transition-to-rest') {
      void this.transitionTo('rest')
    }
    return this.getSnapshot()
  }

  /**
   * Snooze the current focus or rest session for specified minutes.
   * During focus (e.g. 90-second warning): adds snoozeMinutes to current focus phase.
   * Allowed once per round.
   */
  public snooze(snoozeMinutes: number = 2): SessionSnapshot {
    if (this.phase === 'focus') {
      if (this.snoozeUsedInCurrentRound) {
        return this.getSnapshot()
      }
      this.snoozeUsedInCurrentRound = true
      this.isSnoozePeriod = true

      const addMs = Math.max(1, snoozeMinutes) * this.getMsPerMinute()
      this.phaseEndsAt += addMs

      // Re-arm the warning for 90 seconds before the new end
      this.restWarningFired = false

      this.scheduleTick()
      this.persistCurrentState()
      this.broadcast()

      return this.getSnapshot()
    }

    if (this.phase === 'rest' || this.phase === 'transition-to-rest') {
      if (this.snoozeUsedInCurrentRest) {
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
      this.scheduleTick()
      this.broadcast()

      return this.getSnapshot()
    }

    return this.getSnapshot()
  }

  /**
   * Early exit for soft-timed activities ("Resume focus" button / skip rest)
   * Enters transition-to-focus, or ends session if rounds completed.
   */
  public resumeFocus(): SessionSnapshot {
    if (this.phase !== 'rest' && this.phase !== 'transition-to-rest') {
      return this.getSnapshot()
    }

    this.handleRestEnd()
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
    this.leftOffNote = (persisted.leftOffNote || '').slice(0, 200)

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
        const msPerSec = this.getMsPerMinute() / 60
        if (this.phase === 'transition-to-rest') {
          totalDuration = Math.round(TRANSITION_SECONDS * msPerSec)
          this.restActivityId = this.resolveRestActivity(this.loopIndex)
          this.breathingSchedule = []
        } else {
          totalDuration = this.leftOffNote && this.leftOffNote.trim()
            ? Math.round(15 * msPerSec)
            : Math.round(TRANSITION_SECONDS * msPerSec)
          this.restActivityId = null
          this.breathingSchedule = []
        }
      }

      this.phaseStartedAt = this.phaseEndsAt - totalDuration
      this.scheduleTick()
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
      this.scheduleTick()
      this.broadcast()
    }
  }

  private advanceFromExpiredPhase(expiredPhase: SessionPhase): void {
    if (expiredPhase === 'focus') {
      void this.transitionTo('transition-to-rest')
    } else if (expiredPhase === 'transition-to-rest') {
      void this.transitionTo('rest')
    } else if (expiredPhase === 'rest') {
      this.handleRestEnd()
    } else if (expiredPhase === 'transition-to-focus') {
      this.leftOffNote = ''
      this.disruptedFocusRemainingMs = 0
      void this.transitionTo('focus')
    }
  }

  /**
   * Single decision helper for rest completion.
   * If currentRound >= totalRounds, ends the session (idle).
   * Otherwise increments loopIndex and starts the next focus transition.
   */
  private handleRestEnd(): void {
    this.breathingSchedule = []
    this.isSnoozePeriod = false
    this.disruptedFocusRemainingMs = 0

    const currentRound = this.loopIndex + 1
    const totalRounds = this.config.loopCount

    if (currentRound >= totalRounds) {
      this.leftOffNote = ''
      void this.transitionTo('idle')
    } else {
      this.loopIndex++
      void this.transitionTo('transition-to-focus')
    }
  }

  private async transitionTo(
    targetPhase: SessionPhase,
    customDurationMs?: number
  ): Promise<void> {
    if (this.isTransitioning) {
      return
    }
    if (this.phase === targetPhase) {
      return
    }

    const fromPhase = this.phase

    // (c) awaits overlay close before starting the next focus phase
    if (targetPhase === 'focus' && (fromPhase === 'rest' || fromPhase === 'transition-to-focus')) {
      if (this.awaitOverlayClose) {
        this.isTransitioning = true
        try {
          await this.awaitOverlayClose()
        } catch (err) {
          console.error('[engine] Error awaiting overlay close:', err)
        } finally {
          this.isTransitioning = false
        }
      }
    }

    // (a) clears all phase timers first
    this.clearTimers()

    // (d) logs [engine] <from> -> <to> round <n>/<total> to the main console
    const currentRound = this.loopIndex + 1
    const totalRounds = this.config.loopCount
    console.log(`[engine] ${fromPhase} -> ${targetPhase} round ${currentRound}/${totalRounds}`)

    this.phase = targetPhase

    if (targetPhase === 'focus') {
      this.restWarningFired = false
      this.snoozeUsedInCurrentRound = false
      this.isSnoozePeriod = false
      const duration = customDurationMs && customDurationMs > 0
        ? customDurationMs
        : this.config.focusMinutes * this.getMsPerMinute()
      this.phaseStartedAt = this.clock.now()
      this.phaseEndsAt = this.phaseStartedAt + duration
      this.restActivityId = null
      this.breathingSchedule = []
    } else if (targetPhase === 'transition-to-rest') {
      this.phaseStartedAt = this.clock.now()
      const msPerSec = this.getMsPerMinute() / 60
      const introDurationMs = Math.round(TRANSITION_SECONDS * msPerSec)
      this.phaseEndsAt = this.phaseStartedAt + introDurationMs
      this.restActivityId = this.resolveRestActivity(this.loopIndex)
      this.breathingSchedule = []
    } else if (targetPhase === 'rest') {
      this.isSnoozePeriod = false
      const duration = this.config.restMinutes * this.getMsPerMinute()
      this.phaseStartedAt = this.clock.now()
      this.phaseEndsAt = this.phaseStartedAt + duration
      this.restActivityId = this.resolveRestActivity(this.loopIndex)
      this.generateBreathingSchedule()
    } else if (targetPhase === 'transition-to-focus') {
      this.phaseStartedAt = this.clock.now()
      this.restActivityId = null
      this.breathingSchedule = []
      this.snoozeUsedInCurrentRest = false

      const msPerSec = this.getMsPerMinute() / 60
      const durationMs = this.leftOffNote && this.leftOffNote.trim()
        ? Math.round(15 * msPerSec)
        : Math.round(TRANSITION_SECONDS * msPerSec)
      this.phaseEndsAt = this.phaseStartedAt + durationMs
    } else if (targetPhase === 'session-complete') {
      this.phaseStartedAt = this.clock.now()
      this.phaseEndsAt = this.phaseStartedAt
      this.restActivityId = null
      this.breathingSchedule = []
      this.snoozeUsedInCurrentRest = false
      this.snoozeUsedInCurrentRound = false
      this.isSnoozePeriod = false
      this.disruptedFocusRemainingMs = 0
      this.leftOffNote = ''
      this.persist(null)
      this.broadcast()
      return
    } else if (targetPhase === 'idle') {
      this.loopIndex = 0
      this.phaseStartedAt = 0
      this.phaseEndsAt = 0
      this.restActivityId = null
      this.snoozeUsedInCurrentRest = false
      this.snoozeUsedInCurrentRound = false
      this.isSnoozePeriod = false
      this.disruptedFocusRemainingMs = 0
      this.breathingSchedule = []
      this.leftOffNote = ''
      this.persist(null)
      this.broadcast()
      return
    }

    this.persistCurrentState()
    this.scheduleTick()
    this.broadcast()
  }

  private onPhaseEnd(): void {
    if (this.phase === 'focus') {
      void this.transitionTo('transition-to-rest')
    } else if (this.phase === 'transition-to-rest') {
      void this.transitionTo('rest')
    } else if (this.phase === 'rest') {
      this.handleRestEnd()
    } else if (this.phase === 'transition-to-focus') {
      this.leftOffNote = ''
      this.disruptedFocusRemainingMs = 0
      void this.transitionTo('focus')
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

      const rawKind = p.kind || inferPhaseKind(p.label || '', phaseIndex, phases.length)
      const normalizedKind: PhaseKind =
        rawKind === 'inhale' ? 'in' : rawKind === 'exhale' ? 'out' : rawKind
      const label = p.label || (normalizedKind === 'in' ? 'Inhale' : normalizedKind === 'out' ? 'Exhale' : 'Hold')

      schedule.push({
        index,
        phaseIndex,
        kind: normalizedKind,
        label,
        startEpochMs: currentEpoch,
        durationMs: actualDurationMs,
        soundId: p.soundId
      })

      currentEpoch += actualDurationMs
      index++
    }

    this.breathingSchedule = schedule
  }

  private scheduleTick(): void {
    this.clearTimers()

    const now = this.clock.now()
    if (this.phase === 'idle' || this.phase === 'session-complete') {
      return
    }

    const msUntilEnd = Math.max(0, this.phaseEndsAt - now)
    if (msUntilEnd === 0) {
      this.onPhaseEnd()
      return
    }

    const nextDelay = Math.min(TICK_INTERVAL_MS, msUntilEnd)
    this.timerHandle = this.clock.setTimeout(() => {
      this.timerHandle = null
      const currentNow = this.clock.now()
      if (currentNow >= this.phaseEndsAt) {
        this.onPhaseEnd()
      } else {
        if (this.phase === 'focus') {
          const remainingMs = this.phaseEndsAt - currentNow
          const msPerSec = this.getMsPerMinute() / 60
          const totalFocusMs = Math.max(1, this.phaseEndsAt - this.phaseStartedAt)
          const warningDurationMs = REST_WARNING_SECONDS * msPerSec
          const thresholdMs = totalFocusMs < warningDurationMs ? totalFocusMs / 2 : warningDurationMs

          if (
            !this.restWarningFired &&
            remainingMs <= thresholdMs &&
            remainingMs > 0
          ) {
            this.restWarningFired = true
            if (this.onRestWarning) {
              this.onRestWarning()
            }
          }
        }
        this.broadcast()
        this.scheduleTick()
      }
    }, nextDelay)
  }

  private clearTimers(): void {
    if (this.timerHandle !== null) {
      this.clock.clearTimeout(this.timerHandle)
      this.timerHandle = null
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
      snoozeUsed: this.snoozeUsedInCurrentRound || this.snoozeUsedInCurrentRest,
      savedAt: this.clock.now(),
      leftOffNote: this.leftOffNote || null
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
