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
  BreathingPhase
} from '../shared/types'

export const defaultSettings: AppSettings = {
  nudges: {
    eyeBreak: { enabled: true, intervalMinutes: 20 },
    drinkWater: { enabled: true, intervalMinutes: 45 }
  },
  takeover: {
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
      }
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
          : current.takeover?.restWarning ?? true
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
  }
]

export const initialSeedActivities: Activity[] = [
  {
    id: 'b1',
    type: 'breathing',
    name: 'Box breathing',
    title: 'Box breathing',
    isBuiltIn: true,
    phases: [
      { label: 'Inhale', seconds: 4, kind: 'in' },
      { label: 'Hold', seconds: 4, kind: 'hold' },
      { label: 'Exhale', seconds: 4, kind: 'out' },
      { label: 'Hold', seconds: 4, kind: 'hold' }
    ],
    createdAt: 1
  },
  {
    id: 'b2',
    type: 'breathing',
    name: '4-7-8 breathing',
    title: '4-7-8 breathing',
    isBuiltIn: true,
    phases: [
      { label: 'Inhale', seconds: 4, kind: 'in' },
      { label: 'Hold', seconds: 7, kind: 'hold' },
      { label: 'Exhale', seconds: 8, kind: 'out' }
    ],
    createdAt: 2
  },
  {
    id: 'b3',
    type: 'breathing',
    name: 'Coherence',
    title: 'Coherence',
    isBuiltIn: true,
    phases: [
      { label: 'Inhale', seconds: 5, kind: 'in' },
      { label: 'Exhale', seconds: 5, kind: 'out' }
    ],
    createdAt: 3
  },
  {
    id: 'c1',
    type: 'custom',
    name: 'Walk outside',
    title: 'Walk outside',
    isBuiltIn: false,
    note: 'Leave the screen. Stretch your legs.',
    createdAt: 4
  }
]

export const defaultLibrary: LibrarySettings = {
  activities: initialSeedActivities,
  soundPacks: defaultSoundPacks,
  defaults: {
    restActivityId: null,
    breathingSoundPackId: 'soft-tones',
    breathingSoundVolume: 0.8
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

function inferPhaseKind(label: string, index: number, total: number): PhaseKind {
  const l = (label || '').toLowerCase()
  if (l.includes('in') || l.includes('inhale')) return 'in'
  if (l.includes('out') || l.includes('ex') || l.includes('exhale')) return 'out'
  if (l.includes('hold') || l.includes('pause') || l.includes('stay')) return 'hold'
  if (index === 0) return 'in'
  if (index === total - 1) return 'out'
  return 'hold'
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

    // Validate/migrate library schema
    const updatedLibrary = storeInstance.get('library') as any
    if (!updatedLibrary || Array.isArray(updatedLibrary)) {
      // Migrate from flat array or empty
      storeInstance.set('library', defaultLibrary)
    } else if (!updatedLibrary.activities || updatedLibrary.activities.length === 0) {
      storeInstance.set('library', defaultLibrary)
    } else {
      let changed = false
      // Migration 1: Remove minutes property from all stored activities
      // Migration 2: Ensure breathing phases have kind property
      const cleanedActivities = updatedLibrary.activities.map((a: any) => {
        let act = { ...a }
        if ('minutes' in act) {
          changed = true
          delete act.minutes
        }
        if (act.type === 'breathing' && Array.isArray(act.phases)) {
          const total = act.phases.length
          const upgradedPhases: BreathingPhase[] = act.phases.map((p: any, idx: number) => {
            if (!p.kind || (p.kind !== 'in' && p.kind !== 'hold' && p.kind !== 'out')) {
              changed = true
              return {
                ...p,
                kind: inferPhaseKind(p.label || '', idx, total)
              }
            }
            return p
          })
          act.phases = upgradedPhases
        }
        return act
      })

      // Ensure soundPacks exist
      let soundPacks = updatedLibrary.soundPacks
      if (!Array.isArray(soundPacks) || soundPacks.length === 0) {
        soundPacks = defaultSoundPacks
        changed = true
      }

      // Ensure defaults include sound settings
      const currentDefaults = updatedLibrary.defaults || {}
      const updatedDefaults = {
        restActivityId: currentDefaults.restActivityId ?? null,
        breathingSoundPackId: currentDefaults.breathingSoundPackId ?? 'soft-tones',
        breathingSoundVolume: currentDefaults.breathingSoundVolume ?? 0.8
      }
      if (
        currentDefaults.breathingSoundPackId === undefined ||
        currentDefaults.breathingSoundVolume === undefined
      ) {
        changed = true
      }

      if (changed) {
        storeInstance.set('library', {
          ...updatedLibrary,
          activities: cleanedActivities,
          soundPacks,
          defaults: updatedDefaults
        })
      }
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
