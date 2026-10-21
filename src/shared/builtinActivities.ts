// Built-in rest activities. Read-only; never written to library.custom.
import { Activity } from './types'

export const BUILTIN_ACTIVITIES: Activity[] = [
  // ───────────── Breathing ─────────────
  {
    id: 'builtin-diaphragmatic-breathing',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: 'Diaphragmatic breathing',
    type: 'breathing',
    tagline: 'Belly breathing to slow your heart rate',
    notes:
      'Place one hand on your chest and one on your belly. Breathe in gently through your nose, letting your belly rise. Breathe out slowly, letting your belly fall. Keep your chest relatively still. Continue comfortably',
    phases: [
      { kind: 'inhale', label: 'Inhale', seconds: 4 },
      { kind: 'exhale', label: 'Exhale', seconds: 6 }
    ],
    recommendedFor: 'Any rest. A good default.'
  },
  {
    id: 'builtin-box-breathing',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: 'Box breathing',
    type: 'breathing',
    tagline: 'Four equal sides: steady, focused calm',
    notes:
      'Breathe in through your nose for 4 counts. Hold gently for 4. Breathe out for 4. Hold for 4. Repeat the cycle. Keep every breath comfortable; no need to force the holds',
    phases: [
      { kind: 'inhale', label: 'Inhale', seconds: 4 },
      { kind: 'hold', label: 'Hold', seconds: 4 },
      { kind: 'exhale', label: 'Exhale', seconds: 4 },
      { kind: 'hold', label: 'Hold', seconds: 4 }
    ],
    recommendedFor: 'Stress or a scattered mind before the next focus round.'
  },
  {
    id: 'builtin-alternate-nostril-breathing',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: 'Alternate nostril breathing',
    type: 'breathing',
    tagline: 'Nadi shodhana: balance and settle',
    notes:
      'Close your right nostril and breathe in through your left. Close your left nostril, open your right, and breathe out. Breathe in through your right. Switch sides and breathe out through your left. Repeat gently ',
    phases: [
      { kind: 'inhale', label: 'Inhale', seconds: 4 },
      
      { kind: 'exhale', label: 'Exhale', seconds: 6 },
      { kind: 'inhale', label: 'Inhale', seconds: 4 },
     
      { kind: 'exhale', label: 'Exhale', seconds: 6 }
    ],
    recommendedFor: 'Winding down, or resetting when you feel tense or uneven.'
  },

  // ───────────── Media ─────────────
  {
    id: 'builtin-guided-grounding-meditation',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: 'Guided grounding meditation',
    type: 'none',
    tagline: 'A guided audio meditation to come back to the present',
    notes:
      'Sit or lie comfortably and soften your gaze. Follow the voice, notice your breath, and gently return your attention when your mind wanders. Set your volume beforehand. Meditation starts automatically and requires internet. ',
    media: {
      kind: 'spotify',
      url: 'https://open.spotify.com/episode/6k7N4HPc2SeMMltEtiBEGP',
      autoplay: true
    },
    recommendedFor: 'A full rest when you want your mind to quiet down.'
  },
  {
    id: 'builtin-dance-workout',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: '15-minute dance workout',
    type: 'none',
    tagline: 'Move, sweat, shake it all out',
    notes:
      'Clear some space, turn up the energy, and dance like nobody’s watching! Follow along, let loose, and have fun — no perfect moves needed. Start wherever you are and enjoy the rhythm. Even five minutes of rock ’n’ roll can lift your mood. Best for your final rest when it’s time to unwind. Internet required. ',
    media: { kind: 'youtube', url: 'https://www.youtube.com/watch?v=Jxyl2RYe1gs' },
    recommendedFor: 'The end of a session. Works in 5 minutes or the full 15.'
  },
  {
    id: 'builtin-quick-dance-break',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: 'Quick dance break',
    type: 'none',
    tagline: 'A short burst of movement to shake off the sitting',
    notes:
      'Clear some space, turn up the energy, and dance like nobody’s watching! Follow along, let loose, and have fun — no perfect moves needed. Start wherever you are and enjoy the rhythm. Even five minutes of rock ’n’ roll can lift your mood. Internet required. ' ,
    media: { kind: 'youtube', url: 'https://www.youtube.com/watch?v=7p3O_Q4Klkc' },
    recommendedFor: 'A quick mid-session reset between rounds.'
  },

  // ───────────── Routine ─────────────
  {
    id: 'builtin-desk-reset-routine',
    builtin: true,
    builtIn: true,
    isBuiltIn: true,
    name: 'Desk reset stretches',
    type: 'routine',
    tagline: 'Eight chair-friendly moves to undo desk work',
    notes:
      'Work through the steps in order, moving slowly and breathing steadily. ' +
      'Stretch to a mild pull, never pain. Skip any move that hurts.',
    steps: [
      {
        title: 'Seated spinal twist',
        body:
          'Sit up straight with your feet flat on the ground. Slowly twist your upper body to the right, keeping your hips facing forward. ' +
          'Hold 15-30 seconds, then repeat on the left. Increases spinal mobility and reduces stiffness.',
        seconds: 30
      },
      {
        title: 'Neck stretches',
        body:
          'Gently tilt your head to one side, bringing your ear toward your shoulder. Hold 15-30 seconds, then repeat on the other side. ' +
          'Keeps neck muscles relaxed and helps prevent stiffness and strain.',
        seconds: 30
      },
      {
        title: 'Shoulder rolls',
        body:
          'Sitting tall, roll your shoulders forward in big circles for 10 repetitions, then roll them backward. ' +
          'Releases tension in the upper back and shoulders.',
        seconds: 30
      },
      {
        title: 'Cat-cow stretch',
        body:
          'Sit upright with your hands on your knees. Inhale and arch your back (cow), then exhale and round your back (cat). ' +
          'Repeat 5-10 times. Improves spinal flexibility and eases lower back stiffness.',
        seconds: 30
      },
      {
        title: 'Wrist and finger stretches',
        body:
          'Extend one arm in front of you and gently pull your fingers back with the other hand. Hold 15-30 seconds, then switch hands. ',
        seconds: 30
      },
     
    ],
    recommendedFor: 'After a long stretch of sitting. About 7 minutes.'
  }
]

export const getBuiltinActivity = (id: string): Activity | undefined =>
  BUILTIN_ACTIVITIES.find((a) => a.id === id)

export const isBuiltinActivityId = (id?: string | null): boolean =>
  Boolean(id && BUILTIN_ACTIVITIES.some((a) => a.id === id))

/**
 * Merges BUILTIN_ACTIVITIES with custom activities without mutating custom list.
 * Built-ins appear first or as defined by the application.
 */
export function mergeWithBuiltins(custom: Activity[] = []): Activity[] {
  const customList = Array.isArray(custom) ? custom : []
  // Filter out any duplicate IDs if custom accidentally has a colliding ID
  const builtinIds = new Set(BUILTIN_ACTIVITIES.map((a) => a.id))
  const cleanCustom = customList.filter((a) => !builtinIds.has(a.id))
  return [...BUILTIN_ACTIVITIES, ...cleanCustom]
}

/**
 * Resolves an activity ID against both built-ins and custom activities.
 */
export function resolveActivity(id: string | null | undefined, custom?: Activity[]): Activity | undefined {
  if (!id) return undefined
  const builtin = getBuiltinActivity(id)
  if (builtin) return builtin
  if (custom && Array.isArray(custom)) {
    return custom.find((a) => a.id === id)
  }
  return undefined
}
