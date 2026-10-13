import { app, BrowserWindow, ipcMain, powerMonitor, screen, session } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { runBootSequence } from './boot'
import { getStore, initStore, clampAndMergeSettings, defaultSoundPacks, getFullLibrary, inferPhaseKind } from './store'
import { builtInActivities } from './builtInActivities'
import { SessionEngine } from './sessionEngine'
import { TrayManager } from './tray'
import { OverlayManager } from './overlayManager'
import { ToastManager } from './toastManager'
import { NudgeScheduler } from './nudgeScheduler'
import { MiniWindowManager } from './miniWindowManager'
import {
  IPC_CHANNELS,
  SessionConfig,
  UserPrefs,
  Activity,
  ActivityType,
  LibrarySettings,
  AppSettings,
  DeepPartial,
  SoundPack,
  PhaseKind,
  BreathingPhase
} from '../shared/types'

// Enable autoplay for audio without user interaction requirement in frameless overlay
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  let mainWin: BrowserWindow | null = null
  let isQuitting = false
  const store = initStore()

  app.on('before-quit', () => {
    isQuitting = true
  })

  // Helper to sync autostart setting to Windows login items
  const syncAutostart = (enabled: boolean): void => {
    try {
      if (app.isPackaged || process.platform === 'win32') {
        app.setLoginItemSettings({
          openAtLogin: enabled,
          openAsHidden: true
        })
      }
    } catch (err) {
      console.error('[autostart] failed to set login items:', err)
    }
  }

  // Initial autostart sync
  const initialSettings = store.get('settings')
  if (typeof initialSettings?.autostart === 'boolean') {
    syncAutostart(initialSettings.autostart)
  }

  // Helper to broadcast library changes to all windows
  const broadcastLibrary = (): void => {
    const libPayload = getFullLibrary()
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.LIBRARY_CHANGED, libPayload)
      }
    })
  }

  // Helper to broadcast settings changes to all windows
  const broadcastSettings = (settings: AppSettings): void => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.SETTINGS_CHANGED, settings)
      }
    })
  }

  const toastManager = new ToastManager()

  const overlayManager = new OverlayManager({
    getSettings: () => store.get('settings'),
    getMainWindow: () => mainWin,
    onSnooze: () => {
      sessionEngine.snooze(store.get('settings')?.takeover?.snoozeMinutes || 2)
    },
    onResumeFocus: () => {
      sessionEngine.resumeFocus()
    }
  })

  const miniWindowManager = new MiniWindowManager({
    store,
    getMainWindow: () => mainWin,
    onSkipToRest: () => {
      sessionEngine.skipToRest()
    }
  })

  const trayManager = new TrayManager({
    getMainWindow: () => mainWin,
    onQuit: () => {
      isQuitting = true
      sessionEngine.doneForNow()
      overlayManager.destroy()
      miniWindowManager.destroy()
      toastManager.destroy()
      nudgeScheduler.destroy()
      trayManager.destroyTray()
      app.quit()
    },
    onSkipToRest: () => {
      sessionEngine.skipToRest()
    },
    onToggleMiniWindow: () => {
      const current = miniWindowManager.getMiniWindowEnabled()
      miniWindowManager.setEnabled(!current)
    },
    getMiniWindowEnabled: () => miniWindowManager.getMiniWindowEnabled()
  })

  const nudgeScheduler = new NudgeScheduler({
    getSettings: () => store.get('settings'),
    toastManager,
    isOverlayActive: () => overlayManager.getIsOverlayActive()
  })

  // Initialize SessionEngine
  const sessionEngine = new SessionEngine({
    isPackaged: app.isPackaged,
    onSnapshot: (snapshot) => {
      trayManager.handleSnapshot(snapshot)
      overlayManager.handleSnapshot(snapshot)
      miniWindowManager.handleSnapshot(snapshot)
      nudgeScheduler.handleSnapshot(snapshot)

      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.SESSION_TICK, snapshot)
        }
      })
    },
    onPersist: (state) => {
      store.set('persistedSession', state)
    },
    onRestWarning: () => {
      const settings = store.get('settings')
      const restWarningEnabled = settings?.takeover?.restWarning ?? true
      if (restWarningEnabled) {
        toastManager.showToast('restWarning')
      }
    },
    getDefaultRestActivityId: () => {
      const lib = getFullLibrary()
      return lib?.defaultId ?? null
    },
    getActivityById: (id: string) => {
      const lib = getFullLibrary()
      return lib?.activities?.find((a) => a.id === id)
    }
  })

  // Multi-Display Listeners
  const handleDisplaysUpdated = (): void => {
    overlayManager.handleDisplayChange()
    miniWindowManager.handleDisplayChange()
    toastManager.repositionToasts()
  }

  // System sleep / wake listener
  powerMonitor.on('resume', () => {
    sessionEngine.handleSystemResume()
    nudgeScheduler.resetTimers()
  })

  powerMonitor.on('suspend', () => {
    // Send stop audio signal if overlay is active
    BrowserWindow.getAllWindows().forEach((w) => {
      if (!w.isDestroyed()) {
        w.webContents.send('power:suspend')
      }
    })
  })

  app.on('second-instance', () => {
    if (mainWin && !mainWin.isDestroyed()) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.show()
      mainWin.focus()
    }
  })

  const getEventWindow = (event: Electron.IpcMainEvent): BrowserWindow | null => {
    try {
      return (
        BrowserWindow.fromWebContents(event.sender) ||
        (event.sender ? BrowserWindow.fromId(event.sender.id) : null) ||
        BrowserWindow.getFocusedWindow() ||
        mainWin ||
        BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) ||
        null
      )
    } catch {
      return mainWin || BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) || null
    }
  }

  const isSessionRunning = (): boolean => {
    const snapshot = sessionEngine.getSnapshot()
    return (
      snapshot.phase === 'focus' ||
      snapshot.phase === 'transition-to-rest' ||
      snapshot.phase === 'rest' ||
      snapshot.phase === 'transition-to-focus'
    )
  }

  const handleCloseAttempt = (targetWin?: BrowserWindow | null): void => {
    if (isQuitting) {
      if (targetWin && !targetWin.isDestroyed()) {
        targetWin.close()
      } else {
        app.quit()
      }
      return
    }

    // Hide to tray on close
    if (mainWin && !mainWin.isDestroyed()) {
      mainWin.hide()
    }
  }

  // Window Controls IPC
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const win = getEventWindow(event)
    if (win && !win.isDestroyed()) {
      win.minimize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const win = getEventWindow(event)
    if (win && !win.isDestroyed()) {
      if (mainWin && win.id === mainWin.id) {
        handleCloseAttempt(win)
      } else {
        win.close()
      }
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_SHOW_MAIN, () => {
    if (mainWin && !mainWin.isDestroyed()) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.show()
      mainWin.focus()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE_CHOICE, (_event, choice: unknown) => {
    if (choice === 'hide') {
      if (mainWin && !mainWin.isDestroyed()) {
        mainWin.hide()
      }
    } else if (choice === 'quit') {
      isQuitting = true
      sessionEngine.doneForNow()
      overlayManager.destroy()
      miniWindowManager.destroy()
      toastManager.destroy()
      nudgeScheduler.destroy()
      trayManager.destroyTray()
      app.quit()
    }
  })

  // IPC Handlers — Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return store.get('settings')
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_event, patch: unknown) => {
    const current = store.get('settings')
    const updated = clampAndMergeSettings(current, patch as DeepPartial<AppSettings>)
    store.set('settings', updated)

    if (typeof (patch as any)?.autostart === 'boolean') {
      syncAutostart(Boolean((patch as any).autostart))
    }

    if (typeof (patch as any)?.miniFocusWindow === 'boolean') {
      miniWindowManager.setEnabled(Boolean((patch as any).miniFocusWindow))
    }

    broadcastSettings(updated)
    return updated
  })

  // IPC Handlers — Session
  ipcMain.handle(IPC_CHANNELS.SESSION_GET_SNAPSHOT, () => {
    return sessionEngine.getSnapshot()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_START, (_event, rawConfig: unknown) => {
    if (typeof rawConfig !== 'object' || rawConfig === null) {
      return sessionEngine.getSnapshot()
    }
    const config = rawConfig as Partial<SessionConfig>
    return sessionEngine.start(config)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_SKIP_TO_REST, () => {
    return sessionEngine.skipToRest()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_ANOTHER_ONE, () => {
    return sessionEngine.anotherOne()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_DONE_FOR_NOW, () => {
    return sessionEngine.doneForNow()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_SNOOZE, () => {
    const settings = store.get('settings')
    const minutes = settings?.takeover?.snoozeMinutes ?? 2
    return sessionEngine.snooze(minutes)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_RESUME_FOCUS, () => {
    return sessionEngine.resumeFocus()
  })

  ipcMain.handle(
    IPC_CHANNELS.SESSION_SET_REST_ACTIVITY,
    (_event, payload: { index: number; id: string | null }) => {
      if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof payload.index !== 'number' ||
        payload.index < 0 ||
        payload.index > 7
      ) {
        return sessionEngine.getSnapshot().config
      }
      const activityId = typeof payload.id === 'string' ? payload.id : null
      const updatedConfig = sessionEngine.setRestActivity(payload.index, activityId)

      // Sync to persisted prefs
      const currentPrefs = store.get('prefs')
      const updatedRestActivityIds = [...(currentPrefs.restActivityIds || [])]
      while (updatedRestActivityIds.length < 8) {
        updatedRestActivityIds.push(null)
      }
      updatedRestActivityIds[payload.index] = activityId
      store.set('prefs.restActivityIds', updatedRestActivityIds)

      return updatedConfig
    }
  )

  // IPC Handlers — Sounds & Packs
  ipcMain.handle(IPC_CHANNELS.SOUND_GET_PACKS, () => {
    const lib = store.get('library')
    return lib?.soundPacks || defaultSoundPacks
  })

  ipcMain.handle(
    IPC_CHANNELS.SOUND_SAVE_FILE,
    async (_event, payload: { fileBuffer: ArrayBuffer; fileName: string }) => {
      try {
        if (!payload || !payload.fileBuffer || !payload.fileName) {
          return { ok: false, error: 'Invalid file payload' }
        }
        const soundsDir = join(app.getPath('userData'), 'sounds')
        await fs.mkdir(soundsDir, { recursive: true })
        const safeName = `${Date.now()}_${payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const targetPath = join(soundsDir, safeName)
        await fs.writeFile(targetPath, Buffer.from(payload.fileBuffer))
        return { ok: true, path: targetPath }
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Failed to save sound file' }
      }
    }
  )

  // IPC Handlers — Library
  ipcMain.handle(IPC_CHANNELS.LIBRARY_GET, () => {
    return getFullLibrary()
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_GET_ACTIVITIES, () => {
    return getFullLibrary().activities
  })

  function validateActivityInput(
    rawInput: unknown
  ): { ok: true; data: Omit<Activity, 'id' | 'builtIn'> } | { ok: false; error: string } {
    if (typeof rawInput !== 'object' || rawInput === null) {
      return { ok: false, error: 'Give it a name.' }
    }
    const input = rawInput as any

    // 1. Name required, trimmed, 1-40. "Give it a name."
    const name = typeof input.name === 'string' ? input.name.trim() : typeof input.title === 'string' ? input.title.trim() : ''
    if (!name || name.length === 0 || name.length > 40) {
      return { ok: false, error: 'Give it a name.' }
    }

    // Type: 'breathing' | 'routine' | undefined
    const type: ActivityType | undefined = (input.type === 'breathing' || input.type === 'routine')
      ? input.type
      : undefined

    let phases: { label: string; seconds: number; kind?: PhaseKind }[] | undefined = undefined
    let steps: { name: string; seconds: number }[] | undefined = undefined

    // 2. Breathing: at least one phase; every phase needs a label (1–24) and 1–30 seconds.
    if (type === 'breathing') {
      if (!Array.isArray(input.phases) || input.phases.length < 1 || input.phases.length > 8) {
        return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
      }
      phases = []
      for (let i = 0; i < input.phases.length; i++) {
        const p = input.phases[i]
        if (!p || typeof p !== 'object') {
          return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
        }
        const label = typeof p.label === 'string' ? p.label.trim() : ''
        const seconds = Number(p.seconds)
        if (!label || label.length < 1 || label.length > 24 || !Number.isFinite(seconds) || seconds < 1 || seconds > 30) {
          return { ok: false, error: 'Every phase needs a label and 1–30 seconds.' }
        }
        const kind = (p.kind && ['in', 'hold', 'out'].includes(p.kind))
          ? p.kind
          : inferPhaseKind(label, i, input.phases.length)
        phases.push({
          label,
          seconds: Math.round(seconds),
          kind
        })
      }
    }

    // 3. Routine: at least one step; every step needs a name (1–24) and 5–300 seconds.
    if (type === 'routine') {
      if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 12) {
        return { ok: false, error: 'Every step needs a name and 5–300 seconds.' }
      }
      steps = []
      for (let i = 0; i < input.steps.length; i++) {
        const s = input.steps[i]
        if (!s || typeof s !== 'object') {
          return { ok: false, error: 'Every step needs a name and 5–300 seconds.' }
        }
        const stepName = typeof s.name === 'string' ? s.name.trim() : ''
        const seconds = Number(s.seconds)
        if (!stepName || stepName.length < 1 || stepName.length > 24 || !Number.isFinite(seconds) || seconds < 5 || seconds > 300) {
          return { ok: false, error: 'Every step needs a name and 5–300 seconds.' }
        }
        steps.push({
          name: stepName,
          seconds: Math.round(seconds)
        })
      }
    }

    // 4. Media YouTube / Spotify
    let media: { kind: 'youtube' | 'spotify'; url: string } | undefined = undefined
    if (input.media && typeof input.media === 'object' && input.media.kind) {
      const rawKind = input.media.kind
      const rawUrl = typeof input.media.url === 'string' ? input.media.url.trim() : ''
      if (rawKind === 'youtube') {
        try {
          const parsed = new URL(rawUrl)
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
            return { ok: false, error: 'Paste a valid YouTube link, or choose None.' }
          }
          media = { kind: 'youtube', url: rawUrl }
        } catch {
          return { ok: false, error: 'Paste a valid YouTube link, or choose None.' }
        }
      } else if (rawKind === 'spotify') {
        try {
          const parsed = new URL(rawUrl)
          const host = parsed.hostname.toLowerCase()
          const isSpotifyHost = host === 'open.spotify.com'
          const hasValidPath = /^\/(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/.test(parsed.pathname)
          if (!isSpotifyHost || !hasValidPath) {
            return { ok: false, error: 'Paste a valid Spotify link, or choose None.' }
          }
          media = { kind: 'spotify', url: rawUrl }
        } catch {
          return { ok: false, error: 'Paste a valid Spotify link, or choose None.' }
        }
      }
    }

    // 5. Note optional, trimmed, max 120.
    let note: string | undefined = undefined
    if (typeof input.note === 'string') {
      const trimmedNote = input.note.trim()
      if (trimmedNote.length > 120) {
        return { ok: false, error: 'Note must be 120 characters or fewer.' }
      }
      note = trimmedNote || undefined
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
  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_ADD,
    (_event, rawInput: unknown): { ok: true; activity: Activity } | { ok: false; error: string } => {
      const validation = validateActivityInput(rawInput)
      if (!validation.ok) {
        return validation
      }

      const currentLib = store.get('library') || { custom: [], defaults: {} }
      const currentCustom: Activity[] = Array.isArray(currentLib.custom) ? [...currentLib.custom] : []

      const newActivity: Activity = {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        builtIn: false,
        ...validation.data
      }

      currentCustom.push(newActivity)
      const updatedLib: LibrarySettings = {
        ...currentLib,
        custom: currentCustom
      }

      store.set('library', updatedLib)
      broadcastLibrary()

      return { ok: true, activity: newActivity }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_UPDATE,
    (
      _event,
      arg1: unknown,
      arg2?: unknown
    ): { ok: true; activity: Activity } | { ok: false; error: string } => {
      let id: string
      let rawInput: unknown
      if (typeof arg1 === 'object' && arg1 !== null && 'id' in arg1) {
        id = String((arg1 as any).id)
        rawInput = (arg1 as any).input
      } else {
        id = typeof arg1 === 'string' ? arg1 : ''
        rawInput = arg2
      }

      if (!id) {
        return { ok: false, error: 'Activity ID is required.' }
      }

      // Rejects built-ins with exact error per spec
      if (builtInActivities.some((b) => b.id === id)) {
        return { ok: false, error: "Built-in activities can't be edited." }
      }

      const currentLib = store.get('library') || { custom: [], defaults: {} }
      const currentCustom: Activity[] = Array.isArray(currentLib.custom) ? [...currentLib.custom] : []
      const existingIdx = currentCustom.findIndex((a) => a.id === id)
      if (existingIdx === -1) {
        return { ok: false, error: 'Activity not found.' }
      }

      const validation = validateActivityInput(rawInput)
      if (!validation.ok) {
        return validation
      }

      const updatedActivity: Activity = {
        ...currentCustom[existingIdx],
        id,
        builtIn: false,
        ...validation.data
      }

      currentCustom[existingIdx] = updatedActivity
      const updatedLib: LibrarySettings = {
        ...currentLib,
        custom: currentCustom
      }

      store.set('library', updatedLib)
      broadcastLibrary()

      return { ok: true, activity: updatedActivity }
    }
  )

  ipcMain.handle(IPC_CHANNELS.LIBRARY_DELETE, (_event, id: unknown) => {
    if (typeof id !== 'string') return
    const isBuiltIn = builtInActivities.some((a) => a.id === id)
    if (isBuiltIn) {
      throw new Error("Built-in activities can't be edited.")
    }
    const currentLib = store.get('library') || { custom: [], defaults: {} }
    const currentCustom = Array.isArray(currentLib.custom) ? [...currentLib.custom] : []
    const updatedCustom = currentCustom.filter((a) => a.id !== id)

    let defaultId = currentLib.defaults?.restActivityId
    if (defaultId === id) {
      defaultId = null
    }

    const updatedLib: LibrarySettings = {
      ...currentLib,
      custom: updatedCustom,
      defaults: { ...currentLib.defaults, restActivityId: defaultId }
    }
    store.set('library', updatedLib)

    const currentPrefs = store.get('prefs')
    let prefsChanged = false
    const updatedSlotIds = [...(currentPrefs.restActivityIds || [])].map((slotId, index) => {
      if (slotId === id) {
        prefsChanged = true
        sessionEngine.setRestActivity(index, null)
        return null
      }
      return slotId
    })

    if (prefsChanged) {
      store.set('prefs.restActivityIds', updatedSlotIds)
    }

    broadcastLibrary()
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_SET_DEFAULT, (_event, id: unknown) => {
    const rawId = typeof id === 'string' && id.trim() ? id.trim() : null
    const currentLib = store.get('library') || { custom: [], defaults: {} }
    const updatedLib: LibrarySettings = {
      ...currentLib,
      defaults: { ...currentLib.defaults, restActivityId: rawId }
    }
    store.set('library', updatedLib)
    broadcastLibrary()
  })

  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_SET_SOUND_SETTINGS,
    (_event, payload: { soundPackId: string | null; volume: number }) => {
      const currentLib = store.get('library')
      const updatedLib: LibrarySettings = {
        ...currentLib,
        defaults: {
          ...currentLib.defaults,
          breathingSoundPackId: payload?.soundPackId ?? currentLib.defaults?.breathingSoundPackId ?? 'soft-tones',
          breathingSoundVolume: typeof payload?.volume === 'number' ? Math.max(0, Math.min(1, payload.volume)) : 0.8
        }
      }
      store.set('library', updatedLib)
      broadcastLibrary()
    }
  )

  // IPC Handlers — Preferences
  ipcMain.handle(IPC_CHANNELS.PREFS_GET, () => {
    return store.get('prefs')
  })

  ipcMain.handle(IPC_CHANNELS.PREFS_SET, (_event, partial: unknown) => {
    if (typeof partial !== 'object' || partial === null) {
      return store.get('prefs')
    }
    const current = store.get('prefs')
    const updated: UserPrefs = {
      ...current,
      ...(partial as Partial<UserPrefs>)
    }
    store.set('prefs', updated)
    return updated
  })

  // Legacy Handlers
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return store.get('settings')
  })

  ipcMain.handle(IPC_CHANNELS.GET_SESSION_RESUME, () => {
    return store.get('session')
  })

  app.whenReady().then(async () => {
    const appReadyAt = Date.now()
    console.log('[boot] app ready: 0ms')
    const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

    // Enforce Strict CSP with webview and media allowances
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            isDev
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: ws: data: blob: https:; frame-src 'self' https:; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:;"
              : "default-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'self' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; media-src 'self' data: https: blob:; connect-src 'self' https:;"
          ]
        }
      })
    })

    // Fix YouTube Error 153: inject valid Referer & Origin headers on YouTube requests
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = details.url || ''
      if (url.includes('youtube.com') || url.includes('youtube-nocookie.com')) {
        details.requestHeaders['Referer'] = 'https://www.youtube.com/'
        details.requestHeaders['Origin'] = 'https://www.youtube.com'
      }
      callback({ requestHeaders: details.requestHeaders })
    })

    const setupMainWindow = (win: BrowserWindow): void => {
      win.on('close', (e) => {
        if (!isQuitting) {
          e.preventDefault()
          win.hide()
        }
      })
    }

    trayManager.createTray()

    // Multi-Display Listeners (safe after app ready)
    screen.on('display-added', handleDisplaysUpdated)
    screen.on('display-removed', handleDisplaysUpdated)
    screen.on('display-metrics-changed', handleDisplaysUpdated)

    // Resume persisted session on boot
    const persisted = store.get('persistedSession')
    if (persisted) {
      sessionEngine.resumeFromPersisted(persisted)
      trayManager.handleSnapshot(sessionEngine.getSnapshot())
    }

    const { mainWindow } = await runBootSequence(appReadyAt)
    mainWin = mainWindow
    setupMainWindow(mainWin)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        runBootSequence(Date.now()).then((ctx) => {
          mainWin = ctx.mainWindow
          setupMainWindow(mainWin)
        })
      } else if (mainWin && !mainWin.isDestroyed()) {
        if (mainWin.isMinimized()) mainWin.restore()
        mainWin.show()
        mainWin.focus()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (isQuitting) {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    }
  })
}
