import React, { useState, useRef, useEffect } from 'react'
import { Activity, ActivityType, BreathingPhase } from '../../../shared/types'
import { Icon } from './Icon'
import { CycleBar } from './CycleBar'

interface AddActivityFormProps {
  editingActivity: Activity | null;
  onAddActivity: (
    input: Omit<Activity, 'id' | 'isBuiltIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  onUpdateActivity: (
    id: string,
    input: Omit<Activity, 'id' | 'isBuiltIn'>
  ) => Promise<{ ok: true; activity: Activity } | { ok: false; error: string }>;
  onCancelEdit: () => void;
  onSuccess: (activity: Activity) => void;
}

const typeOptions: { key: ActivityType; label: string; icon: string }[] = [
  { key: 'breathing', label: 'Breathing', icon: 'breathing' },
  { key: 'custom', label: 'Custom', icon: 'custom' },
  { key: 'youtube', label: 'YouTube', icon: 'youtube' },
  { key: 'spotify', label: 'Spotify', icon: 'spotify' }
]

function inferKind(label: string, idx: number, total: number): 'in' | 'hold' | 'out' {
  const l = (label || '').toLowerCase()
  if (l.includes('in') || l.includes('inhale')) return 'in'
  if (l.includes('out') || l.includes('ex') || l.includes('exhale')) return 'out'
  if (l.includes('hold') || l.includes('pause')) return 'hold'
  if (idx === 0) return 'in'
  if (idx === total - 1) return 'out'
  return 'hold'
}

