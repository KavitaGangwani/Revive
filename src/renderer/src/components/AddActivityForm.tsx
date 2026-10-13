import React, { useState, useRef, useEffect } from 'react'
import { Activity, ActivityType } from '../../../shared/types'
import { Icon } from './Icon'
import { CycleBar } from './CycleBar'

interface AddActivityFormProps {
  editingActivity: Activity | null
  onAddActivity: (
    input: Omit<Activity, 'id' | 'builtIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>
  onUpdateActivity: (
    id: string,
    input: Omit<Activity, 'id' | 'builtIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>
  onCancelEdit: () => void
  onSuccess: (activity: Activity) => void
}

type SelectedType = 'none' | 'breathing' | 'routine'
type SelectedMedia = 'none' | 'youtube' | 'spotify'

interface PhaseState {
  label: string
  seconds: number | string
}

interface StepState {
  name: string
  seconds: number | string
}

export const AddActivityForm: React.FC<AddActivityFormProps> = ({
  editingActivity,
  onAddActivity,
  onUpdateActivity,
  onCancelEdit,
  onSuccess
}) => {
  const isEditMode = Boolean(editingActivity)

  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState<SelectedType>('none')
  const [note, setNote] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia>('none')
  const [mediaUrl, setMediaUrl] = useState('')

  const [phases, setPhases] = useState<PhaseState[]>([
    { label: 'Inhale', seconds: 4 },
    { label: 'Exhale', seconds: 6 }
  ])

  const [steps, setSteps] = useState<StepState[]>([
    { name: 'Neck rolls', seconds: 30 },
    { name: 'Shoulder rolls', seconds: 30 }
  ])

  const [error, setError] = useState('')

  const nameInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const firstPhaseRef = useRef<HTMLInputElement>(null)
  const firstStepRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync state on edit mode change
  useEffect(() => {
    if (editingActivity) {
      setName(editingActivity.name || '')
      setNote(editingActivity.note || '')

      if (editingActivity.type === 'breathing') {
        setSelectedType('breathing')
      } else if (editingActivity.type === 'routine') {
        setSelectedType('routine')
      } else {
        setSelectedType('none')
      }

      if (editingActivity.phases && editingActivity.phases.length > 0) {
        setPhases(editingActivity.phases.map((p) => ({ label: p.label, seconds: p.seconds })))
      } else {
        setPhases([
          { label: 'Inhale', seconds: 4 },
          { label: 'Exhale', seconds: 6 }
        ])
      }

      if (editingActivity.steps && editingActivity.steps.length > 0) {
        setSteps(editingActivity.steps.map((s) => ({ name: s.name, seconds: s.seconds })))
      } else {
        setSteps([
          { name: 'Neck rolls', seconds: 30 },
          { name: 'Shoulder rolls', seconds: 30 }
        ])
      }

      if (editingActivity.media?.kind === 'youtube') {
        setSelectedMedia('youtube')
        setMediaUrl(editingActivity.media.url || '')
      } else if (editingActivity.media?.kind === 'spotify') {
        setSelectedMedia('spotify')
        setMediaUrl(editingActivity.media.url || '')
      } else {
        setSelectedMedia('none')
        setMediaUrl('')
      }

      setError('')
    } else {
      resetForm()
    }
  }, [editingActivity])

  const resetForm = (): void => {
    setName('')
    setSelectedType('none')
    setNote('')
    setSelectedMedia('none')
    setMediaUrl('')
    setPhases([
      { label: 'Inhale', seconds: 4 },
      { label: 'Exhale', seconds: 6 }
    ])
    setSteps([
      { name: 'Neck rolls', seconds: 30 },
      { name: 'Shoulder rolls', seconds: 30 }
    ])
    setError('')
  }

  // Handle ESC inside form card to cancel edit
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape' && isEditMode) {
      e.stopPropagation()
      onCancelEdit()
    }
  }

  // Type placeholder
  const getNamePlaceholder = (): string => {
    if (selectedType === 'breathing') return 'Evening wind-down'
    if (selectedType === 'routine') return 'Morning stretch'
    return 'Walk outside'
  }

  // Routine total hint calculation
  const formatRoutineTotal = (): string => {
    const total = steps.reduce((acc, s) => acc + (Number(s.seconds) || 0), 0)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    if (mins > 0 && secs > 0) return `${mins}m ${secs}s`
    if (mins > 0) return `${mins}m`
    return `${secs}s`
  }

