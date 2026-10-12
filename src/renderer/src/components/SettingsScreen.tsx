import React, { useState, useEffect, useCallback } from 'react'
import { AppSettings, DeepPartial } from '../../../shared/types'

const defaultSettings: AppSettings = {
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

// Custom Switch Component
interface SwitchProps {
  checked: boolean;
  onChange: (nextChecked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, ariaLabel, disabled = false }) => {
  const handleClick = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`settings-switch ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <span className="settings-switch-knob" />
    </button>
  )
}

// Custom Minutes Counter Component
interface MinutesCounterProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (nextVal: number) => void;
  disabled?: boolean;
}

const MinutesCounter: React.FC<MinutesCounterProps> = ({
  value,
  min,
  max,
  step,
  onChange,
  disabled = false
}) => {
  const canUp = !disabled && value < max
  const canDown = !disabled && value > min

  const handleUp = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (canUp) {
      onChange(Math.min(max, value + step))
    }
  }

  const handleDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (canDown) {
      onChange(Math.max(min, value - step))
    }
  }

  return (
    <div className={`minutes-counter ${disabled ? 'disabled' : ''}`} aria-disabled={disabled}>
      <div className="minutes-counter-display">
        <span className="minutes-counter-num">{value}</span>
        <span className="minutes-counter-unit">mins</span>
      </div>
      <div className="minutes-counter-actions">
        <button
          type="button"
          className={`minutes-counter-btn up ${!canUp ? 'btn-disabled' : ''}`}
          onClick={handleUp}
          disabled={!canUp}
          aria-label="Increase minutes"
          tabIndex={disabled ? -1 : 0}
        >
          <svg viewBox="0 0 24 24" width="12" height="12">
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          className={`minutes-counter-btn down ${!canDown ? 'btn-disabled' : ''}`}
          onClick={handleDown}
          disabled={!canDown}
          aria-label="Decrease minutes"
          tabIndex={disabled ? -1 : 0}
        >
          <svg viewBox="0 0 24 24" width="12" height="12">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Segmented Control Component
interface SegmentedControlProps {
  options: { label: string; value: boolean }[];
  value: boolean;
  onChange: (val: boolean) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => {
  return (
    <div className="segmented-ctrl" role="radiogroup" aria-label="Display coverage">
      {options.map((opt) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`segmented-btn ${isSelected ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Load settings and subscribe
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const loadSettings = async (): Promise<void> => {
      if (window.settingsApi) {
        try {
          const stored = await window.settingsApi.getSettings()
          if (stored) {
            setSettings(stored)
          }
        } catch (err) {
          console.error('Failed to load settings:', err)
        }

        unsubscribe = window.settingsApi.onSettingsChanged((updated) => {
          if (updated) {
            setSettings(updated)
          }
        })
      }
    }

    loadSettings()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const updateSetting = useCallback((patch: DeepPartial<AppSettings>) => {
    // Optimistic local update
    setSettings((prev) => {
      const eyeP = patch.nudges?.eyeBreak
      const waterP = patch.nudges?.drinkWater
      const takeP = patch.takeover
      const soundP = patch.sound

      return {
        nudges: {
          eyeBreak: {
            enabled: eyeP?.enabled ?? prev.nudges.eyeBreak.enabled,
            intervalMinutes: eyeP?.intervalMinutes ?? prev.nudges.eyeBreak.intervalMinutes
          },
          drinkWater: {
            enabled: waterP?.enabled ?? prev.nudges.drinkWater.enabled,
            intervalMinutes: waterP?.intervalMinutes ?? prev.nudges.drinkWater.intervalMinutes
          }
        },
        takeover: {
          allDisplays: takeP?.allDisplays ?? prev.takeover.allDisplays,
          allowSnooze: takeP?.allowSnooze ?? prev.takeover.allowSnooze,
          snoozeMinutes: takeP?.snoozeMinutes ?? prev.takeover.snoozeMinutes,
          restWarning: takeP?.restWarning ?? prev.takeover.restWarning ?? true
        },
        sound: {
          chimeAtRestStart: soundP?.chimeAtRestStart ?? prev.sound.chimeAtRestStart,
          chimeAtRestEnd: soundP?.chimeAtRestEnd ?? prev.sound.chimeAtRestEnd
        },
        autostart: patch.autostart ?? prev.autostart ?? false,
        miniFocusWindow: patch.miniFocusWindow ?? prev.miniFocusWindow ?? true
      }
    })

    if (window.settingsApi) {
      window.settingsApi.updateSettings(patch).catch((err) => {
        console.error('Failed to persist settings patch:', err)
      })
    }
  }, [])

  const eyeBreakOn = settings.nudges.eyeBreak.enabled
  const drinkWaterOn = settings.nudges.drinkWater.enabled
  const snoozeOn = settings.takeover.allowSnooze
  const restWarningOn = settings.takeover.restWarning ?? true
  const autostartOn = settings.autostart ?? false
  const miniWindowOn = settings.miniFocusWindow ?? true

  return (
    <main className="settings-page" aria-label="Settings">
      {/* 1. Nudges Card (Top-Left) */}
      <section className="settings-card" aria-labelledby="heading-nudges">
        <header className="settings-card-header">
          <div className="settings-icon-tile" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17">
              <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4" />
            </svg>
          </div>
          <div>
            <h2 id="heading-nudges" className="settings-card-title">
              Nudges
            </h2>
            <p className="settings-card-sub">
              Small toasts that fade on their own. They never take over the screen.
            </p>
          </div>
        </header>

        {/* Eye Break Row */}
        <div className={`setting-row ${!eyeBreakOn ? 'dimmed' : ''}`}>
          <div className="setting-info">
            <div className="setting-title">Eye break</div>
            <div className="setting-desc">
              {eyeBreakOn
                ? `Every ${settings.nudges.eyeBreak.intervalMinutes} min, look far away for a moment`
                : 'Off'}
            </div>
          </div>
          <div className="setting-controls">
            <MinutesCounter
              value={settings.nudges.eyeBreak.intervalMinutes}
              min={5}
              max={120}
              step={5}
              disabled={!eyeBreakOn}
              onChange={(intervalMinutes) =>
                updateSetting({ nudges: { eyeBreak: { intervalMinutes } } })
              }
            />
            <Switch
              checked={eyeBreakOn}
              ariaLabel="Toggle eye break reminders"
              onChange={(enabled) =>
                updateSetting({ nudges: { eyeBreak: { enabled } } })
              }
            />
          </div>
        </div>

        {/* Drink Water Row */}
        <div className={`setting-row ${!drinkWaterOn ? 'dimmed' : ''}`}>
          <div className="setting-info">
            <div className="setting-title">Drink water</div>
            <div className="setting-desc">
              {drinkWaterOn
                ? `Every ${settings.nudges.drinkWater.intervalMinutes} min, a quiet reminder`
                : 'Off'}
            </div>
          </div>
          <div className="setting-controls">
            <MinutesCounter
              value={settings.nudges.drinkWater.intervalMinutes}
              min={5}
              max={180}
              step={5}
              disabled={!drinkWaterOn}
              onChange={(intervalMinutes) =>
                updateSetting({ nudges: { drinkWater: { intervalMinutes } } })
              }
            />
            <Switch
              checked={drinkWaterOn}
              ariaLabel="Toggle drink water reminders"
              onChange={(enabled) =>
                updateSetting({ nudges: { drinkWater: { enabled } } })
              }
            />
          </div>
        </div>
      </section>

      {/* 2. Rest Takeover Card (Top-Right) */}
      <section className="settings-card" aria-labelledby="heading-takeover">
        <header className="settings-card-header">
          <div className="settings-icon-tile" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17">
              <rect x="3" y="5" width="18" height="12" rx="2" />
              <path d="M8 20.5h8M12 17v3.5" />
            </svg>
          </div>
          <div>
            <h2 id="heading-takeover" className="settings-card-title">
              Rest takeover
            </h2>
            <p className="settings-card-sub">
              How Revive takes the screen when focus ends.
            </p>
          </div>
        </header>

        {/* Show On Row */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Show on</div>
            <div className="setting-desc">
              Cover every connected display, or just the main one
            </div>
          </div>
          <div className="setting-controls">
            <SegmentedControl
              options={[
                { label: 'All', value: true },
                { label: 'Main only', value: false }
              ]}
              value={settings.takeover.allDisplays}
              onChange={(allDisplays) => updateSetting({ takeover: { allDisplays } })}
            />
          </div>
        </div>

        {/* Allow Snooze Row */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Allow one snooze</div>
            <div className="setting-desc">
              Once per rest, you can ask for a little more time
            </div>
          </div>
          <div className="setting-controls">
            <Switch
              checked={snoozeOn}
              ariaLabel="Allow one snooze during rest"
              onChange={(allowSnooze) => updateSetting({ takeover: { allowSnooze } })}
            />
          </div>
        </div>

        {/* Rest Warning Row */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Rest warning (60s)</div>
            <div className="setting-desc">
              Toast reminder 1 minute before Revive takes over the screen
            </div>
          </div>
          <div className="setting-controls">
            <Switch
              checked={restWarningOn}
              ariaLabel="Warn 60s before rest takeover"
              onChange={(restWarning) => updateSetting({ takeover: { restWarning } })}
            />
          </div>
        </div>

        {/* Snooze Length Row */}
        <div className={`setting-row ${!snoozeOn ? 'dimmed' : ''}`}>
          <div className="setting-info">
            <div className="setting-title">Snooze length</div>
            <div className="setting-desc">How long the snooze lasts</div>
          </div>
          <div className="setting-controls">
            <MinutesCounter
              value={settings.takeover.snoozeMinutes}
              min={1}
              max={15}
              step={1}
              disabled={!snoozeOn}
              onChange={(snoozeMinutes) =>
                updateSetting({ takeover: { snoozeMinutes } })
              }
            />
          </div>
        </div>
      </section>

      {/* 3. Sound Card */}
      <section className="settings-card" aria-labelledby="heading-sound">
        <header className="settings-card-header">
          <div className="settings-icon-tile" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17">
              <path d="M4 10v4h3l5 4V6L7 10zM16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />
            </svg>
          </div>
          <div>
            <h2 id="heading-sound" className="settings-card-title">
              Sound
            </h2>
            <p className="settings-card-sub">
              Soft cues around the rest takeover.
            </p>
          </div>
        </header>

        {/* Chime Rest Start */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Chime when rest starts</div>
            <div className="setting-desc">
              One gentle tone as the screen is taken over
            </div>
          </div>
          <div className="setting-controls">
            <Switch
              checked={settings.sound.chimeAtRestStart}
              ariaLabel="Chime when rest starts"
              onChange={(chimeAtRestStart) =>
                updateSetting({ sound: { chimeAtRestStart } })
              }
            />
          </div>
        </div>

        {/* Chime Rest End */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Chime when rest ends</div>
            <div className="setting-desc">
              One gentle tone before you go back to work
            </div>
          </div>
          <div className="setting-controls">
            <Switch
              checked={settings.sound.chimeAtRestEnd}
              ariaLabel="Chime when rest ends"
              onChange={(chimeAtRestEnd) =>
                updateSetting({ sound: { chimeAtRestEnd } })
              }
            />
          </div>
        </div>
      </section>

      {/* 4. App Behavior / General Card */}
      <section className="settings-card" aria-labelledby="heading-general">
        <header className="settings-card-header">
          <div className="settings-icon-tile" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <h2 id="heading-general" className="settings-card-title">
              Desktop
            </h2>
            <p className="settings-card-sub">
              Windows startup and mini widget behavior.
            </p>
          </div>
        </header>

        {/* Launch At Startup Row */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Launch at startup</div>
            <div className="setting-desc">
              Start Revive minimized to the system tray
            </div>
          </div>
          <div className="setting-controls">
            <Switch
              checked={autostartOn}
              ariaLabel="Launch Revive at Windows startup"
              onChange={(autostart) => updateSetting({ autostart })}
            />
          </div>
        </div>

        {/* Mini Focus Timer Widget Row */}
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-title">Mini focus timer</div>
            <div className="setting-desc">
              Show floating countdown widget during focus sessions
            </div>
          </div>
          <div className="setting-controls">
            <Switch
              checked={miniWindowOn}
              ariaLabel="Show floating mini focus timer"
              onChange={(miniFocusWindow) => updateSetting({ miniFocusWindow })}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
