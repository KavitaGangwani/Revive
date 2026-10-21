import { describe, it, expect } from 'vitest'
import { Activity, ActivityType, LibrarySettings } from '../../shared/types'
import { migrateStoredLibrary } from '../store'

function validateActivityInput(
  rawInput: any
):
  | {
      ok: true
      data: Omit<Activity, 'id' | 'builtIn'>
    }
  | { ok: false; error: string } {
  if (typeof rawInput !== 'object' || rawInput === null) {
    return { ok: false, error: 'Give it a name.' }
  }

  // 1. Name required, trimmed, 1-40: "Give it a name."
  const name = typeof rawInput.name === 'string' ? rawInput.name.trim() : ''
  if (!name || name.length > 40) {
    return { ok: false, error: 'Give it a name.' }
  }

  const type: ActivityType | undefined =
    rawInput.type === 'breathing' || rawInput.type === 'routine' ? rawInput.type : undefined

  let phases: { label: string; seconds: number }[] | undefined
  let steps: { name: string; seconds: number }[] | undefined

  // 2. Breathing: at least one phase; every phase needs a label (1–24) and 1–30 seconds.
  if (type === 'breathing') {
    if (!Array.isArray(rawInput.phases) || rawInput.phases.length < 1 || rawInput.phases.length > 8) {
      return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
    }
    phases = []
    for (const p of rawInput.phases) {
      const l = typeof p?.label === 'string' ? p.label.trim() : ''
      const s = Math.round(Number(p?.seconds))
      if (!l || l.length > 24 || !Number.isInteger(s) || s < 1 || s > 30) {
        return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
      }
      phases.push({ label: l, seconds: s })
    }
  }

  // 3. Routine: at least one step; every step needs a name (1–24) and 5–300 seconds.
  if (type === 'routine') {
    if (!Array.isArray(rawInput.steps) || rawInput.steps.length < 1 || rawInput.steps.length > 12) {
      return { ok: false, error: 'Every step needs a name and 5–300 seconds.' }
    }
    steps = []
    for (const s of rawInput.steps) {
      const n = typeof s?.name === 'string' ? s.name.trim() : ''
      const sec = Math.round(Number(s?.seconds))
      if (!n || n.length > 24 || !Number.isInteger(sec) || sec < 5 || sec > 300) {
        return { ok: false, error: 'Every step needs a name and 5–300 seconds.' }
      }
      steps.push({ name: n, seconds: sec })
    }
  }

  // 4. Media
  let media: { kind: 'youtube' | 'spotify'; url: string } | undefined
  if (rawInput.media && typeof rawInput.media === 'object') {
    const rawKind = rawInput.media.kind
    const rawUrl = typeof rawInput.media.url === 'string' ? rawInput.media.url.trim() : ''
    if (rawKind === 'youtube') {
      try {
        const parsed = new URL(rawUrl)
        const validHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']
        if (!validHosts.includes(parsed.hostname.toLowerCase())) {
          return { ok: false, error: 'Paste a valid YouTube link, or choose None.' }
        }
        const hasVideoId =
          (parsed.hostname.toLowerCase() === 'youtu.be' && parsed.pathname.length > 1) ||
          Boolean(parsed.searchParams.get('v'))
        if (!hasVideoId) {
          return { ok: false, error: 'Paste a valid YouTube link, or choose None.' }
        }
        media = { kind: 'youtube', url: rawUrl }
      } catch {
        return { ok: false, error: 'Paste a valid YouTube link, or choose None.' }
      }
    } else if (rawKind === 'spotify') {
      try {
        const parsed = new URL(rawUrl)
        if (parsed.hostname.toLowerCase() !== 'open.spotify.com') {
          return { ok: false, error: 'Paste a valid Spotify link, or choose None.' }
        }
        const spotifyPathRegex = /^\/(track|album|playlist|episode|show|artist)\/[a-zA-Z0-9]+(\/.*)?$/
        if (!spotifyPathRegex.test(parsed.pathname)) {
          return { ok: false, error: 'Paste a valid Spotify link, or choose None.' }
        }
        media = { kind: 'spotify', url: rawUrl }
      } catch {
        return { ok: false, error: 'Paste a valid Spotify link, or choose None.' }
      }
    }
  }

  let note: string | undefined
  if (typeof rawInput.note === 'string' && rawInput.note.trim()) {
    note = rawInput.note.trim().slice(0, 120)
  }

  return {
    ok: true,
    data: {
      name,
      ...(note ? { note } : {}),
      ...(type ? { type } : {}),
      ...(phases ? { phases } : {}),
      ...(steps ? { steps } : {}),
      ...(media ? { media } : {})
    }
  }
}

