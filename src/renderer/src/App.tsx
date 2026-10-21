import React, { useEffect, useState } from 'react'
import {
  Activity,
  SessionConfig,
  SessionSnapshot,
  LibraryPayload,
  PersistedSessionState
} from '../../shared/types'
import { Stars } from './components/Stars'
import { Sidebar, AppRoute } from './components/Sidebar'
import { FocusScreen } from './components/FocusScreen'
import { ActivitiesScreen } from './components/ActivitiesScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { CloseNoticeModal } from './components/CloseNoticeModal'
import { ResumeDialog } from './components/ResumeDialog'
import { OverlayScreen } from './screens/OverlayScreen'
import { MiniFocusScreen } from './screens/MiniFocusScreen'
import { ToastScreen } from './screens/ToastScreen'
import { SessionConfigProvider, useSessionConfig } from './context/SessionConfigContext'

const defaultSessionConfig: SessionConfig = {
  focusMinutes: 30,
  restMinutes: 5,
  loopCount: 2,
  restActivityIds: [null, null]
}

const defaultSnapshot: SessionSnapshot = {
  phase: 'idle',
  loopIndex: 0,
  loopCount: 2,
  remainingMs: 0,
  totalMs: 0,
  restActivityId: null,
  config: defaultSessionConfig
}

const defaultLibrary: LibraryPayload = {
  activities: [],
  defaultId: undefined
}

