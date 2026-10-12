import { describe, it, expect } from 'vitest'
import { Activity, ActivityType, LibrarySettings } from '../../shared/types'
import { initialSeedActivities } from '../store'

function validateActivityInput(
  rawInput: Partial<Activity>,
  forcedType?: ActivityType
):
  | {
      ok: true
      data: {
        name: string
        type: ActivityType
        phases?: { label: string; seconds: number }[]
        url?: string
        note?: string
      }
    }
  | { ok: false; error: string } {
  const name = typeof rawInput.name === 'string' ? rawInput.name.trim() : ''
  if (!name || name.length > 40) {
    return { ok: false, error: 'Give it a name.' }
  }

  const type = forcedType || rawInput.type
  if (!type || !['breathing', 'custom', 'youtube', 'spotify'].includes(type)) {
    return { ok: false, error: 'Invalid activity type.' }
  }

  let phases: { label: string; seconds: number }[] | undefined
  let url: string | undefined

  if (type === 'breathing') {
    if (!Array.isArray(rawInput.phases) || rawInput.phases.length === 0) {
      return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
    }
    phases = []
    for (const p of rawInput.phases) {
      const l = typeof p?.label === 'string' ? p.label.trim() : ''
      const s = Math.round(Number(p?.seconds))
      if (!l || l.length > 16 || !Number.isInteger(s) || s < 1 || s > 30) {
        return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
      }
      phases.push({ label: l, seconds: s })
    }
  } else if (type === 'custom') {
    // minutes ignored
  } else if (type === 'youtube') {
    const rawUrl = typeof rawInput.url === 'string' ? rawInput.url.trim() : ''
    try {
      const parsed = new URL(rawUrl)
      const validHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']
      if (!validHosts.includes(parsed.hostname.toLowerCase())) {
        return { ok: false, error: 'Paste a valid YouTube video link.' }
      }
      const hasVideoId =
        (parsed.hostname.toLowerCase() === 'youtu.be' && parsed.pathname.length > 1) ||
        Boolean(parsed.searchParams.get('v'))
      if (!hasVideoId) {
        return { ok: false, error: 'Paste a valid YouTube video link.' }
      }
      url = parsed.toString()
    } catch {
      return { ok: false, error: 'Paste a valid YouTube video link.' }
    }
  } else if (type === 'spotify') {
    const rawUrl = typeof rawInput.url === 'string' ? rawInput.url.trim() : ''
    try {
      const parsed = new URL(rawUrl)
      if (parsed.hostname.toLowerCase() !== 'open.spotify.com') {
        return { ok: false, error: 'Paste a valid Spotify link.' }
      }
      const spotifyPathRegex = /^\/(track|album|playlist|episode|show|artist)\/[a-zA-Z0-9]+(\/.*)?$/
      if (!spotifyPathRegex.test(parsed.pathname)) {
        return { ok: false, error: 'Paste a valid Spotify link.' }
      }
      url = parsed.toString()
    } catch {
      return { ok: false, error: 'Paste a valid Spotify link.' }
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
      type,
      phases,
      url,
      note
    }
  }
}

function generateDuplicateName(sourceName: string, existingNames: Set<string>): string {
  let copyIndex = 1
  while (true) {
    const suffix = copyIndex === 1 ? ' copy' : ` copy ${copyIndex}`
    const maxBaseLen = 40 - suffix.length
    const base = sourceName.slice(0, maxBaseLen).trimEnd()
    const candidate = `${base}${suffix}`
    if (!existingNames.has(candidate)) {
      return candidate
    }
    copyIndex++
  }
}

