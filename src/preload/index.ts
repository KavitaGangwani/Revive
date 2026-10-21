import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import {
  IPC_CHANNELS,
  ReviveAPI,
  MainBridge,
  AppSettings,
  SessionResume,
  SessionConfig,
  SessionSnapshot,
  UserPrefs,
  PersistedSessionState,
  DraftConfigState,
  Activity,
  LibrarySettings,
  LibraryPayload,
  LibraryAPI,
  SettingsAPI,
  DeepPartial,
  WindowAPI,
  OverlayAPI,
  SoundPack,
  MiniWindowAPI,
  ToastAPI
} from '../shared/types'

const libraryApi: LibraryAPI = {
  getLibrary: (): Promise<LibraryPayload> =>
    ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_GET),

  addActivity: (input: Omit<Activity, 'id' | 'builtIn'>): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_ADD, input),

  updateActivity: (id: string, input: Omit<Activity, 'id' | 'builtIn'>): Promise<{ ok: true; activity: Activity } | { ok: false; error: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_UPDATE, id, input),

  deleteActivity: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_DELETE, id),

  setDefault: (id: string | null): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_SET_DEFAULT, id),

  setSoundSettings: (soundPackId: string | null, volume: number): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_SET_SOUND_SETTINGS, { soundPackId, volume }),

  onLibraryChanged: (callback: (lib: LibraryPayload) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, lib: LibraryPayload): void => {
      callback(lib)
    }
    ipcRenderer.on(IPC_CHANNELS.LIBRARY_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.LIBRARY_CHANGED, handler)
    }
  }
}

const overlayApi: OverlayAPI = {
  snooze: (): Promise<SessionSnapshot> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_SNOOZE),

  resumeFocus: (): Promise<SessionSnapshot> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_RESUME_FOCUS),

  selectRestActivity: (id: string): Promise<SessionConfig> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_REST_ACTIVITY, { index: 0, id }),

  getSoundPacks: (): Promise<SoundPack[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.SOUND_GET_PACKS),

  saveSoundFile: (fileBuffer: ArrayBuffer, fileName: string): Promise<{ ok: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.SOUND_SAVE_FILE, { fileBuffer, fileName }),

  onOverlayExit: (callback: () => void): (() => void) => {
    const handler = (): void => {
      callback()
    }
    ipcRenderer.on(IPC_CHANNELS.OVERLAY_EXIT_ANIMATE, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.OVERLAY_EXIT_ANIMATE, handler)
    }
  }
}

const miniWindowApi: MiniWindowAPI = {
  toggle: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.MINI_WINDOW_TOGGLE),

  getEnabled: (): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.MINI_WINDOW_GET_ENABLED),

  setEnabled: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.MINI_WINDOW_SET_ENABLED, enabled),

  savePosition: (displayId: string, x: number, y: number): void => {
    ipcRenderer.send(IPC_CHANNELS.MINI_WINDOW_SAVE_POSITION, { displayId, x, y })
  }
}

const toastApi: ToastAPI = {
  dismiss: (id: string): void => {
    ipcRenderer.send(IPC_CHANNELS.TOAST_DISMISS, id)
  },
  snooze: (minutes?: number): Promise<SessionSnapshot> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SESSION_SNOOZE, minutes)
  },
  keepOpen: (id: string): void => {
    ipcRenderer.send(IPC_CHANNELS.TOAST_KEEP_OPEN, id)
  },
  resize: (id: string, width: number, height: number): void => {
    ipcRenderer.send(IPC_CHANNELS.TOAST_RESIZE, { id, width, height })
  }
}