export const AddActivityForm: React.FC<AddActivityFormProps> = ({
  editingActivity,
  onAddActivity,
  onUpdateActivity,
  onCancelEdit,
  onSuccess
}) => {
  const isEditMode = Boolean(editingActivity)

  const [type, setType] = useState<ActivityType>('breathing')
  const [name, setName] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [url, setUrl] = useState<string>('')
  const [phases, setPhases] = useState<BreathingPhase[]>([
    { label: 'Inhale', seconds: 4, kind: 'in' },
    { label: 'Exhale', seconds: 6, kind: 'out' }
  ])
  const [error, setError] = useState<string>('')

  const nameInputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const firstPhaseLabelRef = useRef<HTMLInputElement>(null)

  // Sync state when entering / switching / exiting edit mode
  useEffect(() => {
    if (editingActivity) {
      setType(editingActivity.type)
      setName(editingActivity.name)
      setNote(editingActivity.note || '')
      setUrl(editingActivity.url || '')
      setPhases(
        editingActivity.phases && editingActivity.phases.length > 0
          ? editingActivity.phases.map((p, idx, arr) => ({
              ...p,
              kind: p.kind || inferKind(p.label, idx, arr.length)
            }))
          : [
              { label: 'Inhale', seconds: 4, kind: 'in' },
              { label: 'Exhale', seconds: 6, kind: 'out' }
            ]
      )
      setError('')
    } else {
      setType('breathing')
      setName('')
      setNote('')
      setUrl('')
      setPhases([
        { label: 'Inhale', seconds: 4, kind: 'in' },
        { label: 'Exhale', seconds: 6, kind: 'out' }
      ])
      setError('')
    }
  }, [editingActivity])

  const handleTypeChange = (newType: ActivityType) => {
    if (isEditMode) return
    setType(newType)
    setError('')
  }

  const handlePhaseLabelChange = (index: number, val: string) => {
    setPhases((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        label: val,
        kind: inferKind(val, index, prev.length)
      }
      return next
    })
  }

  const handlePhaseSecondsChange = (index: number, val: string) => {
    const sanitized = val.replace(/\D/g, '')
    const num = sanitized === '' ? 0 : parseInt(sanitized, 10)
    setPhases((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], seconds: num }
      return next
    })
  }

  const handleAddPhase = () => {
    if (phases.length < 8) {
      setPhases((prev) => [...prev, { label: 'Hold', seconds: 4, kind: 'hold' }])
    }
  }

  const handleRemovePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const validateAndSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length > 40) {
      setError('Give it a name.')
      nameInputRef.current?.focus()
      return
    }

    if (type === 'breathing') {
      if (!phases.length) {
        setError('Every phase needs a label and 1–30 seconds.')
        return
      }
      for (const p of phases) {
        const l = p.label.trim()
        const s = p.seconds
        if (!l || l.length > 16 || s < 1 || s > 30) {
          setError('Every phase needs a label and 1–30 seconds.')
          firstPhaseLabelRef.current?.focus()
          return
        }
      }
    } else if (type === 'youtube') {
      const trimmedUrl = url.trim()
      try {
        const parsed = new URL(trimmedUrl)
        const validHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']
        const isHostValid = validHosts.includes(parsed.hostname.toLowerCase())
        const hasVideoId =
          (parsed.hostname.toLowerCase() === 'youtu.be' && parsed.pathname.length > 1) ||
          Boolean(parsed.searchParams.get('v'))
        if (!isHostValid || !hasVideoId) {
          setError('Paste a valid YouTube video link.')
          linkInputRef.current?.focus()
          return
        }
      } catch {
        setError('Paste a valid YouTube video link.')
        linkInputRef.current?.focus()
        return
      }
    } else if (type === 'spotify') {
      const trimmedUrl = url.trim()
      try {
        const parsed = new URL(trimmedUrl)
        const isHostValid = parsed.hostname.toLowerCase() === 'open.spotify.com'
        const spotifyPathRegex = /^\/(track|album|playlist|episode|show|artist)\/[a-zA-Z0-9]+(\/.*)?$/
        if (!isHostValid || !spotifyPathRegex.test(parsed.pathname)) {
          setError('Paste a valid Spotify link.')
          linkInputRef.current?.focus()
          return
        }
      } catch {
        setError('Paste a valid Spotify link.')
        linkInputRef.current?.focus()
        return
      }
    }

    const payload: Omit<Activity, 'id' | 'isBuiltIn'> = {
      type,
      name: trimmedName,
      title: trimmedName,
      note: note.trim() ? note.trim().slice(0, 120) : undefined,
      phases:
        type === 'breathing'
          ? phases.map((p, idx, arr) => ({
              label: p.label.trim(),
              seconds: p.seconds,
              kind: p.kind || inferKind(p.label, idx, arr.length)
            }))
          : undefined,
      url: type === 'youtube' || type === 'spotify' ? url.trim() : undefined
    }

    if (isEditMode && editingActivity) {
      const res = await onUpdateActivity(editingActivity.id, payload)
      if (res.ok) {
        setError('')
        setName('')
        setNote('')
        setUrl('')
        setPhases([
          { label: 'Inhale', seconds: 4, kind: 'in' },
          { label: 'Exhale', seconds: 6, kind: 'out' }
        ])
        onSuccess(res.activity)
      } else {
        setError(res.error)
        if (res.error === 'Give it a name.') {
          nameInputRef.current?.focus()
        } else if (res.error.includes('link')) {
          linkInputRef.current?.focus()
        }
      }
    } else {
      const res = await onAddActivity(payload)
      if (res.ok) {
        setError('')
        setName('')
        setNote('')
        setUrl('')
        setPhases([
          { label: 'Inhale', seconds: 4, kind: 'in' },
          { label: 'Exhale', seconds: 6, kind: 'out' }
        ])
        onSuccess(res.activity)
      } else {
        setError(res.error)
        if (res.error === 'Give it a name.') {
          nameInputRef.current?.focus()
        } else if (res.error.includes('link')) {
          linkInputRef.current?.focus()
        }
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditMode) {
        e.preventDefault()
        onCancelEdit()
      }
    } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
      validateAndSubmit()
    }
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Type Picker Tiles */}
      <div
        className={`types ${isEditMode ? 'locked' : ''}`}
        role="group"
        aria-label="Activity type selector"
      >
        {typeOptions.map((t) => {
          const isSelected = type === t.key
          return (
            <button
              key={t.key}
              type="button"
              className={`tile ${isSelected ? 'on' : ''}`}
              onClick={() => handleTypeChange(t.key)}
              aria-pressed={isSelected}
              aria-disabled={isEditMode && !isSelected ? true : undefined}
              aria-label={`Select ${t.label} type`}
            >
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Form Fields Container */}
      <div className="form">
        {/* Name Input */}
        <div className="f">
          <span className="label">Name</span>
          <input
            ref={nameInputRef}
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === 'breathing'
                ? 'My evening wind-down'
                : type === 'custom'
                ? 'Walk outside'
                : type === 'youtube'
                ? 'Dance break'
                : 'Calm playlist'
            }
          />
        </div>

        {/* Breathing Specific: Phases List */}
        {type === 'breathing' && (
          <>
            <div className="f">
              <span className="label">Phases</span>
              {phases.map((p, i) => (
                <div key={i} className="ph">
                  <input
                    ref={i === 0 ? firstPhaseLabelRef : undefined}
                    type="text"
                    maxLength={16}
                    value={p.label}
                    onChange={(e) => handlePhaseLabelChange(i, e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={p.seconds === 0 ? '' : p.seconds}
                    onChange={(e) => handlePhaseSecondsChange(i, e.target.value)}
                    style={{ width: '64px' }}
                  />
                  <button
                    type="button"
                    className="x"
                    disabled={phases.length <= 1}
                    onClick={() => handleRemovePhase(i)}
                    aria-label={`Remove phase ${i + 1}`}
                    title="Remove phase"
                    style={{ opacity: phases.length <= 1 ? 0.3 : 1 }}
                  >
                    <Icon name="x" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="pill addph"
              disabled={phases.length >= 8}
              onClick={handleAddPhase}
              style={{ opacity: phases.length >= 8 ? 0.3 : 1 }}
            >
              + Add phase
            </button>

            {/* Cycle Bar Visualizer */}
            <CycleBar phases={phases} />
          </>
        )}

        {/* YouTube / Spotify Specific: Link Input */}
        {(type === 'youtube' || type === 'spotify') && (
          <div className="f">
            <span className="label">{type === 'youtube' ? 'YouTube link' : 'Spotify link'}</span>
            <input
              ref={linkInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === 'youtube'
                  ? 'https://youtube.com/watch?v=…'
                  : 'https://open.spotify.com/…'
              }
            />
            <span className="hint">Plays in the rest screen · you end it with “I'm done”</span>
          </div>
        )}

        {/* Note Textarea */}
        <div className="f">
          <span className="label">
            {type === 'custom' ? 'Note shown on screen' : 'Note (optional)'}
          </span>
          <textarea
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === 'custom'
                ? 'Take a walk. Leave your phone.'
                : 'A reminder for yourself'
            }
          />
          {type === 'custom' && (
            <span className="hint">Runs for your whole rest · ends on its own</span>
          )}
        </div>
      </div>

      {/* Error Line */}
      <div className="err" role="alert" aria-live="polite">
        {error}
      </div>

      {/* Action Buttons */}
      {!isEditMode ? (
        <button
          type="button"
          className="btn"
          onClick={validateAndSubmit}
        >
          Add to library
        </button>
      ) : (
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            onClick={validateAndSubmit}
          >
            Save changes
          </button>
          <button
            type="button"
            className="pill cancel-btn"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
