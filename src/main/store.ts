import Store from 'electron-store'
import {
  StoreSchema,
  AppSettings,
  Activity,
  LibrarySettings,
  SessionResume,
  UserPrefs,
  PersistedSessionState,
  SoundPack,
  PhaseKind,
  BreathingPhase,
  ActivityType
} from '../shared/types'

export const defaultSettings: AppSettings = {
  nudges: {
    eyeBreak: { enabled: true, intervalMinutes: 20 },
    drinkWater: { enabled: true, intervalMinutes: 45 },
    standaloneInBackground: false
  },
  takeover: {
    allDisplays: true,
    allowSnooze: true,
    snoozeMinutes: 5,
    restWarning: true,
    windowMode: 'window'
  },
  sound: {
    chimeAtRestStart: true,
    chimeAtRestEnd: true
  },
  autostart: false,
  miniFocusWindow: true
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

export function snapToStep(val: number, step: number): number {
  return Math.round(val / step) * step
}

export function clampAndMergeSettings(
  current: AppSettings,
  patch: Partial<AppSettings> | any
): AppSettings {
  const nudgesPatch = patch?.nudges || {}
  const eyePatch = nudgesPatch?.eyeBreak || {}
  const waterPatch = nudgesPatch?.drinkWater || {}
  const takeoverPatch = patch?.takeover || {}
  const soundPatch = patch?.sound || {}

  return {
    nudges: {
      eyeBreak: {
        enabled:
          typeof eyePatch.enabled === 'boolean'
            ? eyePatch.enabled
            : current.nudges?.eyeBreak?.enabled ?? true,
        intervalMinutes:
          typeof eyePatch.intervalMinutes === 'number'
            ? clamp(snapToStep(eyePatch.intervalMinutes, 5), 5, 120)
            : current.nudges?.eyeBreak?.intervalMinutes ?? 20
      },
      drinkWater: {
        enabled:
          typeof waterPatch.enabled === 'boolean'
            ? waterPatch.enabled
            : current.nudges?.drinkWater?.enabled ?? true,
        intervalMinutes:
          typeof waterPatch.intervalMinutes === 'number'
            ? clamp(snapToStep(waterPatch.intervalMinutes, 5), 5, 180)
            : current.nudges?.drinkWater?.intervalMinutes ?? 45
      },
      standaloneInBackground:
        typeof nudgesPatch.standaloneInBackground === 'boolean'
          ? nudgesPatch.standaloneInBackground
          : current.nudges?.standaloneInBackground ?? false
    },
    takeover: {
      allDisplays:
        typeof takeoverPatch.allDisplays === 'boolean'
          ? takeoverPatch.allDisplays
          : current.takeover?.allDisplays ?? true,
      allowSnooze:
        typeof takeoverPatch.allowSnooze === 'boolean'
          ? takeoverPatch.allowSnooze
          : current.takeover?.allowSnooze ?? true,
      snoozeMinutes:
        typeof takeoverPatch.snoozeMinutes === 'number'
          ? clamp(Math.round(takeoverPatch.snoozeMinutes), 1, 15)
          : current.takeover?.snoozeMinutes ?? 5,
      restWarning:
        typeof takeoverPatch.restWarning === 'boolean'
          ? takeoverPatch.restWarning
          : current.takeover?.restWarning ?? true,
      windowMode:
        takeoverPatch.windowMode === 'fullscreen' || takeoverPatch.windowMode === 'window'
          ? takeoverPatch.windowMode
          : current.takeover?.windowMode ?? 'window'
    },
    sound: {
      chimeAtRestStart:
        typeof soundPatch.chimeAtRestStart === 'boolean'
          ? soundPatch.chimeAtRestStart
          : current.sound?.chimeAtRestStart ?? true,
      chimeAtRestEnd:
        typeof soundPatch.chimeAtRestEnd === 'boolean'
          ? soundPatch.chimeAtRestEnd
          : current.sound?.chimeAtRestEnd ?? true
    },
    autostart:
      typeof patch?.autostart === 'boolean'
        ? patch.autostart
        : current.autostart ?? false,
    miniFocusWindow:
      typeof patch?.miniFocusWindow === 'boolean'
        ? patch.miniFocusWindow
        : current.miniFocusWindow ?? true
  }
}

export const defaultSoundPacks: SoundPack[] = [
  {
    id: 'soft-tones',
    name: 'Soft tones',
    isBuiltIn: true,
    in: 'builtin:soft-tones-in',
    hold: 'builtin:soft-tones-hold',
    out: 'builtin:soft-tones-out'
  },
  {
    id: 'singing-bowl',
    name: 'Singing bowl',
    isBuiltIn: true,
    in: 'builtin:singing-bowl-in',
    hold: 'builtin:singing-bowl-hold',
    out: 'builtin:singing-bowl-out'
  },
  {
    id: 'calm-voice',
    name: 'Calm voice',
    isBuiltIn: true,
    in: 'builtin:calm-voice-in',
    hold: 'builtin:calm-voice-hold',
    out: 'builtin:calm-voice-out'
  }
]

export const initialSeedActivities: Activity[] = []

import { builtInActivities } from './builtInActivities'

export const defaultLibrary: LibrarySettings = {
  custom: [],
  soundPacks: defaultSoundPacks,
  defaults: {
    restActivityId: null,
    breathingSoundPackId: null,
    breathingSoundVolume: 0
  }
}

const defaultPrefs: UserPrefs = {
  focusMinutes: 30,
  restMinutes: 5,
  loopCount: 2,
  restActivityIds: [null, null, null, null, null, null, null, null],
  sidebarCollapsed: true, // Collapsed by default as per spec
  defaults: {
    restActivityId: null
  }
}

const defaultSession: SessionResume = {
  lastActiveTimestamp: Date.now(),
  activeSessionId: null,
  lastStage: 'idle',
  completedDurationSeconds: 0
}

let storeInstance: Store<StoreSchema> | null = null

export function inferPhaseKind(label: string, index: number, total: number): PhaseKind {
  const l = (label || '').toLowerCase()
  if (l.includes('in') || l.includes('inhale')) return 'in'
  if (l.includes('out') || l.includes('ex') || l.includes('exhale')) return 'out'
  if (l.includes('hold') || l.includes('pause') || l.includes('stay')) return 'hold'
  if (index === 0) return 'in'
  if (index === total - 1) return 'out'
  return 'hold'
}

export function migrateStoredLibrary(rawLibrary: any): { library: LibrarySettings; changed: boolean } {
  let changed = false
  if (!rawLibrary || typeof rawLibrary !== 'object') {
    return {
      library: {
        custom: [],
        defaults: { restActivityId: null, breathingSoundPackId: 'soft-tones', breathingSoundVolume: 0.8 },
        soundPacks: defaultSoundPacks
      },
      changed: true
    }
  }

  const sourceActivities = Array.isArray(rawLibrary.custom)
    ? rawLibrary.custom
    : Array.isArray(rawLibrary.activities)
    ? rawLibrary.activities
    : []

  if (!Array.isArray(rawLibrary.custom) && Array.isArray(rawLibrary.activities)) {
    changed = true
  }

  const migratedCustom: Activity[] = []

  for (const raw of sourceActivities) {
    if (!raw || typeof raw !== 'object') {
      changed = true
      continue
    }

    // Drop any stored record with isBuiltIn: true (built-ins now come from code)
    if (raw.isBuiltIn || raw.builtIn) {
      changed = true
      continue
    }

    const id = typeof raw.id === 'string' ? raw.id : `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const name = typeof raw.name === 'string' ? raw.name.trim() : typeof raw.title === 'string' ? raw.title.trim() : 'Activity'
    const note = typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim().slice(0, 120) : undefined

    let type: ActivityType | undefined = undefined
    let phases: { label: string; seconds: number; kind?: PhaseKind }[] | undefined = undefined
    let steps: { name: string; seconds: number }[] | undefined = undefined
    let media: { kind: 'youtube' | 'spotify'; url: string } | undefined = undefined

    if (raw.type === 'breathing') {
      type = 'breathing'
      if (Array.isArray(raw.phases) && raw.phases.length > 0) {
        phases = raw.phases.slice(0, 8).map((p: any, idx: number) => {
          let label = ''
          let seconds = 4
          if (Array.isArray(p)) {
            changed = true
            label = String(p[0] || 'Phase').trim().slice(0, 24)
            seconds = Math.max(1, Math.min(30, Number(p[1]) || 4))
          } else if (p && typeof p === 'object') {
            label = String(p.label || 'Phase').trim().slice(0, 24)
            seconds = Math.max(1, Math.min(30, Number(p.seconds) || 4))
          }
          return { label: label || 'Phase', seconds, kind: inferPhaseKind(label, idx, raw.phases.length) }
        })
      } else {
        phases = [{ label: 'Inhale', seconds: 4, kind: 'in' }, { label: 'Exhale', seconds: 6, kind: 'out' }]
      }
    } else if (raw.type === 'routine') {
      type = 'routine'
      if (Array.isArray(raw.steps) && raw.steps.length > 0) {
        steps = raw.steps.slice(0, 12).map((s: any) => ({
          name: String(s.name || s.label || 'Step').trim().slice(0, 24),
          seconds: Math.max(5, Math.min(300, Number(s.seconds) || 30))
        }))
      } else {
        steps = [{ name: 'Neck rolls', seconds: 30 }, { name: 'Shoulder rolls', seconds: 30 }]
      }
    } else if (raw.type === 'custom') {
      // old type:'custom' -> no type; drop minutes
      changed = true
      type = undefined
    } else if (raw.type === 'youtube' || raw.type === 'spotify') {
      // old type:'youtube'|'spotify' -> no type, media = { kind, url }
      changed = true
      type = undefined
      media = { kind: raw.type, url: String(raw.url || '') }
    }

    if (raw.media && typeof raw.media === 'object' && (raw.media.kind === 'youtube' || raw.media.kind === 'spotify')) {
      media = { kind: raw.media.kind, url: String(raw.media.url || '') }
    }

    if ('minutes' in raw) {
      changed = true
    }

    const activity: Activity = {
      id,
      name: name.slice(0, 40),
      builtIn: false,
      ...(note ? { note } : {}),
      ...(type ? { type } : {}),
      ...(phases ? { phases } : {}),
      ...(steps ? { steps } : {}),
      ...(media ? { media } : {})
    }

    migratedCustom.push(activity)
  }

  // Handle defaults: if default pointed at one that no longer exists, clear default
  const rawDefaults = rawLibrary.defaults || {}
  let restActivityId = typeof rawDefaults.restActivityId === 'string' ? rawDefaults.restActivityId : null
  const allIds = new Set([...builtInActivities.map((b) => b.id), ...migratedCustom.map((c) => c.id)])
  if (restActivityId && !allIds.has(restActivityId)) {
    restActivityId = null
    changed = true
  }

  const defaults = {
    ...rawDefaults,
    restActivityId,
    breathingSoundPackId: rawDefaults.breathingSoundPackId ?? null,
    breathingSoundVolume: typeof rawDefaults.breathingSoundVolume === 'number' ? rawDefaults.breathingSoundVolume : 0
  }

  const existingPacks = Array.isArray(rawLibrary.soundPacks) && rawLibrary.soundPacks.length > 0
    ? rawLibrary.soundPacks
    : []
  const packMap = new Map<string, SoundPack>()
  for (const p of defaultSoundPacks) {
    packMap.set(p.id, p)
  }
  for (const p of existingPacks) {
    packMap.set(p.id, p)
  }
  const soundPacks = Array.from(packMap.values())

  return {
    library: {
      custom: migratedCustom,
      defaults,
      soundPacks
    },
    changed
  }
}

export function getFullLibrary(): { activities: Activity[]; defaultId?: string } {
  const store = getStore()
  const lib = store.get('library')
  const custom = lib?.custom || []
  const defaultId = lib?.defaults?.restActivityId || undefined
  return {
    activities: [...builtInActivities, ...custom],
    defaultId
  }
}

export function initStore(): Store<StoreSchema> {
  if (!storeInstance) {
    storeInstance = new Store<StoreSchema>({
      name: 'revive-storage',
      defaults: {
        settings: defaultSettings,
        library: defaultLibrary,
        session: defaultSession,
        persistedSession: null,
        prefs: defaultPrefs,
        lastBootTime: Date.now()
      }
    })

    // Validate/migrate settings
    const rawSettings = storeInstance.get('settings') as any
    const mergedSettings = clampAndMergeSettings(defaultSettings, rawSettings || {})

    // Check if library has older nudges block to migrate
    const rawLibrary = storeInstance.get('library') as any
    if (rawLibrary && typeof rawLibrary === 'object' && 'nudges' in rawLibrary) {
      if (rawLibrary.nudges) {
        if (rawLibrary.nudges.eyeBreak) {
          mergedSettings.nudges.eyeBreak = {
            enabled: Boolean(rawLibrary.nudges.eyeBreak.enabled ?? mergedSettings.nudges.eyeBreak.enabled),
            intervalMinutes: clamp(snapToStep(rawLibrary.nudges.eyeBreak.intervalMinutes ?? 20, 5), 5, 120)
          }
        }
        if (rawLibrary.nudges.drinkWater) {
          mergedSettings.nudges.drinkWater = {
            enabled: Boolean(rawLibrary.nudges.drinkWater.enabled ?? mergedSettings.nudges.drinkWater.enabled),
            intervalMinutes: clamp(snapToStep(rawLibrary.nudges.drinkWater.intervalMinutes ?? 45, 5), 5, 180)
          }
        }
      }
      const { nudges: _oldNudges, ...cleanedLib } = rawLibrary
      storeInstance.set('library', cleanedLib)
    }

    storeInstance.set('settings', mergedSettings)

    // Validate/migrate library schema per v2 spec
    const { library: migratedLib, changed: libChanged } = migrateStoredLibrary(storeInstance.get('library'))
    if (libChanged || !storeInstance.has('library.custom')) {
      storeInstance.set('library', migratedLib)
    }

    // Ensure prefs exist and default collapsed is true
    const currentPrefs = storeInstance.get('prefs')
    if (!currentPrefs) {
      storeInstance.set('prefs', defaultPrefs)
    }
  }
  return storeInstance
}

export function getStore(): Store<StoreSchema> {
  if (!storeInstance) {
    return initStore()
  }
  return storeInstance
}
