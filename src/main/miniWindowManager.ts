import { BrowserWindow, screen, app, ipcMain } from 'electron'
import { join } from 'path'
import { SessionSnapshot, IPC_CHANNELS, StoreSchema } from '../shared/types'
import Store from 'electron-store'

export interface MiniWindowManagerOptions {
  store: Store<StoreSchema>;
  getMainWindow: () => BrowserWindow | null;
  onSkipToRest: () => void;
}

export class MiniWindowManager {
  private window: BrowserWindow | null = null
  private store: Store<StoreSchema>
  private getMainWindow: () => BrowserWindow | null
  private onSkipToRest: () => void
  private isEnabled: boolean = true
  private isFocusRunning: boolean = false
  private currentSnapshot: SessionSnapshot | null = null

  private readonly MINI_WIDTH = 184
  private readonly MINI_HEIGHT = 208

  constructor(options: MiniWindowManagerOptions) {
    this.store = options.store
    this.getMainWindow = options.getMainWindow
    this.onSkipToRest = options.onSkipToRest

    const savedSettings = this.store.get('settings')
    const savedPrefs = this.store.get('prefs')
    this.isEnabled = savedSettings?.miniFocusWindow ?? savedPrefs?.miniFocusWindowEnabled ?? true

    this.registerIpc()
  }

  private registerIpc(): void {
    ipcMain.handle(IPC_CHANNELS.MINI_WINDOW_TOGGLE, () => {
      this.setEnabled(!this.isEnabled)
      return this.isEnabled
    })

    ipcMain.handle(IPC_CHANNELS.MINI_WINDOW_GET_ENABLED, () => {
      return this.isEnabled
    })

    ipcMain.handle(IPC_CHANNELS.MINI_WINDOW_SET_ENABLED, (_event, enabled: boolean) => {
      this.setEnabled(Boolean(enabled))
      return this.isEnabled
    })

    ipcMain.on(
      IPC_CHANNELS.MINI_WINDOW_SAVE_POSITION,
      (_event, payload: { displayId: string; x: number; y: number }) => {
        if (payload && payload.displayId && typeof payload.x === 'number' && typeof payload.y === 'number') {
          const currentPrefs = this.store.get('prefs')
          const positions = currentPrefs.miniWindowPositions || {}
          positions[payload.displayId] = { x: Math.round(payload.x), y: Math.round(payload.y) }
          this.store.set('prefs.miniWindowPositions', positions)
        }
      }
    )

    ipcMain.on(IPC_CHANNELS.WINDOW_SHOW_MAIN, () => {
      this.showMainWindow()
    })
  }

  public getMiniWindowEnabled(): boolean {
    return this.isEnabled
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    this.store.set('prefs.miniFocusWindowEnabled', enabled)
    const settings = this.store.get('settings')
    if (settings && settings.miniFocusWindow !== enabled) {
      this.store.set('settings', { ...settings, miniFocusWindow: enabled })
    }

    if (this.isEnabled && this.isFocusRunning) {
      this.showMiniWindow()
    } else {
      this.hideMiniWindow()
    }
  }

  public handleSnapshot(snapshot: SessionSnapshot): void {
    this.currentSnapshot = snapshot
    this.isFocusRunning = snapshot.phase === 'focus'

    if (this.isFocusRunning && this.isEnabled) {
      if (!this.window || this.window.isDestroyed()) {
        this.createMiniWindow()
      } else {
        if (!this.window.isVisible()) {
          this.window.showInactive()
        }
        this.window.webContents.send(IPC_CHANNELS.SESSION_TICK, snapshot)
      }
    } else {
      this.hideMiniWindow()
    }
  }

  public handleDisplayChange(): void {
    if (!this.window || this.window.isDestroyed()) return

    const primaryDisplay = screen.getPrimaryDisplay()
    const currentBounds = this.window.getBounds()
    const workArea = primaryDisplay.workArea

    // Clamp coordinates to remain visible
    const clampedX = Math.max(workArea.x, Math.min(workArea.x + workArea.width - this.MINI_WIDTH, currentBounds.x))
    const clampedY = Math.max(workArea.y, Math.min(workArea.y + workArea.height - this.MINI_HEIGHT, currentBounds.y))

    this.window.setBounds({
      x: clampedX,
      y: clampedY,
      width: this.MINI_WIDTH,
      height: this.MINI_HEIGHT
    })
  }

  private createMiniWindow(): void {
    if (this.window && !this.window.isDestroyed()) return

    const primaryDisplay = screen.getPrimaryDisplay()
    const displayId = String(primaryDisplay.id)
    const positions = this.store.get('prefs')?.miniWindowPositions || {}
    const savedPos = positions[displayId]

    let x = savedPos ? savedPos.x : primaryDisplay.workArea.x + primaryDisplay.workArea.width - this.MINI_WIDTH - 24
    let y = savedPos ? savedPos.y : primaryDisplay.workArea.y + 24

    // Clamp to ensure it's on-screen
    x = Math.max(primaryDisplay.workArea.x, Math.min(primaryDisplay.workArea.x + primaryDisplay.workArea.width - this.MINI_WIDTH, x))
    y = Math.max(primaryDisplay.workArea.y, Math.min(primaryDisplay.workArea.y + primaryDisplay.workArea.height - this.MINI_HEIGHT, y))

    const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

    this.window = new BrowserWindow({
      x,
      y,
      width: this.MINI_WIDTH,
      height: this.MINI_HEIGHT,
      frame: false,
      transparent: true,
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    this.window.setAlwaysOnTop(true, 'screen-saver')
    try {
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    } catch {
      // Ignore if not supported on platform
    }

    const query = new URLSearchParams({
      window: 'mini',
      displayId
    }).toString()

    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${query}`)
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'), {
        search: query
      })
    }

    this.window.on('moved', () => {
      if (this.window && !this.window.isDestroyed()) {
        const bounds = this.window.getBounds()
        const primary = screen.getPrimaryDisplay()
        const id = String(primary.id)
        const currentPrefs = this.store.get('prefs')
        const pos = currentPrefs.miniWindowPositions || {}
        pos[id] = { x: bounds.x, y: bounds.y }
        this.store.set('prefs.miniWindowPositions', pos)
      }
    })

    const sendSnapshot = (): void => {
      if (this.window && !this.window.isDestroyed() && this.currentSnapshot) {
        this.window.webContents.send(IPC_CHANNELS.SESSION_TICK, this.currentSnapshot)
      }
    }

    this.window.once('ready-to-show', () => {
      if (this.window && !this.window.isDestroyed() && this.isEnabled && this.isFocusRunning) {
        this.window.showInactive()
        sendSnapshot()
      }
    })

    this.window.webContents.on('did-finish-load', () => {
      if (this.window && !this.window.isDestroyed() && this.isEnabled && this.isFocusRunning) {
        if (!this.window.isVisible()) {
          this.window.showInactive()
        }
        sendSnapshot()
      }
    })

    this.window.on('closed', () => {
      this.window = null
    })
  }

  private showMiniWindow(): void {
    if (!this.window || this.window.isDestroyed()) {
      this.createMiniWindow()
    } else if (!this.window.isVisible()) {
      this.window.showInactive()
    }
  }

  private hideMiniWindow(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide()
    }
  }

  private showMainWindow(): void {
    const mainWin = this.getMainWindow()
    if (mainWin && !mainWin.isDestroyed()) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.show()
      mainWin.focus()
    }
  }

  public destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
      this.window = null
    }
  }
}
