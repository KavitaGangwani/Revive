import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Activity,
  SessionConfig,
  SessionSnapshot,
  LibrarySettings
} from '../../shared/types'
import { Stars } from './components/Stars'
import { Sidebar, AppRoute } from './components/Sidebar'
import { FocusScreen } from './components/FocusScreen'
import { ActivitiesScreen } from './components/ActivitiesScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { CloseNoticeModal } from './components/CloseNoticeModal'
import { OverlayScreen } from './screens/OverlayScreen'
import { MiniFocusScreen } from './screens/MiniFocusScreen'
import { ToastScreen } from './screens/ToastScreen'

const defaultSessionConfig: SessionConfig = {
  focusMinutes: 30,
  restMinutes: 5,
  loopCount: 2,
  restActivityIds: [null, null, null, null, null, null, null, null]
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

const defaultLibrary: LibrarySettings = {
  activities: [],
  defaults: { restActivityId: null }
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

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('focus')
  const [collapsed, setCollapsed] = useState<boolean>(true) // Collapsed by default per spec
  const [pickForRestIndex, setPickForRestIndex] = useState<number | null>(null)
  const [isCloseNoticeOpen, setIsCloseNoticeOpen] = useState<boolean>(false)

  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig)
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(defaultSnapshot)
  const [library, setLibrary] = useState<LibrarySettings>(defaultLibrary)
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const saveTimeoutRef = useRef<any>(null)

  // Helper to access IPC API (revive or still fallback)
  const getApi = () => window.revive || window.still

  // 1. Initial Load & Subscriptions
  useEffect(() => {
    async function initApp(): Promise<void> {
      try {
        const api = getApi()
        const [loadedPrefs, loadedSnapshot, loadedLib] = await Promise.all([
          api?.prefs?.get(),
          api?.session?.getSnapshot(),
          window.libraryApi?.getLibrary()
        ])

        if (loadedPrefs) {
          setCollapsed(Boolean(loadedPrefs.sidebarCollapsed))
          const rawActivityIds = Array.isArray(loadedPrefs.restActivityIds)
            ? loadedPrefs.restActivityIds
            : []
          const fullArray = Array.from({ length: 8 }, (_, i) => rawActivityIds[i] ?? null)

          setConfig({
            focusMinutes: loadedPrefs.focusMinutes ?? 30,
            restMinutes: loadedPrefs.restMinutes ?? 5,
            loopCount: loadedPrefs.loopCount ?? 2,
            restActivityIds: fullArray
          })
        }

        if (loadedSnapshot) {
          setSnapshot(loadedSnapshot)
        }

        if (loadedLib) {
          setLibrary(loadedLib)
        }
      } catch (err) {
        console.error('Failed to initialize app state:', err)
      }
      setIsLoaded(true)
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

  // 2. Debounced Preferences Persistence (~300ms)
  const persistPrefs = useCallback((nextConfig: SessionConfig, isCollapsed: boolean) => {
    const api = getApi()
    if (!api?.prefs) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      api.prefs.set({
        focusMinutes: nextConfig.focusMinutes,
        restMinutes: nextConfig.restMinutes,
        loopCount: nextConfig.loopCount,
        restActivityIds: nextConfig.restActivityIds,
        sidebarCollapsed: isCollapsed
      })
    }, 300)
  }, [])

  const handleConfigChange = (newConfig: SessionConfig): void => {
    setConfig(newConfig)
    if (isLoaded) {
      persistPrefs(newConfig, collapsed)
    }
  }

  const handleToggleCollapse = (): void => {
    const nextCollapsed = !collapsed
    setCollapsed(nextCollapsed)
    if (isLoaded) {
      persistPrefs(config, nextCollapsed)
    }
  }

  const handleNavigate = (route: AppRoute): void => {
    if (route !== 'activities') {
      setPickForRestIndex(null)
    }
    setCurrentRoute(route)
  }

  // Session Handlers
  const handleStartSession = async (): Promise<void> => {
    const api = getApi()
    if (api?.session) {
      const snap = await api.session.start(config)
      setSnapshot(snap)
      setCurrentRoute('focus')
    }
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

  // Pick Mode Handlers
  const handlePickActivityForRest = (index: number): void => {
    setPickForRestIndex(index)
    setCurrentRoute('activities')
  }

  const handleSelectActivityForSlot = async (activityId: string | null): Promise<void> => {
    const api = getApi()
    if (pickForRestIndex !== null && api?.session) {
      const updatedConfig = await api.session.setRestActivity(pickForRestIndex, activityId)
      setConfig(updatedConfig)
      if (isLoaded) {
        persistPrefs(updatedConfig, collapsed)
      }
    }
    setPickForRestIndex(null)
    setCurrentRoute('focus')
  }

  const handleCancelPick = (): void => {
    setPickForRestIndex(null)
  }

  // Library Handlers
  const handleAddActivity = async (
    input: Omit<Activity, 'id' | 'isBuiltIn'>
  ): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> => {
    if (!window.libraryApi) {
      return { ok: false, error: 'Library API not available.' }
    }
    return await window.libraryApi.addActivity(input)
  }

  const handleUpdateActivity = async (
    id: string,
    input: Omit<Activity, 'id' | 'isBuiltIn'>
  ): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> => {
    if (!window.libraryApi) {
      return { ok: false, error: 'Library API not available.' }
    }
    return await window.libraryApi.updateActivity(id, input)
  }

  const handleDuplicateActivity = async (
    id: string
  ): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> => {
    if (!window.libraryApi) {
      return { ok: false, error: 'Library API not available.' }
    }
    return await window.libraryApi.duplicateActivity(id)
  }

  const handleDeleteActivity = async (id: string): Promise<void> => {
    if (window.libraryApi) {
      await window.libraryApi.deleteActivity(id)
      // Check if deleted activity was in local config slots
      const hasSlot = config.restActivityIds.includes(id)
      if (hasSlot) {
        const updatedSlots = config.restActivityIds.map((s) => (s === id ? null : s))
        const updatedConfig = { ...config, restActivityIds: updatedSlots }
        setConfig(updatedConfig)
        if (isLoaded) {
          persistPrefs(updatedConfig, collapsed)
        }
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
          config={config}
          snapshot={snapshot}
          library={library.activities}
          onChangeConfig={handleConfigChange}
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
          onSelectActivityForSlot={handleSelectActivityForSlot}
          onCancelPick={handleCancelPick}
          onAddActivity={handleAddActivity}
          onUpdateActivity={handleUpdateActivity}
          onDuplicateActivity={handleDuplicateActivity}
          onDeleteActivity={handleDeleteActivity}
          onSetDefault={handleSetDefault}
        />
      )}

      {currentRoute === 'settings' && (
        <SettingsScreen onBack={() => setCurrentRoute('focus')} />
      )}

      {/* Close While Running Notice Modal */}
      <CloseNoticeModal
        isOpen={isCloseNoticeOpen}
        onDismiss={() => setIsCloseNoticeOpen(false)}
        onChoice={handleCloseChoice}
      />
    </div>
  )
}
