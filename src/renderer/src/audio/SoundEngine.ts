import { BreathingScheduleItem, SoundPack, PhaseKind } from '../../../shared/types'

export class SoundEngine {
  private audioCtx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeSourceNodes: AudioBufferSourceNode[] = []
  private decodedBufferCache = new Map<string, AudioBuffer>()
  private schedule: BreathingScheduleItem[] = []
  private currentPack: SoundPack | null = null
  private volume: number = 0.8
  private isMuted: boolean = false

  constructor() {
    // Initialized lazily on primary overlay mount
  }

  public init(): void {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass()
        this.masterGain = this.audioCtx.createGain()
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime)
        this.masterGain.connect(this.audioCtx.destination)
      }
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime)
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime)
    }
  }

  public async predecodeBuffers(pack: SoundPack | null): Promise<void> {
    this.init()
    if (!this.audioCtx) return

    this.currentPack = pack
    if (!pack || pack.id === 'off') return

    // Ensure built-in synth buffers are cached
    const kinds: PhaseKind[] = ['in', 'hold', 'out']
    for (const kind of kinds) {
      const cacheKey = `${pack.id}_${kind}`
      if (!this.decodedBufferCache.has(cacheKey)) {
        const buffer = this.createSyntheticBuffer(pack.id, kind)
        if (buffer) {
          this.decodedBufferCache.set(cacheKey, buffer)
        }
      }
    }
  }

  public scheduleCues(schedule: BreathingScheduleItem[], pack: SoundPack | null, volume: number = 0.8): void {
    this.stopAll()
    this.init()
    if (!this.audioCtx || !this.masterGain) return

    this.schedule = schedule || []
    this.currentPack = pack
    this.setVolume(volume)

    if (!pack || pack.id === 'off' || this.isMuted) return
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }

    const nowEpoch = Date.now()
    const ctxNow = this.audioCtx.currentTime

    for (const item of this.schedule) {
      const deltaSec = (item.startEpochMs - nowEpoch) / 1000
      const phaseDurationSec = item.durationMs / 1000

      // Skip cues that have already completely passed
      if (deltaSec + phaseDurationSec <= 0) continue

      const cacheKey = `${pack.id}_${item.kind}`
      const buffer = this.decodedBufferCache.get(cacheKey) || this.createSyntheticBuffer(pack.id, item.kind)
      if (!buffer) continue

      const source = this.audioCtx.createBufferSource()
      source.buffer = buffer

      const cueGain = this.audioCtx.createGain()
      source.connect(cueGain)
      cueGain.connect(this.masterGain)

      const startOffset = Math.max(0, deltaSec)
      const startTime = ctxNow + startOffset
      const playOffset = deltaSec < 0 ? Math.abs(deltaSec) : 0

      // Handle buffer vs phase duration
      const soundDuration = buffer.duration
      if (soundDuration > phaseDurationSec) {
        // Fade out over last 300ms if longer than phase
        const fadeStart = startTime + Math.max(0, phaseDurationSec - 0.3)
        const fadeEnd = startTime + phaseDurationSec
        cueGain.gain.setValueAtTime(1, Math.max(ctxNow, startTime))
        cueGain.gain.setValueAtTime(1, fadeStart)
        cueGain.gain.linearRampToValueAtTime(0, fadeEnd)
        source.start(startTime, playOffset, phaseDurationSec)
      } else {
        cueGain.gain.setValueAtTime(1, Math.max(ctxNow, startTime))
        source.start(startTime, playOffset)
      }

      this.activeSourceNodes.push(source)
    }
  }

  public resyncWithEpoch(nowEpoch: number = Date.now()): void {
    if (this.currentPack && this.schedule.length > 0) {
      this.scheduleCues(this.schedule, this.currentPack, this.volume)
    }
  }

  public stopAll(): void {
    for (const source of this.activeSourceNodes) {
      try {
        source.stop()
        source.disconnect()
      } catch {
        // Already stopped
      }
    }
    this.activeSourceNodes = []
  }

  public dispose(): void {
    this.stopAll()
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {})
      this.audioCtx = null
      this.masterGain = null
    }
    this.decodedBufferCache.clear()
  }

  /**
   * Procedural Audio Buffer Synthesis for "Soft tones" and "Singing bowl"
   */
  private createSyntheticBuffer(packId: string, kind: PhaseKind): AudioBuffer | null {
    if (!this.audioCtx) return null

    const sampleRate = this.audioCtx.sampleRate

    if (packId === 'singing-bowl') {
      // Singing bowl: striking rich harmonics (In: 320Hz, Hold: 480Hz, Out: 240Hz)
      const duration = 3.5
      const numSamples = Math.floor(sampleRate * duration)
      const buffer = this.audioCtx.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)

      const baseFreq = kind === 'in' ? 320 : kind === 'hold' ? 480 : 240
      const harmonics = [
        { f: baseFreq, gain: 0.65, decay: 2.8 },
        { f: baseFreq * 2.02, gain: 0.35, decay: 2.2 },
        { f: baseFreq * 3.01, gain: 0.18, decay: 1.5 },
        { f: baseFreq * 4.25, gain: 0.08, decay: 1.0 }
      ]

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        let sample = 0
        for (const h of harmonics) {
          const env = Math.exp(-t * (4.0 / h.decay))
          sample += Math.sin(2 * Math.PI * h.f * t) * h.gain * env
        }
        // Strike initial transient
        const strike = Math.exp(-t * 80) * 0.25 * (Math.random() * 2 - 1)
        data[i] = (sample + strike) * 0.4
      }

      return buffer
    }

    // Default: Soft tones (In: rising 220->380Hz, Hold: 523Hz short blip, Out: falling 380->220Hz)
    if (kind === 'hold') {
      const duration = 0.35
      const numSamples = Math.floor(sampleRate * duration)
      const buffer = this.audioCtx.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)
      const freq = 523.25 // C5 chime

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const env = Math.sin((t / duration) * Math.PI) * Math.exp(-t * 6)
        data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.35
      }

      return buffer
    }

    const duration = 2.4
    const numSamples = Math.floor(sampleRate * duration)
    const buffer = this.audioCtx.createBuffer(1, numSamples, sampleRate)
    const data = buffer.getChannelData(0)

    const startFreq = kind === 'in' ? 220 : 380
    const endFreq = kind === 'in' ? 380 : 220

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      const progress = t / duration
      // Smooth frequency ramp
      const freq = startFreq + (endFreq - startFreq) * (1 - Math.cos(progress * Math.PI)) / 2
      // Envelope: soft attack, sustained, smooth decay
      const attack = Math.min(1, t / 0.4)
      const decay = Math.max(0, 1 - Math.pow(progress, 2))
      const env = attack * decay

      // Rich dual sine for warmth
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.75 + Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.25
      data[i] = sample * env * 0.35
    }

    return buffer
  }
}