function MainContent(): React.JSX.Element {
  const getApi = () => window.revive || window.still
  const { config, setSlotActivity, startSession } = useSessionConfig()

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('focus')
  const [collapsed, setCollapsed] = useState<boolean>(true) // Collapsed by default per spec
  const [pickForRestIndex, setPickForRestIndex] = useState<number | null>(null)
  const [isCloseNoticeOpen, setIsCloseNoticeOpen] = useState<boolean>(false)
  const [pendingResume, setPendingResume] = useState<PersistedSessionState | null>(null)

  const [snapshot, setSnapshot] = useState<SessionSnapshot>(defaultSnapshot)
  const [library, setLibrary] = useState<LibraryPayload>(defaultLibrary)

  // 1. Initial Load & Subscriptions
  useEffect(() => {
    async function initApp(): Promise<void> {
      try {
        const api = getApi()
        const [loadedPrefs, loadedSnapshot, loadedLib, checkResume] = await Promise.all([
          api?.prefs?.get(),
          api?.session?.getSnapshot(),
          window.libraryApi?.getLibrary(),
          api?.session?.checkPendingResume?.()
        ])

        if (loadedPrefs) {
          setCollapsed(Boolean(loadedPrefs.sidebarCollapsed))
        }

        if (loadedSnapshot) {
          setSnapshot(loadedSnapshot)
        }

        if (loadedLib) {
          setLibrary(loadedLib)
        }

        if (checkResume) {
          setPendingResume(checkResume)
        }
      } catch (err) {
        console.error('Failed to initialize app state:', err)
      }
    }

    initApp()

    // Subscribe to IPC tick broadcasts
    const api = getApi()
    const unsubscribeTick = api?.session?.onTick?.((updatedSnapshot) => {
      setSnapshot(updatedSnapshot)
    })

    // Subscribe to IPC library change broadcasts
    const unsubscribeLibrary = window.libraryApi?.onLibraryChanged?.((updatedLib) => {
      setLibrary(updatedLib)
    })

    // Subscribe to close request from main process
    const unsubscribeClose = window.windowApi?.onCloseRequested?.(() => {
      setIsCloseNoticeOpen(true)
    })

    return () => {
      if (unsubscribeTick) unsubscribeTick()
      if (unsubscribeLibrary) unsubscribeLibrary()
      if (unsubscribeClose) unsubscribeClose()
    }
  }, [])

  const handleToggleCollapse = (): void => {
    const nextCollapsed = !collapsed
    setCollapsed(nextCollapsed)
    const api = getApi()
    api?.prefs?.set?.({ sidebarCollapsed: nextCollapsed })
  }

  const handleNavigate = (route: AppRoute): void => {
    if (route !== 'activities') {
      setPickForRestIndex(null)
    }
    setCurrentRoute(route)
  }

  // Session Handlers
  const handleStartSession = async (): Promise<void> => {
    await startSession()
    setCurrentRoute('focus')
  }

  const handleSkipToRest = async (): Promise<void> => {
    const api = getApi()
    if (api?.session) {
      const snap = await api.session.skipToRest()
      setSnapshot(snap)
    }
  }

  const handleAnotherOne = async (): Promise<void> => {
    const api = getApi()
    if (api?.session) {
      const snap = await api.session.anotherOne()
      setSnapshot(snap)
      setCurrentRoute('focus')
    }
  }

  const handleDoneForNow = async (): Promise<void> => {
    const api = getApi()
    if (api?.session) {
      const snap = await api.session.doneForNow()
      setSnapshot(snap)
      setCurrentRoute('focus')
    }
  }

  // Resume Session Dialog Handlers
  const handleConfirmResume = async (): Promise<void> => {
    const api = getApi()
    setPendingResume(null)
    if (api?.session?.confirmResume) {
      const resumed = await api.session.confirmResume(true)
      if (resumed) {
        const snap = await api.session.getSnapshot()
        setSnapshot(snap)
      }
    }
  }

  const handleDiscardResume = async (): Promise<void> => {
    const api = getApi()
    setPendingResume(null)
    if (api?.session?.confirmResume) {
      await api.session.confirmResume(false)
    }
  }

  // Pick Mode Handlers
  const handlePickActivityForRest = (index: number): void => {
    setPickForRestIndex(index)
    setCurrentRoute('activities')
  }

  const handleSelectActivityForSlot = async (activityId: string | null): Promise<void> => {
    if (pickForRestIndex !== null) {
      await setSlotActivity(pickForRestIndex, activityId)
    }
    setPickForRestIndex(null)
    setCurrentRoute('focus')
  }

  const handleCancelPick = (): void => {
    setPickForRestIndex(null)
  }

  // Library Handlers
  const handleAddActivity = async (
    input: Omit<Activity, 'id' | 'builtIn'>
  ): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> => {
    if (!window.libraryApi) {
      return { ok: false, error: 'Library API not available.' }
    }
    return await window.libraryApi.addActivity(input)
  }

  const handleUpdateActivity = async (
    id: string,
    input: Omit<Activity, 'id' | 'builtIn'>
  ): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> => {
    if (!window.libraryApi) {
      return { ok: false, error: 'Library API not available.' }
    }
    return await window.libraryApi.updateActivity(id, input)
  }

  const handleDeleteActivity = async (id: string): Promise<void> => {
    if (window.libraryApi) {
      await window.libraryApi.deleteActivity(id)
      // Check if deleted activity was in local config slots
      const slotIndex = config.restActivityIds.indexOf(id)
      if (slotIndex !== -1) {
        await setSlotActivity(slotIndex, null)
      }
    }
  }

  const handleSetDefault = async (id: string | null): Promise<void> => {
    if (window.libraryApi) {
      await window.libraryApi.setDefault(id)
    }
  }

  const handleMinimize = (e?: React.MouseEvent): void => {
    if (e) {
      e.stopPropagation()
    }
    const winControls =
      window.windowControls ||
      window.windowApi ||
      window.revive?.windowControls ||
      window.still?.windowControls
    if (winControls?.minimize) {
      winControls.minimize()
    }
  }

  const handleClose = (e?: React.MouseEvent): void => {
    if (e) {
      e.stopPropagation()
    }
    const winControls =
      window.windowControls ||
      window.windowApi ||
      window.revive?.windowControls ||
      window.still?.windowControls
    if (winControls?.close) {
      winControls.close()
    }
  }

  const handleCloseChoice = (choice: 'hide' | 'quit'): void => {
    setIsCloseNoticeOpen(false)
    if (window.windowApi) {
      window.windowApi.closeChoice(choice)
    }
  }

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`} id="app">
      <Stars />

      {/* Top Dedicated Titlebar Header */}
      <header className="app-titlebar" aria-label="Application title bar">
        <div className="app-brand">
          <span className="brand-dot" />
          <span className="brand-title">Revive</span>
        </div>
        <div className="titlebar-drag" />
        <div className="win-ctrls" aria-label="Window controls">
          <button
            id="win-min-btn"
            type="button"
            className="win-btn"
            onClick={handleMinimize}
            title="Minimize"
            aria-label="Minimize window"
          >
            ─
          </button>
          <button
            id="win-close-btn"
            type="button"
            className="win-btn win-close-btn"
            onClick={handleClose}
            title="Close"
            aria-label="Close application"
          >
            ✕
          </button>
        </div>
      </header>

      <Sidebar
        currentRoute={currentRoute}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        onNavigate={handleNavigate}
      />

      {currentRoute === 'focus' && (
        <FocusScreen
          snapshot={snapshot}
          library={library.activities || []}
          onPickActivityForRest={handlePickActivityForRest}
          onStartSession={handleStartSession}
          onSkipToRest={handleSkipToRest}
          onAnotherOne={handleAnotherOne}
          onDoneForNow={handleDoneForNow}
        />
      )}

      {currentRoute === 'activities' && (
        <ActivitiesScreen
          library={library}
          pickForRestIndex={pickForRestIndex}
          currentSlotActivityId={pickForRestIndex !== null ? config.restActivityIds[pickForRestIndex] : null}
          onSelectActivityForSlot={handleSelectActivityForSlot}
          onCancelPick={handleCancelPick}
          onAddActivity={handleAddActivity}
          onUpdateActivity={handleUpdateActivity}
          onDeleteActivity={handleDeleteActivity}
          onSetDefault={handleSetDefault}
        />
      )}

      {currentRoute === 'settings' && (
        <SettingsScreen onBack={() => setCurrentRoute('focus')} />
      )}

      {/* Resume Confirmation Dialog */}
      <ResumeDialog
        isOpen={pendingResume !== null}
        onConfirm={handleConfirmResume}
        onDiscard={handleDiscardResume}
      />

      {/* Close While Running Notice Modal */}
      <CloseNoticeModal
        isOpen={isCloseNoticeOpen}
        onDismiss={() => setIsCloseNoticeOpen(false)}
        onChoice={handleCloseChoice}
      />
    </div>
  )
}

export default function App(): React.JSX.Element {
  const urlParams = new URLSearchParams(window.location.search)

  // 1. Check for multi-display overlay window mode
  const overlayMode = urlParams.get('overlay') as 'primary' | 'backdrop' | null
  const displayId = urlParams.get('displayId') || undefined
  if (overlayMode === 'primary' || overlayMode === 'backdrop') {
    return <OverlayScreen mode={overlayMode} displayId={displayId} />
  }

  // 2. Check for mini focus window
  const windowMode = urlParams.get('window')
  if (windowMode === 'mini') {
    document.documentElement.classList.add('html-mini-window')
    document.body.classList.add('body-mini-window')
    document.body.classList.remove('bg-bg')
    return <MiniFocusScreen />
  }

  // 3. Check for toast notification
  const toastType = urlParams.get('toast')
  if (toastType) {
    const toastId = urlParams.get('toastId') || ''
    const label = urlParams.get('label') || undefined
    const text = urlParams.get('text') || undefined
    const durationMs = Number(urlParams.get('duration')) || 8000
    return (
      <ToastScreen
        type={toastType}
        toastId={toastId}
        label={label}
        text={text}
        durationMs={durationMs}
      />
    )
  }

  return (
    <SessionConfigProvider>
      <MainContent />
    </SessionConfigProvider>
  )
}
