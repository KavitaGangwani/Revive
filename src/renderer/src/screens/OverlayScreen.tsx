import React, { useEffect, useState, useMemo } from 'react'
import {
  Activity,
  SessionSnapshot,
  LibrarySettings,
  SoundPack,
  AppSettings
} from '../../../shared/types'
import { Stars } from '../components/Stars'
import { BreathingPlayer } from '../components/BreathingPlayer'
import { VideoPlayer } from '../components/VideoPlayer'
import { SpotifyPlayer } from '../components/SpotifyPlayer'
import { CustomPlayer } from '../components/CustomPlayer'
import { MovementPlayer } from '../components/MovementPlayer'
import { ActivityPicker } from '../components/ActivityPicker'
import { SessionComplete } from '../components/SessionComplete'

export interface OverlayScreenProps {
  mode: 'primary' | 'backdrop';
  displayId?: string;
}

export function OverlayScreen({ mode }: OverlayScreenProps): React.JSX.Element {
  const isBackdropOnly = mode === 'backdrop'

  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null)
  const [library, setLibrary] = useState<LibrarySettings | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [soundPacks, setSoundPacks] = useState<SoundPack[]>([])
  const [isExiting, setIsExiting] = useState<boolean>(false)

  // Helper to access APIs
  const getApi = () => window.revive || window.still

  useEffect(() => {
    if (isBackdropOnly) return

    const api = getApi()

    // 1. Initial fetches
    Promise.all([
      api?.session?.getSnapshot(),
      window.libraryApi?.getLibrary(),
      window.settingsApi?.getSettings(),
      window.overlayApi?.getSoundPacks()
    ]).then(([snap, lib, sett, packs]) => {
      if (snap) setSnapshot(snap)
      if (lib) setLibrary(lib)
      if (sett) setSettings(sett)
      if (packs) setSoundPacks(packs)
    })

    // 2. Subscribe to session ticks
    const unsubTick = api?.session?.onTick?.((newSnap) => {
      setSnapshot(newSnap)
    })

    // 3. Subscribe to library changes
    const unsubLib = window.libraryApi?.onLibraryChanged?.((newLib) => {
      setLibrary(newLib)
    })

    // 4. Subscribe to overlay exit animation
    const unsubExit = window.overlayApi?.onOverlayExit?.(() => {
      setIsExiting(true)
    })

    return () => {
      if (unsubTick) unsubTick()
      if (unsubLib) unsubLib()
      if (unsubExit) unsubExit()
    }
  }, [isBackdropOnly])

  const handleSnooze = async (): Promise<void> => {
    const api = getApi()
    if (api?.session?.snooze) {
      const updated = await api.session.snooze()
      setSnapshot(updated)
    } else if (window.overlayApi?.snooze) {
      const updated = await window.overlayApi.snooze()
      setSnapshot(updated)
    }
  }

  const handleResumeFocus = async (): Promise<void> => {
    const api = getApi()
    if (api?.session?.resumeFocus) {
      const updated = await api.session.resumeFocus()
      setSnapshot(updated)
    } else if (window.overlayApi?.resumeFocus) {
      const updated = await window.overlayApi.resumeFocus()
      setSnapshot(updated)
    }
  }

  const handleAnotherOne = async (): Promise<void> => {
    const api = getApi()
    if (api?.session?.anotherOne) {
      const updated = await api.session.anotherOne()
      setSnapshot(updated)
    }
  }

  const handleDoneForNow = async (): Promise<void> => {
    const api = getApi()
    if (api?.session?.doneForNow) {
      const updated = await api.session.doneForNow()
      setSnapshot(updated)
    }
  }

  const handleSelectActivity = async (activity: Activity): Promise<void> => {
    const api = getApi()
    if (snapshot && api?.session?.setRestActivity) {
      await api.session.setRestActivity(snapshot.loopIndex, activity.id)
    }
  }

  // Resolve active rest activity
  const currentActivity = useMemo(() => {
    if (!library || !snapshot) return null
    const targetId = snapshot.restActivityId || library.defaults?.restActivityId
    if (!targetId) return null
    return library.activities.find((a) => a.id === targetId) || null
  }, [library, snapshot])

  const isSessionComplete = snapshot?.phase === 'session-complete'

  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-[#020407] text-[#AFDDFF] overflow-hidden select-none transition-transform duration-1100 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* 45% x 38% Radial Glow Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 45% 38% at 50% 50%, rgba(40, 95, 160, 0.22), transparent 70%)'
        }}
      />

      {/* ~40 Twinkling Faint Stars */}
      <Stars />

      {/* Render Player Content or Session Complete on Primary Display */}
      {!isBackdropOnly && snapshot && (
        <div className="relative w-full h-full z-10 flex items-center justify-center">
          {isSessionComplete ? (
            <SessionComplete
              onAnotherOne={handleAnotherOne}
              onDoneForNow={handleDoneForNow}
            />
          ) : library ? (
            currentActivity ? (
              <>
                {currentActivity.type === 'breathing' && (
                  <BreathingPlayer
                    activity={currentActivity}
                    snapshot={snapshot}
                    soundPacks={soundPacks}
                    initialSoundPackId={library.defaults?.breathingSoundPackId}
                    volume={library.defaults?.breathingSoundVolume ?? 0.8}
                    onSnooze={handleSnooze}
                    canSnooze={settings?.takeover?.allowSnooze ?? true}
                  />
                )}

                {currentActivity.type === 'youtube' && (
                  <VideoPlayer
                    activity={currentActivity}
                    snapshot={snapshot}
                    onSnooze={handleSnooze}
                    onResumeFocus={handleResumeFocus}
                    canSnooze={settings?.takeover?.allowSnooze ?? true}
                  />
                )}

                {currentActivity.type === 'spotify' && (
                  <SpotifyPlayer
                    activity={currentActivity}
                    snapshot={snapshot}
                    onSnooze={handleSnooze}
                    onResumeFocus={handleResumeFocus}
                    canSnooze={settings?.takeover?.allowSnooze ?? true}
                  />
                )}

                {currentActivity.type === 'custom' && (
                  <CustomPlayer
                    activity={currentActivity}
                    snapshot={snapshot}
                    onSnooze={handleSnooze}
                    onResumeFocus={handleResumeFocus}
                    canSnooze={settings?.takeover?.allowSnooze ?? true}
                  />
                )}
              </>
            ) : (
              <ActivityPicker
                activities={library.activities}
                snapshot={snapshot}
                onSelectActivity={handleSelectActivity}
                onSnooze={handleSnooze}
                onResumeFocus={handleResumeFocus}
                canSnooze={settings?.takeover?.allowSnooze ?? true}
              />
            )
          ) : null}
        </div>
      )}
    </div>
  )
}