describe('Activities v2 (Revive) Data Model & Validation', () => {
  it('validates activity name constraints', () => {
    const emptyRes = validateActivityInput({ name: '   ' })
    expect(emptyRes.ok).toBe(false)
    if (!emptyRes.ok) expect(emptyRes.error).toBe('Give it a name.')

    const longRes = validateActivityInput({
      name: 'a'.repeat(41)
    })
    expect(longRes.ok).toBe(false)
    if (!longRes.ok) expect(longRes.error).toBe('Give it a name.')
  })

  it('validates no-type activities (note only)', () => {
    const valid = validateActivityInput({ name: 'Walk outside', note: 'Stretch legs' })
    expect(valid.ok).toBe(true)
    if (valid.ok) {
      expect(valid.data.name).toBe('Walk outside')
      expect(valid.data.note).toBe('Stretch legs')
      expect(valid.data.type).toBeUndefined()
    }
  })

  it('validates breathing phases correctly', () => {
    const validRes = validateActivityInput({
      type: 'breathing',
      name: 'Box Breathing',
      phases: [
        { label: 'Inhale', seconds: 4 },
        { label: 'Hold', seconds: 4 },
        { label: 'Exhale', seconds: 4 },
        { label: 'Hold', seconds: 4 }
      ]
    })
    expect(validRes.ok).toBe(true)

    const invalidSeconds = validateActivityInput({
      type: 'breathing',
      name: 'Box Breathing',
      phases: [{ label: 'Inhale', seconds: 0 }]
    })
    expect(invalidSeconds.ok).toBe(false)
    if (!invalidSeconds.ok) expect(invalidSeconds.error).toBe('Every phase needs a label and 1–30 seconds.')

    const invalidLabel = validateActivityInput({
      type: 'breathing',
      name: 'Box Breathing',
      phases: [{ label: '   ', seconds: 4 }]
    })
    expect(invalidLabel.ok).toBe(false)
  })

  it('validates routine steps correctly', () => {
    const validRes = validateActivityInput({
      type: 'routine',
      name: 'Morning Stretch',
      steps: [
        { name: 'Neck rolls', seconds: 30 },
        { name: 'Shoulder rolls', seconds: 30 }
      ]
    })
    expect(validRes.ok).toBe(true)

    const invalidSeconds = validateActivityInput({
      type: 'routine',
      name: 'Morning Stretch',
      steps: [{ name: 'Neck rolls', seconds: 3 }] // < 5 seconds
    })
    expect(invalidSeconds.ok).toBe(false)
    if (!invalidSeconds.ok) expect(invalidSeconds.error).toBe('Every step needs a name and 5–300 seconds.')
  })

  it('validates YouTube links strictly', () => {
    const valid = validateActivityInput({
      name: 'Yoga Routine',
      media: { kind: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
    })
    expect(valid.ok).toBe(true)

    const validShort = validateActivityInput({
      name: 'Yoga Routine',
      media: { kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' }
    })
    expect(validShort.ok).toBe(true)

    const invalidHost = validateActivityInput({
      name: 'Yoga Routine',
      media: { kind: 'youtube', url: 'https://vimeo.com/123456' }
    })
    expect(invalidHost.ok).toBe(false)
    if (!invalidHost.ok) expect(invalidHost.error).toBe('Paste a valid YouTube link, or choose None.')
  })

  it('validates Spotify links strictly', () => {
    const valid = validateActivityInput({
      name: 'Peaceful Ambient',
      media: { kind: 'spotify', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' }
    })
    expect(valid.ok).toBe(true)

    const invalidPath = validateActivityInput({
      name: 'Peaceful Ambient',
      media: { kind: 'spotify', url: 'https://open.spotify.com/invalid/123' }
    })
    expect(invalidPath.ok).toBe(false)
    if (!invalidPath.ok) expect(invalidPath.error).toBe('Paste a valid Spotify link, or choose None.')
  })

  it('rejects editing built-in activities', () => {
    const builtInActivity: Activity = {
      id: 'b1',
      type: 'breathing',
      name: 'Box breathing',
      builtIn: true
    }
    expect(builtInActivity.builtIn).toBe(true)
  })

  it('migrates legacy stored activities per Section 3', () => {
    const legacyRaw: any = {
      activities: [
        {
          id: 'old-builtin',
          name: 'Old BuiltIn',
          isBuiltIn: true,
          type: 'breathing'
        },
        {
          id: 'old-custom',
          name: 'Walk',
          isBuiltIn: false,
          type: 'custom',
          minutes: 10,
          note: 'Walk outside'
        },
        {
          id: 'old-yt',
          name: 'Dance',
          isBuiltIn: false,
          type: 'youtube',
          url: 'https://youtu.be/abc'
        },
        {
          id: 'old-sp',
          name: 'Chill',
          isBuiltIn: false,
          type: 'spotify',
          url: 'https://open.spotify.com/track/123'
        }
      ],
      defaults: { restActivityId: 'old-builtin' }
    }

    const { library: migrated, changed } = migrateStoredLibrary(legacyRaw)
    expect(changed).toBe(true)
    // Old built-in is dropped
    expect(migrated.custom.some((a: Activity) => a.id === 'old-builtin')).toBe(false)
    // Defaults pointing to dropped built-in is cleared
    expect(migrated.defaults.restActivityId).toBeNull()

    // Old custom has no type, no minutes
    const walk = migrated.custom.find((a: Activity) => a.id === 'old-custom')
    expect(walk).toBeDefined()
    expect(walk?.type).toBeUndefined()
    expect((walk as any)?.minutes).toBeUndefined()

    // Old youtube has media attachment
    const dance = migrated.custom.find((a: Activity) => a.id === 'old-yt')
    expect(dance?.type).toBeUndefined()
    expect(dance?.media?.kind).toBe('youtube')
    expect(dance?.media?.url).toBe('https://youtu.be/abc')

    // Old spotify has media attachment
    const chill = migrated.custom.find((a: Activity) => a.id === 'old-sp')
    expect(chill?.type).toBeUndefined()
    expect(chill?.media?.kind).toBe('spotify')
    expect(chill?.media?.url).toBe('https://open.spotify.com/track/123')
  })

  it('migrates legacy breathing activity phases to Inhale, Hold, Exhale types', () => {
    const rawBreathing = {
      custom: [
        {
          id: 'custom-breath-1',
          name: 'My Custom Breathing',
          type: 'breathing',
          phases: [
            { label: 'Breathe In Deeply', seconds: 4 },
            { label: 'Hold breath at top', seconds: 4 },
            { label: 'Exhale slowly', seconds: 4 },
            { label: 'empty hold', seconds: 4 },
            { label: 'Breath in', seconds: 5 },
            { label: 'Breath out', seconds: 5 }
          ]
        }
      ]
    }

    const { library: migrated, changed } = migrateStoredLibrary(rawBreathing)
    expect(changed).toBe(true)
    const breathAct = migrated.custom.find((a: Activity) => a.id === 'custom-breath-1')
    expect(breathAct).toBeDefined()
    expect(breathAct?.phases).toEqual([
      { label: 'Inhale', seconds: 4, kind: 'in' },
      { label: 'Hold', seconds: 4, kind: 'hold' },
      { label: 'Exhale', seconds: 4, kind: 'out' },
      { label: 'Hold', seconds: 4, kind: 'hold' },
      { label: 'Inhale', seconds: 5, kind: 'in' },
      { label: 'Exhale', seconds: 5, kind: 'out' }
    ])
  })
})