  // Breathing Phase Handlers
  const handlePhaseLabelChange = (index: number, val: string): void => {
    setPhases((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], label: val }
      return next
    })
  }

  const handlePhaseSecondsChange = (index: number, val: string): void => {
    const cleanDigits = val.replace(/\D/g, '')
    setPhases((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], seconds: cleanDigits }
      return next
    })
  }

  const handleAddPhase = (): void => {
    if (phases.length >= 8) return
    setPhases((prev) => [...prev, { label: 'Hold', seconds: 4 }])
  }

  const handleRemovePhase = (index: number): void => {
    if (phases.length <= 1) return
    setPhases((prev) => prev.filter((_, i) => i !== index))
  }

  // Routine Step Handlers
  const handleStepNameChange = (index: number, val: string): void => {
    setSteps((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], name: val }
      return next
    })
  }

  const handleStepSecondsChange = (index: number, val: string): void => {
    const cleanDigits = val.replace(/\D/g, '')
    setSteps((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], seconds: cleanDigits }
      return next
    })
  }

  const handleAddStep = (): void => {
    if (steps.length >= 12) return
    setSteps((prev) => [...prev, { name: 'Next move', seconds: 30 }])
  }

  const handleRemoveStep = (index: number): void => {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  // Submission & Validation per Section 7
  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault()
    setError('')

    // 1. Name required, trimmed, 1-40: "Give it a name."
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length > 40) {
      setError('Give it a name.')
      nameInputRef.current?.focus()
      return
    }

    // 2. Breathing validation
    let validatedPhases: { label: string; seconds: number }[] | undefined = undefined
    if (selectedType === 'breathing') {
      if (phases.length < 1 || phases.length > 8) {
        setError('Every phase needs a label and 1–30 seconds.')
        firstPhaseRef.current?.focus()
        return
      }
      validatedPhases = []
      for (const p of phases) {
        const pLabel = p.label.trim()
        const pSecs = Number(p.seconds)
        if (!pLabel || pLabel.length > 24 || !Number.isFinite(pSecs) || pSecs < 1 || pSecs > 30) {
          setError('Every phase needs a label and 1–30 seconds.')
          firstPhaseRef.current?.focus()
          return
        }
        validatedPhases.push({ label: pLabel, seconds: Math.round(pSecs) })
      }
    }

    // 3. Routine validation
    let validatedSteps: { name: string; seconds: number }[] | undefined = undefined
    if (selectedType === 'routine') {
      if (steps.length < 1 || steps.length > 12) {
        setError('Every step needs a name and 5–300 seconds.')
        firstStepRef.current?.focus()
        return
      }
      validatedSteps = []
      for (const s of steps) {
        const sName = s.name.trim()
        const sSecs = Number(s.seconds)
        if (!sName || sName.length > 24 || !Number.isFinite(sSecs) || sSecs < 5 || sSecs > 300) {
          setError('Every step needs a name and 5–300 seconds.')
          firstStepRef.current?.focus()
          return
        }
        validatedSteps.push({ name: sName, seconds: Math.round(sSecs) })
      }
    }

    // 4. Media validation
    let validatedMedia: { kind: 'youtube' | 'spotify'; url: string } | undefined = undefined
    if (selectedMedia === 'youtube') {
      try {
        const parsed = new URL(mediaUrl.trim())
        const host = parsed.hostname.toLowerCase()
        const validHost = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)
        let hasVideoId = false
        if (host === 'youtu.be') {
          hasVideoId = Boolean(parsed.pathname.slice(1).trim())
        } else {
          hasVideoId = Boolean(
            parsed.searchParams.get('v') ||
            parsed.pathname.startsWith('/embed/') ||
            parsed.pathname.startsWith('/shorts/')
          )
        }
        if (!validHost || !hasVideoId) {
          setError('Paste a valid YouTube link, or choose None.')
          mediaInputRef.current?.focus()
          return
        }
        validatedMedia = { kind: 'youtube', url: mediaUrl.trim() }
      } catch {
        setError('Paste a valid YouTube link, or choose None.')
        mediaInputRef.current?.focus()
        return
      }
    } else if (selectedMedia === 'spotify') {
      try {
        const parsed = new URL(mediaUrl.trim())
        const host = parsed.hostname.toLowerCase()
        const isSpotifyHost = host === 'open.spotify.com'
        const hasValidPath = /^\/(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/.test(parsed.pathname)
        if (!isSpotifyHost || !hasValidPath) {
          setError('Paste a valid Spotify link, or choose None.')
          mediaInputRef.current?.focus()
          return
        }
        validatedMedia = { kind: 'spotify', url: mediaUrl.trim() }
      } catch {
        setError('Paste a valid Spotify link, or choose None.')
        mediaInputRef.current?.focus()
        return
      }
    }

    // 5. Note optional, trimmed, max 120
    const trimmedNote = note.trim()
    if (trimmedNote.length > 120) {
      setError('Note must be 120 characters or fewer.')
      return
    }

    const payload: Omit<Activity, 'id' | 'builtIn'> = {
      name: trimmedName,
      ...(trimmedNote ? { note: trimmedNote } : {}),
      ...(selectedType !== 'none' ? { type: selectedType } : {}),
      ...(validatedPhases ? { phases: validatedPhases } : {}),
      ...(validatedSteps ? { steps: validatedSteps } : {}),
      ...(validatedMedia ? { media: validatedMedia } : {})
    }

    if (isEditMode && editingActivity) {
      const result = await onUpdateActivity(editingActivity.id, payload)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onSuccess(result.activity)
    } else {
      const result = await onAddActivity(payload)
      if (!result.ok) {
        setError(result.error)
        return
      }
      resetForm()
      onSuccess(result.activity)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="card activity-form-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0
      }}
    >
      <h2>{isEditMode ? 'Edit activity' : 'Add activity'}</h2>
      <p className="sub">
        {isEditMode ? `Editing "${editingActivity?.name}"` : 'Build your own and add it to your library.'}
      </p>

      <form
        onSubmit={handleSubmit}
        className="form"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '4px'
        }}
      >
        {/* 1. Name */}
        <div className="f">
          <label className="label">Name</label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={getNamePlaceholder()}
            aria-label="Activity name"
          />
        </div>

        {/* 2. Type Chips */}
        <div className="f">
          <label className="label">Type (optional)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['none', 'breathing', 'routine'] as SelectedType[]).map((t) => {
              const isSelected = selectedType === t
              const label = t === 'none' ? 'None' : t === 'breathing' ? 'Breathing' : 'Routine'
              return (
                <button
                  type="button"
                  key={t}
                  className={`pill ${isSelected ? 'on' : ''}`}
                  onClick={() => {
                    setSelectedType(t)
                    setError('')
                  }}
                  aria-pressed={isSelected}
                  style={{
                    height: '26px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {selectedType === 'breathing' && (
            <span style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '2px' }}>
              Phases that repeat, like inhale, hold, exhale.
            </span>
          )}
          {selectedType === 'routine' && (
            <span style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '2px' }}>
              Steps one after another, like a stretch or dance.
            </span>
          )}
        </div>

        {/* 3. Builder */}
        {selectedType === 'breathing' && (
          <div className="f" style={{ gap: '6px' }}>
            <label className="label">Phases</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {phases.map((p, index) => (
                <div key={index} className="ph" style={{ display: 'grid', gridTemplateColumns: '1fr 64px 26px', gap: '6px', alignItems: 'center' }}>
                  <input
                    ref={index === 0 ? firstPhaseRef : undefined}
                    type="text"
                    maxLength={24}
                    value={p.label}
                    onChange={(e) => handlePhaseLabelChange(index, e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={`Phase ${index + 1}`}
                    aria-label={`Phase ${index + 1} label`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={p.seconds}
                    onChange={(e) => handlePhaseSecondsChange(index, e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="4"
                    aria-label={`Phase ${index + 1} seconds`}
                    style={{ textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    className="x"
                    onClick={() => handleRemovePhase(index)}
                    disabled={phases.length <= 1}
                    aria-label="Remove phase"
                    style={{
                      opacity: phases.length <= 1 ? 0.3 : 1,
                      cursor: phases.length <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Icon name="x" style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="pill addph"
              onClick={handleAddPhase}
              disabled={phases.length >= 8}
              style={{
                alignSelf: 'flex-start',
                marginTop: '4px',
                opacity: phases.length >= 8 ? 0.4 : 1,
                cursor: phases.length >= 8 ? 'not-allowed' : 'pointer'
              }}
            >
              + Add phase
            </button>

            {/* Cycle Bar */}
            <CycleBar
              phases={phases.map((p) => ({
                label: p.label,
                seconds: Number(p.seconds) || 1
              }))}
            />
          </div>
        )}

        {selectedType === 'routine' && (
          <div className="f" style={{ gap: '6px' }}>
            <label className="label">Steps</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {steps.map((s, index) => (
                <div key={index} className="ph" style={{ display: 'grid', gridTemplateColumns: '1fr 64px 26px', gap: '6px', alignItems: 'center' }}>
                  <input
                    ref={index === 0 ? firstStepRef : undefined}
                    type="text"
                    maxLength={24}
                    value={s.name}
                    onChange={(e) => handleStepNameChange(index, e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={`Step ${index + 1}`}
                    aria-label={`Step ${index + 1} name`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={s.seconds}
                    onChange={(e) => handleStepSecondsChange(index, e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="30"
                    aria-label={`Step ${index + 1} seconds`}
                    style={{ textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    className="x"
                    onClick={() => handleRemoveStep(index)}
                    disabled={steps.length <= 1}
                    aria-label="Remove step"
                    style={{
                      opacity: steps.length <= 1 ? 0.3 : 1,
                      cursor: steps.length <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Icon name="x" style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="pill addph"
              onClick={handleAddStep}
              disabled={steps.length >= 12}
              style={{
                alignSelf: 'flex-start',
                marginTop: '4px',
                opacity: steps.length >= 12 ? 0.4 : 1,
                cursor: steps.length >= 12 ? 'not-allowed' : 'pointer'
              }}
            >
              + Add step
            </button>

            <span style={{ fontSize: '9.5px', color: 'var(--muted)', letterSpacing: '0.08em', marginTop: '2px' }}>
              Total {formatRoutineTotal()} · loops until rest ends
            </span>
          </div>
        )}

        {/* 4. Note shown on screen */}
        <div className="f">
          <label className="label">Note shown on screen</label>
          <textarea
            value={note}
            maxLength={120}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Gentle reminder or thought for this rest"
            aria-label="Note shown on screen"
            style={{
              height: '48px',
              resize: 'none',
              fontSize: '11px',
              lineHeight: 1.5
            }}
          />
        </div>

        {/* 5. Play along (optional) */}
        <div className="f">
          <label className="label">Play along (optional)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['none', 'youtube', 'spotify'] as SelectedMedia[]).map((m) => {
              const isSelected = selectedMedia === m
              const label = m === 'none' ? 'None' : m === 'youtube' ? 'YouTube' : 'Spotify'
              return (
                <button
                  type="button"
                  key={m}
                  className={`pill ${isSelected ? 'on' : ''}`}
                  onClick={() => {
                    setSelectedMedia(m)
                    setError('')
                  }}
                  aria-pressed={isSelected}
                  style={{
                    height: '26px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name={m} style={{ width: '13px', height: '13px' }} />
                  {label}
                </button>
              )
            })}
          </div>

          {selectedMedia !== 'none' && (
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                ref={mediaInputRef}
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  selectedMedia === 'youtube'
                    ? 'https://youtube.com/watch?v=...'
                    : 'https://open.spotify.com/track/...'
                }
                aria-label={`${selectedMedia === 'youtube' ? 'YouTube' : 'Spotify'} link`}
              />
              <span style={{ fontSize: '10px', color: 'var(--faint)' }}>
                Plays while this activity runs.
              </span>
            </div>
          )}
        </div>

        {/* 6. Error line (reserved so nothing shifts) */}
        <div
          className="err"
          role="alert"
          aria-live="polite"
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            minHeight: '12px',
            textAlign: 'center',
            marginTop: '4px'
          }}
        >
          {error}
        </div>

        {/* 7. Action buttons row */}
        <div
          className="btn-row"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: 'auto',
            paddingTop: '8px'
          }}
        >
          <button
            type="submit"
            className="btn"
            style={{
              height: '42px',
              padding: '0 24px',
              borderRadius: '999px',
              background: 'var(--accent)',
              color: '#000',
              fontWeight: 500,
              fontSize: '12px',
              margin: 0,
              cursor: 'pointer'
            }}
          >
            {isEditMode ? 'Save changes' : 'Add to library'}
          </button>
          {isEditMode && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancelEdit}
              style={{
                height: '42px',
                padding: '0 20px',
                borderRadius: '999px',
                border: '1px solid var(--hud-border)',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
