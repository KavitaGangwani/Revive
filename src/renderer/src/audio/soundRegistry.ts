/**
 * ============================================================================
 * REVIVE SOUND REGISTRY & AUDIO MANAGER
 * ============================================================================
 * 
 * USER INSTRUCTIONS:
 * ------------------
 * You can add your custom sounds (e.g. chime sounds, bell tones, ocean waves)
 * directly in this file!
 * 
 * 1. Place your audio files (.mp3, .wav, .ogg) in the `assets/sounds/` folder
 *    (or anywhere in the project).
 * 2. Set the file path or URL in the `USER_CUSTOM_SOUNDS` object below.
 * 3. Whenever you tell the assistant to use your custom sound, this registry
 *    will automatically play your chosen audio file!
 * 4. If no custom audio file is provided, Revive automatically falls back to
 *    its built-in Web Audio API crystal chime synthesizer so it always works.
 * ============================================================================
 */

export interface CustomSoundConfig {
  /** Path or URL to custom rest start chime (e.g., './assets/sounds/start_chime.mp3') */
  restStartChimeUrl?: string | null;
  /** Path or URL to custom rest end chime (e.g., './assets/sounds/end_chime.mp3') */
  restEndChimeUrl?: string | null;
  /** Path or URL to custom routine step transition chime (e.g., './assets/sounds/step_chime.mp3') */
  routineStepChimeUrl?: string | null;
  /** Path or URL to custom 60-second rest upcoming warning chime */
  warningChimeUrl?: string | null;
  /** General chime sounds or effects */
  generalChimeUrl?: string | null;
}

/**
 * ----------------------------------------------------------------------------
 * ADD YOUR CUSTOM AUDIO FILE PATHS HERE:
 * ----------------------------------------------------------------------------
 */
export const USER_CUSTOM_SOUNDS: CustomSoundConfig = {
  // Example: restStartChimeUrl: './assets/sounds/chime.mp3',
  restStartChimeUrl: null,
  restEndChimeUrl: null,
  routineStepChimeUrl: null,
  warningChimeUrl: null,
  generalChimeUrl: null
}

export class SoundRegistry {
  private audioCtx: AudioContext | null = null
  private customAudioCache = new Map<string, HTMLAudioElement>()

  private getContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  /**
   * Play an audio file from URL/path or fallback to synthetic chime
   */
  private playFileOrSynth(url: string | null | undefined, fallbackSynth: () => void): void {
    if (url) {
      try {
        let audio = this.customAudioCache.get(url)
        if (!audio) {
          audio = new Audio(url)
          this.customAudioCache.set(url, audio)
        }
        audio.currentTime = 0
        audio.play().catch((err) => {
          console.warn('[SoundRegistry] Custom audio play error, falling back to synth:', err)
          fallbackSynth()
        })
        return
      } catch (err) {
        console.warn('[SoundRegistry] Could not load audio file:', err)
      }
    }
    fallbackSynth()
  }

  /**
   * Play gentle crystal bell chime for routine step transitions
   */
  public playRoutineStepChime(): void {
    this.playFileOrSynth(USER_CUSTOM_SOUNDS.routineStepChimeUrl, () => {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // High pleasant overtone bell (880Hz A5 -> 1320Hz E6)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.85)
    })
  }

  /**
   * Play gentle restful chime when Rest begins
   */
  public playRestStartChime(): void {
    this.playFileOrSynth(USER_CUSTOM_SOUNDS.restStartChimeUrl, () => {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      // Tibetan singing bowl harmonic triad: F4 (349Hz) + C5 (523Hz) + A5 (880Hz)
      const freqs = [349.23, 523.25, 880]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)

        const startDelay = idx * 0.08
        gain.gain.setValueAtTime(0.001, now + startDelay)
        gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + startDelay + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + 2.4)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + startDelay)
        osc.stop(now + startDelay + 2.5)
      })
    })
  }

  /**
   * Play uplifting chime when Rest ends
   */
  public playRestEndChime(): void {
    this.playFileOrSynth(USER_CUSTOM_SOUNDS.restEndChimeUrl, () => {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      // Rising harmonic chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
      const notes = [523.25, 659.25, 783.99]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)

        const delay = idx * 0.12
        gain.gain.setValueAtTime(0.001, now + delay)
        gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + delay)
        osc.stop(now + delay + 1.9)
      })
    })
  }

  /**
   * Play gentle reminder cue for 60s rest warning
   */
  public playWarningChime(): void {
    this.playFileOrSynth(USER_CUSTOM_SOUNDS.warningChimeUrl, () => {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now) // D5
      osc.frequency.setValueAtTime(659.25, now + 0.15) // E5

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.95)
    })
  }
}

export const soundRegistry = new SoundRegistry()
