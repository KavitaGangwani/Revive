import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Activity,
  SessionSnapshot,
  LibraryPayload,
  SoundPack,
  AppSettings
} from '../../../shared/types'
import { Stars } from '../components/Stars'
import { BreathingPlayer } from '../components/BreathingPlayer'
import { RoutinePlayer } from '../components/RoutinePlayer'
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
  const [library, setLibrary] = useState<LibraryPayload | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [soundPacks, setSoundPacks] = useState<SoundPack[]>([])
  const [isExiting, setIsExiting] = useState<boolean>(false)

  // Ref to freeze the last rendered view during 1.1s closing fade
  const lastActiveContentRef = useRef<React.ReactNode>(null)
  const snapshotRef = useRef<SessionSnapshot | null>(null)
  snapshotRef.current = snapshot

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

    // 5. Global Escape key listener to exit overlay & dev-only Ctrl+Shift+Q
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        e.stopPropagation()
        const api = getApi()
        api?.session?.devResetToIdle?.()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleResumeFocus()
        return
      }
      if (e.key === 'Enter') {
        const snap = snapshotRef.current
        if (snap?.phase === 'transition-to-rest') {
          e.preventDefault()
          e.stopPropagation()
          handleBeginRestNow()
          return
        }
        if (snap?.phase === 'transition-to-focus') {
          e.preventDefault()
          e.stopPropagation()
          handleBackToWork()
          return
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      if (unsubTick) unsubTick()
      if (unsubLib) unsubLib()
      if (unsubExit) unsubExit()
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
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

  const handleBackToWork = async (): Promise<void> => {
    const api = getApi()
    if (api?.session?.backToWork) {
      const updated = await api.session.backToWork()
      setSnapshot(updated)
    }
  }

  const handleBeginRestNow = async (): Promise<void> => {
    const api = getApi()
    if (api?.session?.beginRestNow) {
      const updated = await api.session.beginRestNow()
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
    const targetId = snapshot.restActivityId || library.defaultId || (library as any).defaults?.restActivityId
    if (!targetId) return null
    return (library.activities || []).find((a) => a.id === targetId) || null
  }, [library, snapshot])

  const isSessionComplete = snapshot?.phase === 'session-complete'
  const urlParams = new URLSearchParams(window.location.search)
  const isWindowed =
    urlParams.get('windowMode') === 'window' ||
    (settings?.takeover?.windowMode ?? 'window') === 'window'

  // Compute active content
  const renderContent = (): React.ReactNode => {
    if (!snapshot) return null

    if (isSessionComplete) {
      return (
        <SessionComplete
          onAnotherOne={handleAnotherOne}
          onDoneForNow={handleDoneForNow}
        />
      )
    }

    // 1. FOCUS -> REST INTRO SCREEN (transition-to-rest)
    if (snapshot.phase === 'transition-to-rest') {
      const secondsRemaining = Math.min(5, Math.max(1, Math.ceil(snapshot.remainingMs / 1000)))
      const activityTitle = currentActivity?.name || 'Rest & Recharge'
      const roundLabel = `Rest ${snapshot.loopIndex + 1} of ${snapshot.loopCount}`
      const ringRadius = 88
      const circumference = 2 * Math.PI * ringRadius
      const progressFraction = Math.max(0, Math.min(1, secondsRemaining / 5))
      const strokeDashoffset = circumference * (1 - progressFraction)

      return (
        <div className="relative w-full h-full flex flex-col justify-between items-center select-none z-10 font-mono px-8 py-8 md:px-16 md:py-12">
          {/* Top Bar */}
          <header className="w-full max-w-5xl flex items-center justify-between z-20">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#AFDDFF] shadow-[0_0_10px_#AFDDFF] animate-pulse" />
              <span className="text-[11px] tracking-[0.25em] uppercase text-white/50 font-mono">
                Revive
              </span>
            </div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 font-mono">
              {roundLabel}
            </span>
          </header>

          {/* 2-Column Hero Section */}
          <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center my-auto px-4 z-20 animate-fade-in">
            {/* Left Column: Editorial Information */}
            <div className="md:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#AFDDFF]/25 bg-[rgba(175,221,255,0.06)] text-[10px] uppercase tracking-[0.22em] text-[#AFDDFF] font-mono mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#AFDDFF]" />
                <span>Next up · Rest cycle</span>
              </div>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight leading-[1.08] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {activityTitle}
              </h1>

              {currentActivity?.tagline && (
                <p className="text-sm md:text-base text-white/70 font-light leading-relaxed mb-4 font-mono max-w-lg">
                  {currentActivity.tagline}
                </p>
              )}

              {(currentActivity?.notes || currentActivity?.note) && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/55 leading-relaxed font-mono max-w-lg mb-6 line-clamp-3">
                  {currentActivity.notes || currentActivity.note}
                </div>
              )}

              {/* Action CTA */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  type="button"
                  onClick={handleBeginRestNow}
                  className="group flex items-center gap-3 px-8 py-3 rounded-full border border-[rgba(175,221,255,0.4)] bg-[rgba(175,221,255,0.1)] hover:bg-[#AFDDFF] hover:text-black text-[#AFDDFF] text-xs font-mono tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer shadow-[0_0_24px_rgba(175,221,255,0.18)] hover:shadow-[0_0_36px_rgba(175,221,255,0.5)] active:scale-95"
                >
                  <span>Begin now</span>
                  <span className="text-[11px] opacity-70 group-hover:opacity-100 font-mono">↵</span>
                </button>
              </div>
            </div>

            {/* Right Column: Visual Centerpiece Countdown Ring */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                {/* Soft atmospheric ambient glow */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(175,221,255,0.12)_0%,transparent_70%)] pointer-events-none" />

                {/* SVG Progress Arc */}
                <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 210 210">
                  <circle
                    cx="105"
                    cy="105"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="105"
                    cy="105"
                    r={ringRadius}
                    fill="none"
                    stroke="#AFDDFF"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: 'drop-shadow(0 0 8px rgba(175, 221, 255, 0.6))'
                    }}
                  />
                </svg>

                {/* Number inside */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-6xl font-light text-white font-mono tabular-nums tracking-tight leading-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {secondsRemaining}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.26em] text-white/40 font-mono mt-2">
                    seconds
                  </span>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="w-full max-w-5xl flex items-center justify-between z-20 pt-4 border-t border-white/[0.06]">
            <span className="text-[11px] text-white/30 tracking-[0.12em] select-none font-mono">
              Press ESC to escape
            </span>
            <span className="text-[11px] text-white/30 tracking-[0.12em] select-none font-mono">
              Press Enter to begin
            </span>
          </footer>
        </div>
      )
    }

    // 2. REST -> FOCUS TRANSITION SCREEN (transition-to-focus)
    if (snapshot.phase === 'transition-to-focus') {
      const secondsRemaining = Math.min(5, Math.max(1, Math.ceil(snapshot.remainingMs / 1000)))
      const roundLabel = `Round ${snapshot.loopIndex + 1} of ${snapshot.loopCount}`
      const ringRadius = 88
      const circumference = 2 * Math.PI * ringRadius
      const progressFraction = Math.max(0, Math.min(1, secondsRemaining / 5))
      const strokeDashoffset = circumference * (1 - progressFraction)

      return (
        <div className="relative w-full h-full flex flex-col justify-between items-center select-none z-10 font-mono px-8 py-8 md:px-16 md:py-12">
          {/* Top Bar */}
          <header className="w-full max-w-5xl flex items-center justify-between z-20">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#AFDDFF] shadow-[0_0_10px_#AFDDFF] animate-pulse" />
              <span className="text-[11px] tracking-[0.25em] uppercase text-white/50 font-mono">
                Revive
              </span>
            </div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/40 font-mono">
              {roundLabel}
            </span>
          </header>

          {/* 2-Column Hero Section */}
          <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center my-auto px-4 z-20 animate-fade-in">
            {/* Left Column: Focus Info & Left Off Note */}
            <div className="md:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#AFDDFF]/25 bg-[rgba(175,221,255,0.06)] text-[10px] uppercase tracking-[0.22em] text-[#AFDDFF] font-mono mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#AFDDFF]" />
                <span>Next focus block</span>
              </div>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight leading-[1.08] mb-4"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Ready to focus
              </h1>

              {snapshot.leftOffNote && snapshot.leftOffNote.trim() ? (
                <div className="w-full p-4 rounded-xl bg-white/[0.04] border border-[rgba(175,221,255,0.25)] shadow-[0_0_24px_rgba(175,221,255,0.08)] mb-6 max-w-lg">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#AFDDFF] font-mono block mb-1.5 font-medium">
                    Where you left off
                  </span>
                  <p className="text-base md:text-lg text-white font-normal leading-relaxed italic">
                    "{snapshot.leftOffNote}"
                  </p>
                </div>
              ) : (
                <p className="text-sm md:text-base text-white/70 font-light leading-relaxed mb-6 font-mono max-w-lg">
                  Take a breath and settle in. Your upcoming focus session is about to begin.
                </p>
              )}

              {/* Action CTA */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  type="button"
                  onClick={handleBackToWork}
                  className="group flex items-center gap-3 px-8 py-3 rounded-full border border-[rgba(175,221,255,0.4)] bg-[rgba(175,221,255,0.1)] hover:bg-[#AFDDFF] hover:text-black text-[#AFDDFF] text-xs font-mono tracking-[0.18em] uppercase transition-all duration-300 cursor-pointer shadow-[0_0_24px_rgba(175,221,255,0.18)] hover:shadow-[0_0_36px_rgba(175,221,255,0.5)] active:scale-95"
                >
                  <span>Resume focus</span>
                  <span className="text-[11px] opacity-70 group-hover:opacity-100 font-mono">↵</span>
                </button>
              </div>
            </div>

            {/* Right Column: Visual Centerpiece Countdown Ring */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-[210px] h-[210px] flex items-center justify-center">
                {/* Soft atmospheric ambient glow */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(175,221,255,0.12)_0%,transparent_70%)] pointer-events-none" />

                {/* SVG Progress Arc */}
                <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 210 210">
                  <circle
                    cx="105"
                    cy="105"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="105"
                    cy="105"
                    r={ringRadius}
                    fill="none"
                    stroke="#AFDDFF"
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: 'drop-shadow(0 0 8px rgba(175, 221, 255, 0.6))'
                    }}
                  />
                </svg>

                {/* Number inside */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-6xl font-light text-white font-mono tabular-nums tracking-tight leading-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {secondsRemaining}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.26em] text-white/40 font-mono mt-2">
                    seconds
                  </span>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="w-full max-w-5xl flex items-center justify-between z-20 pt-4 border-t border-white/[0.06]">
            <span className="text-[11px] text-white/30 tracking-[0.12em] select-none font-mono">
              Press ESC to escape
            </span>
            <span className="text-[11px] text-white/30 tracking-[0.12em] select-none font-mono">
              Press Enter to resume
            </span>
          </footer>
        </div>
      )
    }

    // 3. EXPLICIT ACTIVITY PICKER (Rendered ONLY if phase === 'choose-activity', NEVER as fallback!)
    if ((snapshot.phase as any) === 'choose-activity') {
      return (
        <ActivityPicker
          activities={library?.activities || []}
          snapshot={snapshot}
          onSelectActivity={handleSelectActivity}
          onResumeFocus={handleResumeFocus}
        />
      )
    }

    // 4. REST ACTIVITY PLAYER (Snooze permanently disabled across all rest screens)
    if (currentActivity) {
      if (currentActivity.media?.kind === 'youtube') {
        return (
          <VideoPlayer
            activity={currentActivity}
            snapshot={snapshot}
            onResumeFocus={handleResumeFocus}
            canSnooze={false}
          />
        )
      }
      if (currentActivity.media?.kind === 'spotify') {
        return (
          <SpotifyPlayer
            activity={currentActivity}
            snapshot={snapshot}
            onResumeFocus={handleResumeFocus}
            canSnooze={false}
          />
        )
      }
      if (currentActivity.type === 'routine') {
        return (
          <RoutinePlayer
            activity={currentActivity}
            snapshot={snapshot}
            onResumeFocus={handleResumeFocus}
          />
        )
      }
      if (currentActivity.type === 'breathing') {
        return (
          <BreathingPlayer
            activity={currentActivity}
            snapshot={snapshot}
            onResumeFocus={handleResumeFocus}
            canSnooze={false}
          />
        )
      }
      return (
        <CustomPlayer
          activity={currentActivity}
          snapshot={snapshot}
          onResumeFocus={handleResumeFocus}
          canSnooze={false}
        />
      )
    }

    // 5. Rest without activity (peaceful rest screen, NEVER ActivityPicker)
    const remainingSec = Math.max(0, Math.ceil(snapshot.remainingMs / 1000))
    const mins = Math.floor(remainingSec / 60)
    const secs = remainingSec % 60
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    const progressPct = snapshot.totalMs > 0 ? Math.min(100, Math.max(0, ((snapshot.totalMs - snapshot.remainingMs) / snapshot.totalMs) * 100)) : 0

    return (
      <div className="relative w-full h-full flex flex-col justify-between items-center select-none z-10 font-mono py-6">
        <header className="w-full flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-3">
            <span className="text-[11px] tracking-[0.14em] uppercase text-[var(--muted,#8a99a8)] font-mono">
              Rest {snapshot.loopIndex + 1} of {snapshot.loopCount}
            </span>
            <span className="text-[11px] text-white/30 font-mono">·</span>
            <span className="text-[12px] text-[var(--text,#ffffff)] tracking-[0.08em] font-medium font-mono">
              Quiet rest
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--accent,#afddff)] shadow-[0_0_8px_var(--accent,#afddff)] animate-pulse" />
            <span className="text-[12px] text-[var(--text,#ffffff)] tracking-[0.1em] tabular-nums">
              {timeFormatted}
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center z-20 animate-fade-in font-mono my-auto">
          <h1 className="text-3xl md:text-4xl text-white font-medium mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Time to rest
          </h1>
          <div className="text-xs text-[#AFDDFF]/70 tracking-widest uppercase mb-4">
            Leave the screen. Relax your eyes.
          </div>
        </main>

        <footer className="w-full flex flex-col z-20">
          <div className="w-full flex items-center justify-between px-8 py-3.5">
            <span className="text-[11px] text-[var(--muted,#8a99a8)] tracking-[0.08em] select-none font-mono">
              Press ESC to escape.
            </span>
          </div>
          <div className="w-full h-[2px] bg-[rgba(255,255,255,0.08)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent,#afddff)] transition-all duration-300 ease-out shadow-[0_0_8px_var(--accent,#afddff)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </footer>
      </div>
    )
  }

  // Freeze content if overlay is exiting or marked closing
  const isClosingState = isExiting || snapshot?.isClosing || snapshot?.phase === 'closing'
  if (!isClosingState) {
    lastActiveContentRef.current = renderContent()
  }
  const contentToDisplay = isClosingState
    ? (lastActiveContentRef.current || renderContent())
    : renderContent()

  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-[#020407] text-[#AFDDFF] overflow-hidden select-none transition-transform duration-1100 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isExiting ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Windowed Titlebar Header */}
      {isWindowed && !isBackdropOnly && (
        <header
          className="app-titlebar"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(2, 4, 7, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--hair)'
          }}
          aria-label="Rest window header"
        >
          <div className="app-brand">
            <span className="brand-dot" />
            <span className="brand-title">Revive · Rest</span>
          </div>
          <div className="titlebar-drag" style={{ WebkitAppRegion: 'drag' } as any} />
        </header>
      )}

      {/* 45% x 38% Radial Glow Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 45% 38% at 50% 50%, rgba(40, 95, 160, 0.22), transparent 70%)'
        }}
      />

      {/* ~40 Twinkling Faint Stars */}
      <Stars />

      {/* Render Content on Primary Display */}
      {!isBackdropOnly && snapshot && (
        <div className={`relative w-full h-full z-10 flex items-center justify-center ${isWindowed ? 'pt-[42px]' : ''}`}>
          {contentToDisplay}
        </div>
      )}
    </div>
  )
}