describe('Library Data Model & Validation', () => {
  it('seeds 3 built-in breathing activities and 1 starter custom activity without minutes', () => {
    expect(initialSeedActivities.length).toBe(4)
    const builtIns = initialSeedActivities.filter((a) => a.isBuiltIn)
    expect(builtIns.length).toBe(3)
    expect(builtIns.map((b) => b.name)).toEqual(['Box breathing', '4-7-8 breathing', 'Coherence'])

    const custom = initialSeedActivities.find((a) => a.type === 'custom')
    expect(custom).toBeDefined()
    expect(custom?.name).toBe('Walk outside')
    expect(custom?.note).toBe('Leave the screen. Stretch your legs.')
    expect(custom?.isBuiltIn).toBe(false)
    expect((custom as any).minutes).toBeUndefined()
  })

  it('validates activity name constraints', () => {
    const emptyRes = validateActivityInput({ type: 'custom', name: '   ' })
    expect(emptyRes.ok).toBe(false)
    if (!emptyRes.ok) expect(emptyRes.error).toBe('Give it a name.')

    const longRes = validateActivityInput({
      type: 'custom',
      name: 'a'.repeat(41)
    })
    expect(longRes.ok).toBe(false)
    if (!longRes.ok) expect(longRes.error).toBe('Give it a name.')
  })

  it('validates custom activities without requiring minutes', () => {
    const valid = validateActivityInput({ type: 'custom', name: 'Walk outside', note: 'Stretch legs' })
    expect(valid.ok).toBe(true)
    if (valid.ok) {
      expect(valid.data.name).toBe('Walk outside')
      expect(valid.data.note).toBe('Stretch legs')
    }
  })

  it('validates breathing phases correctly', () => {
    const validRes = validateActivityInput({
      type: 'breathing',
      name: 'Test Breathing',
      phases: [
        { label: 'Inhale', seconds: 4, kind: 'in' },
        { label: 'Exhale', seconds: 6, kind: 'out' }
      ]
    })
    expect(validRes.ok).toBe(true)

    const invalidSeconds = validateActivityInput({
      type: 'breathing',
      name: 'Test Breathing',
      phases: [{ label: 'Inhale', seconds: 0, kind: 'in' }]
    })
    expect(invalidSeconds.ok).toBe(false)
    if (!invalidSeconds.ok) expect(invalidSeconds.error).toBe('Every phase needs a label and 1–30 seconds.')

    const invalidLabel = validateActivityInput({
      type: 'breathing',
      name: 'Test Breathing',
      phases: [{ label: '   ', seconds: 4, kind: 'in' }]
    })
    expect(invalidLabel.ok).toBe(false)
  })

  it('validates YouTube links strictly', () => {
    const valid = validateActivityInput({
      type: 'youtube',
      name: 'Yoga Routine',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    })
    expect(valid.ok).toBe(true)

    const validShort = validateActivityInput({
      type: 'youtube',
      name: 'Yoga Routine',
      url: 'https://youtu.be/dQw4w9WgXcQ'
    })
    expect(validShort.ok).toBe(true)

    const invalidHost = validateActivityInput({
      type: 'youtube',
      name: 'Yoga Routine',
      url: 'https://vimeo.com/123456'
    })
    expect(invalidHost.ok).toBe(false)
    if (!invalidHost.ok) expect(invalidHost.error).toBe('Paste a valid YouTube video link.')
  })

  it('validates Spotify links strictly', () => {
    const valid = validateActivityInput({
      type: 'spotify',
      name: 'Peaceful Ambient',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO'
    })
    expect(valid.ok).toBe(true)

    const invalidPath = validateActivityInput({
      type: 'spotify',
      name: 'Peaceful Ambient',
      url: 'https://open.spotify.com/invalid/123'
    })
    expect(invalidPath.ok).toBe(false)
    if (!invalidPath.ok) expect(invalidPath.error).toBe('Paste a valid Spotify link.')
  })

  it('rejects editing built-in activities', () => {
    const builtInActivity: Activity = {
      id: 'b1',
      type: 'breathing',
      name: 'Box breathing',
      isBuiltIn: true
    }
    const canEdit = !builtInActivity.isBuiltIn
    expect(canEdit).toBe(false)
  })

  it('generates duplicate names with proper suffixing and truncation', () => {
    const existing = new Set(['Box breathing'])
    const name1 = generateDuplicateName('Box breathing', existing)
    expect(name1).toBe('Box breathing copy')

    existing.add(name1)
    const name2 = generateDuplicateName('Box breathing', existing)
    expect(name2).toBe('Box breathing copy 2')

    existing.add(name2)
    const name3 = generateDuplicateName('Box breathing', existing)
    expect(name3).toBe('Box breathing copy 3')

    // Truncation check for 40-char names
    const longName = 'A'.repeat(40)
    const duplicateOfLong = generateDuplicateName(longName, existing)
    expect(duplicateOfLong.length).toBeLessThanOrEqual(40)
    expect(duplicateOfLong).toBe(`${'A'.repeat(35)} copy`)
  })

  it('migrates legacy stored activities by removing minutes idempotently', () => {
    const rawStored = [
      { id: 'c1', type: 'custom', name: 'Walk', isBuiltIn: false, minutes: 10, note: 'Walk' },
      { id: 'b1', type: 'breathing', name: 'Box', isBuiltIn: true }
    ]

    let changed = false
    const cleaned = rawStored.map((a: any) => {
      if ('minutes' in a) {
        changed = true
        const { minutes, ...rest } = a
        return rest
      }
      return a
    })

    expect(changed).toBe(true)
    expect(cleaned[0].minutes).toBeUndefined()
    expect(cleaned[0].name).toBe('Walk')

    // Running again: no change
    let changedSecond = false
    const cleanedSecond = cleaned.map((a: any) => {
      if ('minutes' in a) {
        changedSecond = true
        const { minutes, ...rest } = a
        return rest
      }
      return a
    })
    expect(changedSecond).toBe(false)
    expect(cleanedSecond).toEqual(cleaned)
  })

  it('handles cascading deletion logic for default and slot references', () => {
    let lib: LibrarySettings = {
      activities: [
        { id: 'b1', type: 'breathing', name: 'Box', isBuiltIn: true },
        { id: 'custom-1', type: 'custom', name: 'Custom One', isBuiltIn: false }
      ],
      defaults: { restActivityId: 'custom-1' }
    }

    let restSlotIds: (string | null)[] = ['custom-1', 'b1', null]

    // Delete custom-1
    const idToDelete = 'custom-1'
    lib.activities = lib.activities.filter((a) => a.id !== idToDelete)
    if (lib.defaults.restActivityId === idToDelete) {
      lib.defaults.restActivityId = null
    }
    restSlotIds = restSlotIds.map((s) => (s === idToDelete ? null : s))

    expect(lib.activities.length).toBe(1)
    expect(lib.defaults.restActivityId).toBeNull()
    expect(restSlotIds).toEqual([null, 'b1', null])
  })
})