const revive: ReviveAPI = {
  session: {
    getSnapshot: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_SNAPSHOT),

    start: (config: SessionConfig): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_START, config),

    skipToRest: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_SKIP_TO_REST),

    anotherOne: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_ANOTHER_ONE),

    doneForNow: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_DONE_FOR_NOW),

    snooze: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_SNOOZE),

    resumeFocus: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_RESUME_FOCUS),

    setRestActivity: (index: number, id: string | null): Promise<SessionConfig> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_REST_ACTIVITY, { index, id }),

    setLeftOffNote: (note: string): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_LEFT_OFF_NOTE, note),

    backToWork: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_BACK_TO_WORK),

    beginRestNow: (): Promise<SessionSnapshot> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_BEGIN_REST_NOW),

    getDraftConfig: (): Promise<DraftConfigState> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET_DRAFT_CONFIG),

    setDraftConfig: (draft: SessionConfig & { savedSlotChoices?: (string | null)[] }): Promise<DraftConfigState> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_DRAFT_CONFIG, draft),

    checkPendingResume: (): Promise<PersistedSessionState | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_CHECK_PENDING_RESUME),

    confirmResume: (confirm: boolean): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_CONFIRM_RESUME, confirm),

    devResetToIdle: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.DEV_RESET_TO_IDLE),

    onTick: (callback: (snapshot: SessionSnapshot) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, snapshot: SessionSnapshot): void => {
        callback(snapshot)
      }
      ipcRenderer.on(IPC_CHANNELS.SESSION_TICK, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.SESSION_TICK, handler)
      }
    }
  },

  library: {
    getActivities: async (): Promise<Activity[]> => {
      const lib = await ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_GET)
      return lib?.activities || []
    }
  },

  prefs: {
    get: (): Promise<UserPrefs> =>
      ipcRenderer.invoke(IPC_CHANNELS.PREFS_GET),

    set: (partial: Partial<UserPrefs>): Promise<UserPrefs> =>
      ipcRenderer.invoke(IPC_CHANNELS.PREFS_SET, partial)
  },

  windowControls: {
    minimize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    close: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
    show: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW_SHOW_MAIN)
  },

  overlay: overlayApi,
  miniWindow: miniWindowApi,
  toast: toastApi
}

// Legacy API for backwards compatibility
const api: MainBridge = {
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  getSessionResume: (): Promise<SessionResume> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_SESSION_RESUME)
}

const settingsApi: SettingsAPI = {
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),

  updateSettings: (patch: DeepPartial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, patch),

  onSettingsChanged: (callback: (settings: AppSettings) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, settings: AppSettings): void => {
      callback(settings)
    }
    ipcRenderer.on(IPC_CHANNELS.SETTINGS_CHANGED, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SETTINGS_CHANGED, handler)
    }
  }
}

const windowApi: WindowAPI = {
  onCloseRequested: (callback: () => void): (() => void) => {
    const handler = (): void => {
      callback()
    }
    ipcRenderer.on(IPC_CHANNELS.WINDOW_CLOSE_REQUESTED, handler)
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_CLOSE_REQUESTED, handler)
    }
  },
  closeChoice: (choice: 'hide' | 'quit'): void => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE_CHOICE, choice)
  },
  minimize: (): void => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE)
  },
  close: (): void => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE)
  },
  showMainWindow: (): void => {
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SHOW_MAIN)
  }
}

// Safely expose APIs to renderer window
try {
  contextBridge.exposeInMainWorld('api', api)
  contextBridge.exposeInMainWorld('revive', revive)
  contextBridge.exposeInMainWorld('still', revive)
  contextBridge.exposeInMainWorld('libraryApi', libraryApi)
  contextBridge.exposeInMainWorld('settingsApi', settingsApi)
  contextBridge.exposeInMainWorld('windowApi', windowApi)
  contextBridge.exposeInMainWorld('overlayApi', overlayApi)
  contextBridge.exposeInMainWorld('miniWindowApi', miniWindowApi)
  contextBridge.exposeInMainWorld('toastApi', toastApi)
  contextBridge.exposeInMainWorld('windowControls', revive.windowControls)
} catch (error) {
  console.error('[Preload] Failed to expose APIs via contextBridge:', error)
}
