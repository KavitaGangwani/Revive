import { BrowserWindow, screen, app } from 'electron'
import { join } from 'path'
import { SessionSnapshot, IPC_CHANNELS, AppSettings } from '../shared/types'

export interface OverlayManagerOptions {
  getSettings: () => AppSettings;
  getMainWindow: () => BrowserWindow | null;
  onSnooze: () => void;
  onResumeFocus: () => void;
}

export class OverlayManager {
  private overlayWindows: { displayId: number; window: BrowserWindow; isPrimary: boolean }[] = []
  private getSettings: () => AppSettings
  private getMainWindow: () => BrowserWindow | null
  private isOverlayActive: boolean = false
  private closeTimeout: any = null
  private currentSnapshot: SessionSnapshot | null = null

  constructor(options: OverlayManagerOptions) {
    this.getSettings = options.getSettings
    this.getMainWindow = options.getMainWindow
  }

  public getIsOverlayActive(): boolean {
    return this.isOverlayActive
  }

  public handleSnapshot(snapshot: SessionSnapshot): void {
    this.currentSnapshot = snapshot
    const shouldShow =
      (snapshot.phase === 'transition-to-rest' ||
        snapshot.phase === 'rest' ||
        snapshot.phase === 'session-complete') &&
      !snapshot.isSnoozed

    if (shouldShow && !this.isOverlayActive) {
      this.openOverlays(snapshot)
    } else if (!shouldShow && this.isOverlayActive) {
      if (snapshot.isSnoozed) {
        this.closeOverlays(true)
      } else {
        this.closeOverlays()
      }
    } else if (shouldShow && this.isOverlayActive) {
      // Forward snapshot to all overlay windows
      for (const item of this.overlayWindows) {
        if (!item.window.isDestroyed()) {
          item.window.webContents.send(IPC_CHANNELS.SESSION_TICK, snapshot)
        }
      }
    }
  }

  public openOverlays(_snapshot?: SessionSnapshot): void {
    if (this.isOverlayActive && this.overlayWindows.length > 0) return
    this.isOverlayActive = true

    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout)
      this.closeTimeout = null
    }

    const settings = this.getSettings()
    const allDisplays = settings?.takeover?.allDisplays ?? true
    const displays = allDisplays ? screen.getAllDisplays() : [screen.getPrimaryDisplay()]
    const primaryDisplay = screen.getPrimaryDisplay()
    const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

    this.overlayWindows = []

    for (const display of displays) {
      const isPrimary = display.id === primaryDisplay.id
      const win = this.createOverlayWindow(display, isPrimary, isDev)
      this.overlayWindows.push({ displayId: display.id, window: win, isPrimary })
    }
  }

  private createOverlayWindow(
    display: Electron.Display,
    isPrimary: boolean,
    isDev: boolean
  ): BrowserWindow {
    const win = new BrowserWindow({
      x: Math.round(display.bounds.x),
      y: Math.round(display.bounds.y),
      width: Math.round(display.bounds.width),
      height: Math.round(display.bounds.height),
      frame: false,
      fullscreen: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#020407',
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webviewTag: true
      }
    })

    win.setAlwaysOnTop(true, 'screen-saver')

    const mode = isPrimary ? 'primary' : 'backdrop'
    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?overlay=${mode}&displayId=${display.id}`)
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { overlay: mode, displayId: String(display.id) }
      })
    }

    win.once('ready-to-show', () => {
      if (!win.isDestroyed()) {
        win.show()
        if (isPrimary) {
          win.focus()
        }
      }
    })

    win.on('closed', () => {
      this.overlayWindows = this.overlayWindows.filter((w) => w.window !== win)
      if (this.overlayWindows.length === 0) {
        this.isOverlayActive = false
      }
    })

    return win
  }

  public handleDisplayChange(): void {
    if (!this.isOverlayActive) return

    const settings = this.getSettings()
    const allDisplays = settings?.takeover?.allDisplays ?? true
    const currentDisplays = allDisplays ? screen.getAllDisplays() : [screen.getPrimaryDisplay()]
    const primaryDisplay = screen.getPrimaryDisplay()
    const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

    const activeDisplayIds = new Set(currentDisplays.map((d) => d.id))

    // 1. Remove overlay windows whose displays were removed
    for (const item of [...this.overlayWindows]) {
      if (!activeDisplayIds.has(item.displayId)) {
        if (!item.window.isDestroyed()) {
          item.window.close()
        }
        this.overlayWindows = this.overlayWindows.filter((w) => w.displayId !== item.displayId)
      }
    }

    // 2. Update or create overlay windows for current displays
    for (const display of currentDisplays) {
      const isPrimary = display.id === primaryDisplay.id
      const existing = this.overlayWindows.find((w) => w.displayId === display.id)

      if (existing && !existing.window.isDestroyed()) {
        existing.window.setBounds({
          x: Math.round(display.bounds.x),
          y: Math.round(display.bounds.y),
          width: Math.round(display.bounds.width),
          height: Math.round(display.bounds.height)
        })
      } else {
        const win = this.createOverlayWindow(display, isPrimary, isDev)
        this.overlayWindows.push({ displayId: display.id, window: win, isPrimary })
      }
    }
  }

  public closeOverlays(immediate: boolean = false): void {
    if (!this.isOverlayActive && this.overlayWindows.length === 0) return
    this.isOverlayActive = false

    const windowsToClose = [...this.overlayWindows]

    if (immediate) {
      for (const item of windowsToClose) {
        if (!item.window.isDestroyed()) {
          item.window.close()
        }
      }
      this.overlayWindows = []
      this.restoreMainWindow()
      return
    }

    // Broadcast exit animation to overlays (1.1s expo-in-out exit)
    for (const item of windowsToClose) {
      if (!item.window.isDestroyed()) {
        item.window.webContents.send(IPC_CHANNELS.OVERLAY_EXIT_ANIMATE)
      }
    }

    this.closeTimeout = setTimeout(() => {
      for (const item of windowsToClose) {
        if (!item.window.isDestroyed()) {
          item.window.close()
        }
      }
      this.overlayWindows = []
      this.restoreMainWindow()
    }, 1100)
  }

  private restoreMainWindow(): void {
    const mainWin = this.getMainWindow()
    if (mainWin && !mainWin.isDestroyed()) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.show()
      mainWin.focus()
    }
  }

  public destroy(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout)
      this.closeTimeout = null
    }
    this.closeOverlays(true)
  }
}
