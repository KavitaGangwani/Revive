import Store from 'electron-store'
import {
  StoreSchema,
  AppSettings,
  Activity,
  LibrarySettings,
  SessionResume,
  UserPrefs,
  PersistedSessionState,
  SessionConfig,
  SoundPack,
  PhaseKind,
  BreathingPhase,
  ActivityType,
  LibraryPayload
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
    chimeAtRestEnd: true,
    notificationSounds: true
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
          : current.sound?.chimeAtRestEnd ?? true,
      notificationSounds:
        typeof soundPatch.notificationSounds === 'boolean'
          ? soundPatch.notificationSounds
          : current.sound?.notificationSounds ?? true
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

import { BUILTIN_ACTIVITIES, mergeWithBuiltins } from '../shared/builtinActivities'

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

export function mapPhaseNameToType(nameOrLabel?: string): 'Inhale' | 'Hold' | 'Exhale' {
  const l = (nameOrLabel || '').toLowerCase()
  if (l.includes('hold') || l.includes('pause') || l.includes('stay') || l.includes('rest')) return 'Hold'
  if (l.includes('in') || l.includes('inhale')) return 'Inhale'
  if (l.includes('out') || l.includes('ex') || l.includes('exhale')) return 'Exhale'
  return 'Inhale'
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
        phases = raw.phases.slice(0, 8).map((p: any) => {
          let rawLabel = ''
          let seconds = 4
          if (Array.isArray(p)) {
            changed = true
            rawLabel = String(p[0] || '').trim()
            seconds = Math.max(1, Math.min(30, Number(p[1]) || 4))
          } else if (p && typeof p === 'object') {
            rawLabel = String(p.label || '').trim()
            seconds = Math.max(1, Math.min(30, Number(p.seconds) || 4))
          }
          const mappedType = mapPhaseNameToType(rawLabel)
          if (rawLabel !== mappedType) {
            changed = true
          }
          const kind: PhaseKind = mappedType === 'Inhale' ? 'in' : mappedType === 'Hold' ? 'hold' : 'out'
          return { label: mappedType, seconds, kind }
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
  const allIds = new Set(mergeWithBuiltins(migratedCustom).map((a) => a.id))
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

export function getFullLibrary(): LibraryPayload {
  const store = getStore()
  const lib = store.get('library')
  const custom = lib?.custom || []
  const defaultId = lib?.defaults?.restActivityId || undefined
  return {
    activities: mergeWithBuiltins(custom),
    defaultId,
    defaults: lib?.defaults
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
        draftConfig: null,
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

export function getDraftConfig(): { config: SessionConfig; savedSlotChoices: (string | null)[] } {
  const store = getStore()
  const saved = store.get('draftConfig') as any
  if (!saved || typeof saved !== 'object') {
    // Defaults (30 / 5 / 2) are used ONLY when nothing has ever been saved
    return {
      config: {
        focusMinutes: 30,
        restMinutes: 5,
        loopCount: 2,
        restActivityIds: [null, null]
      },
      savedSlotChoices: [null, null]
    }
  }

  const focusMinutes = typeof saved.focusMinutes === 'number' ? clamp(saved.focusMinutes, 5, 180) : 30
  const restMinutes = typeof saved.restMinutes === 'number' ? clamp(saved.restMinutes, 1, 60) : 5
  const loopCount = typeof saved.loopCount === 'number' ? clamp(saved.loopCount, 1, 8) : 2

  const savedSlotChoices: (string | null)[] = Array.isArray(saved.savedSlotChoices)
    ? saved.savedSlotChoices.map((id: any) => (typeof id === 'string' ? id : null))
    : Array.isArray(saved.restActivityIds)
    ? saved.restActivityIds.map((id: any) => (typeof id === 'string' ? id : null))
    : []

  const restActivityIds: (string | null)[] = Array.from(
    { length: loopCount },
    (_, i) => (typeof savedSlotChoices[i] === 'string' ? savedSlotChoices[i] : null)
  )

  return {
    config: {
      focusMinutes,
      restMinutes,
      loopCount,
      restActivityIds
    },
    savedSlotChoices
  }
}

export function saveDraftConfig(
  draft: SessionConfig & { savedSlotChoices?: (string | null)[] }
): { config: SessionConfig; savedSlotChoices: (string | null)[] } {
  const store = getStore()
  const focusMinutes = clamp(Math.round(draft.focusMinutes ?? 30), 5, 180)
  const restMinutes = clamp(Math.round(draft.restMinutes ?? 5), 1, 60)
  const loopCount = clamp(Math.round(draft.loopCount ?? 2), 1, 8)

  const savedSlotChoices: (string | null)[] = Array.isArray(draft.savedSlotChoices)
    ? [...draft.savedSlotChoices]
    : []

  if (Array.isArray(draft.restActivityIds)) {
    draft.restActivityIds.forEach((id, idx) => {
      if (idx < 8) {
        savedSlotChoices[idx] = typeof id === 'string' ? id : (savedSlotChoices[idx] ?? null)
      }
    })
  }

  const restActivityIds: (string | null)[] = Array.from(
    { length: loopCount },
    (_, i) => (typeof savedSlotChoices[i] === 'string' ? savedSlotChoices[i] : null)
  )

  const toSave = {
    focusMinutes,
    restMinutes,
    loopCount,
    restActivityIds,
    savedSlotChoices
  }

  store.set('draftConfig', toSave)

  // Also sync to prefs for backwards compatibility
  store.set('prefs.focusMinutes', focusMinutes)
  store.set('prefs.restMinutes', restMinutes)
  store.set('prefs.loopCount', loopCount)
  store.set('prefs.restActivityIds', restActivityIds)

  return {
    config: {
      focusMinutes,
      restMinutes,
      loopCount,
      restActivityIds
    },
    savedSlotChoices
  }
}

export function pruneDraftSlotChoicesOnStart(loopCount: number): void {
  const store = getStore()
  const saved = store.get('draftConfig') as any
  if (saved && typeof saved === 'object') {
    const rawChoices = Array.isArray(saved.savedSlotChoices) ? saved.savedSlotChoices : []
    const pruned = rawChoices.slice(0, loopCount)
    store.set('draftConfig.savedSlotChoices', pruned)
  }
}

