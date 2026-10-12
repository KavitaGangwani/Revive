import { app, BrowserWindow, ipcMain, powerMonitor, screen, session } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { runBootSequence } from './boot'
import { getStore, initStore, clampAndMergeSettings, defaultSoundPacks } from './store'
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
  const broadcastLibrary = (lib: LibrarySettings): void => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.LIBRARY_CHANGED, lib)
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
      const lib = store.get('library')
      return lib?.defaults?.restActivityId ?? null
    },
    getActivityById: (id: string) => {
      const lib = store.get('library')
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
    handleCloseAttempt(win)
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
    return store.get('library')
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_GET_ACTIVITIES, () => {
    const lib = store.get('library')
    return lib?.activities || []
  })

  function validateActivityPayload(
    rawInput: unknown,
    forcedType?: ActivityType
  ): { ok: true; data: { name: string; type: ActivityType; phases?: BreathingPhase[]; url?: string; note?: string } } | { ok: false; error: string } {
    if (typeof rawInput !== 'object' || rawInput === null) {
      return { ok: false, error: 'Invalid input format.' }
    }
    const input = rawInput as any

    const name = typeof input.name === 'string' ? input.name.trim() : ''
    if (!name) {
      return { ok: false, error: 'Name is required.' }
    }
    if (name.length > 40) {
      return { ok: false, error: 'Name must be 40 characters or fewer.' }
    }

    const type = forcedType || input.type
    if (!['breathing', 'custom', 'youtube', 'spotify'].includes(type)) {
      return { ok: false, error: 'Invalid activity type.' }
    }

    let note: string | undefined
    if (typeof input.note === 'string') {
      const trimmedNote = input.note.trim()
      if (trimmedNote.length > 120) {
        return { ok: false, error: 'Note must be 120 characters or fewer.' }
      }
      note = trimmedNote || undefined
    }

    let phases: BreathingPhase[] | undefined
    if (type === 'breathing') {
      if (!Array.isArray(input.phases) || input.phases.length < 2) {
        return { ok: false, error: 'Breathing patterns must have at least 2 phases.' }
      }
      if (input.phases.length > 8) {
        return { ok: false, error: 'Breathing patterns can have at most 8 phases.' }
      }
      const totalPhases = input.phases.length
      phases = []
      for (let i = 0; i < totalPhases; i++) {
        const p = input.phases[i]
        if (!p || typeof p !== 'object') {
          return { ok: false, error: 'Invalid phase definition.' }
        }
        const label = typeof p.label === 'string' ? p.label.trim() : ''
        if (!label) {
          return { ok: false, error: 'Each phase must have a name.' }
        }
        const seconds = Number(p.seconds)
        if (!Number.isFinite(seconds) || seconds < 1 || seconds > 60) {
          return { ok: false, error: 'Phase duration must be between 1 and 60 seconds.' }
        }
        const kind: PhaseKind = (p.kind === 'in' || p.kind === 'hold' || p.kind === 'out')
          ? p.kind
          : (i === 0 ? 'in' : i === totalPhases - 1 ? 'out' : 'hold')

        phases.push({
          label,
          seconds: Math.round(seconds),
          kind,
          soundId: typeof p.soundId === 'string' ? p.soundId : undefined
        })
      }
    }

    let url: string | undefined
    if (type === 'youtube' || type === 'spotify') {
      const rawUrl = typeof input.url === 'string' ? input.url.trim() : ''
      if (!rawUrl) {
        return { ok: false, error: 'URL is required.' }
      }
      if (type === 'youtube') {
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        const match = rawUrl.match(ytRegex)
        if (!match) {
          return { ok: false, error: 'Please enter a valid YouTube link.' }
        }
        const videoId = match[5]
        url = `https://www.youtube.com/watch?v=${videoId}`
      } else if (type === 'spotify') {
        const spotRegex = /^(https?:\/\/)?(open\.spotify\.com\/(track|playlist|album|episode|show)\/|spotify:(track|playlist|album|episode|show):)([a-zA-Z0-9]+)/
        const match = rawUrl.match(spotRegex)
        if (!match) {
          return { ok: false, error: 'Please enter a valid Spotify link.' }
        }
        const mediaType = match[3] || match[4]
        const mediaId = match[5]
        url = `https://open.spotify.com/${mediaType}/${mediaId}`
      }
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

  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_ADD,
    (_event, rawInput: unknown): { ok: true; activity: Activity } | { ok: false; error: string } => {
      const result = validateActivityPayload(rawInput)
      if (!result.ok) {
        return result
      }
      const { name, type, phases, url, note } = result.data
      const currentLib = store.get('library')

      const newActivity: Activity = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        name,
        title: name,
        isBuiltIn: false,
        note,
        phases: type === 'breathing' ? phases : undefined,
        url: type === 'youtube' || type === 'spotify' ? url : undefined,
        createdAt: Date.now()
      }

      const updatedActivities = [...currentLib.activities, newActivity]
      const updatedLib: LibrarySettings = {
        ...currentLib,
        activities: updatedActivities,
        defaults: currentLib.defaults || {}
      }

      store.set('library', updatedLib)
      broadcastLibrary(updatedLib)

      return { ok: true, activity: newActivity }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_UPDATE,
    (
      _event,
      payload: { id: unknown; input: unknown }
    ): { ok: true; activity: Activity } | { ok: false; error: string } => {
      if (!payload || typeof payload !== 'object') {
        return { ok: false, error: 'Invalid payload.' }
      }
      const { id, input: rawInput } = payload
      if (typeof id !== 'string') {
        return { ok: false, error: 'Activity ID is required.' }
      }

      const currentLib = store.get('library')
      const existing = currentLib.activities.find((a) => a.id === id)
      if (!existing) {
        return { ok: false, error: 'Activity not found.' }
      }
      if (existing.isBuiltIn) {
        return { ok: false, error: "Built-in activities can't be edited. Duplicate it instead." }
      }

      const result = validateActivityPayload(rawInput, existing.type)
      if (!result.ok) {
        return result
      }
      const { name, phases, url, note } = result.data

      const updatedActivity: Activity = {
        id: existing.id,
        type: existing.type,
        name,
        title: name,
        isBuiltIn: false,
        note,
        phases: existing.type === 'breathing' ? phases : undefined,
        url: existing.type === 'youtube' || existing.type === 'spotify' ? url : undefined,
        createdAt: existing.createdAt ?? Date.now()
      }

      const updatedActivities = currentLib.activities.map((a) => (a.id === id ? updatedActivity : a))
      const updatedLib: LibrarySettings = {
        ...currentLib,
        activities: updatedActivities,
        defaults: currentLib.defaults || {}
      }

      store.set('library', updatedLib)
      broadcastLibrary(updatedLib)

      return { ok: true, activity: updatedActivity }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_DUPLICATE,
    (_event, id: unknown): { ok: true; activity: Activity } | { ok: false; error: string } => {
      if (typeof id !== 'string') {
        return { ok: false, error: 'Activity not found.' }
      }
      const currentLib = store.get('library')
      const source = currentLib.activities.find((a) => a.id === id)
      if (!source) {
        return { ok: false, error: 'Activity not found.' }
      }

      const existingNames = new Set(currentLib.activities.map((a) => a.name))
      let copyIndex = 1
      let copyName = ''
      while (true) {
        const suffix = copyIndex === 1 ? ' copy' : ` copy ${copyIndex}`
        const maxBaseLen = 40 - suffix.length
        const base = source.name.slice(0, maxBaseLen).trimEnd()
        const candidate = `${base}${suffix}`
        if (!existingNames.has(candidate)) {
          copyName = candidate
          break
        }
        copyIndex++
      }

      const copyActivity: Activity = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: source.type,
        name: copyName,
        title: copyName,
        isBuiltIn: false,
        note: source.note,
        phases: source.phases ? source.phases.map((p) => ({ ...p })) : undefined,
        url: source.url,
        createdAt: Date.now()
      }

      const sourceIndex = currentLib.activities.findIndex((a) => a.id === id)
      const newActivities = [...currentLib.activities]
      if (sourceIndex !== -1) {
        newActivities.splice(sourceIndex + 1, 0, copyActivity)
      } else {
        newActivities.push(copyActivity)
      }

      const updatedLib: LibrarySettings = {
        ...currentLib,
        activities: newActivities,
        defaults: currentLib.defaults || {}
      }

      store.set('library', updatedLib)
      broadcastLibrary(updatedLib)

      return { ok: true, activity: copyActivity }
    }
  )

  ipcMain.handle(IPC_CHANNELS.LIBRARY_DELETE, (_event, id: unknown) => {
    if (typeof id !== 'string') return
    const currentLib = store.get('library')
    const toDelete = currentLib.activities.find((a) => a.id === id)
    if (!toDelete || toDelete.isBuiltIn) return

    const updatedActivities = currentLib.activities.filter((a) => a.id !== id)

    let defaultId = currentLib.defaults?.restActivityId
    if (defaultId === id) {
      defaultId = null
    }

    const updatedLib: LibrarySettings = {
      ...currentLib,
      activities: updatedActivities,
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

    broadcastLibrary(updatedLib)
  })

  ipcMain.handle(IPC_CHANNELS.LIBRARY_SET_DEFAULT, (_event, id: unknown) => {
    const rawId = typeof id === 'string' ? id : null
    const currentLib = store.get('library')
    const updatedLib: LibrarySettings = {
      ...currentLib,
      defaults: { ...currentLib.defaults, restActivityId: rawId }
    }
    store.set('library', updatedLib)
    broadcastLibrary(updatedLib)
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
      broadcastLibrary(updatedLib)
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
