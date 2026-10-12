import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { join } from 'path'
import { SessionPhase, SessionSnapshot } from '../shared/types'

export interface TrayManagerOptions {
  getMainWindow: () => BrowserWindow | null;
  onQuit: () => void;
  onSkipToRest: () => void;
  onToggleMiniWindow: () => void;
  getMiniWindowEnabled: () => boolean;
}

export class TrayManager {
  private tray: Tray | null = null
  private getMainWindow: () => BrowserWindow | null
  private onQuit: () => void
  private onSkipToRest: () => void
  private onToggleMiniWindow: () => void
  private getMiniWindowEnabled: () => boolean
  private currentSnapshot: SessionSnapshot | null = null

  constructor(options: TrayManagerOptions) {
    this.getMainWindow = options.getMainWindow
    this.onQuit = options.onQuit
    this.onSkipToRest = options.onSkipToRest
    this.onToggleMiniWindow = options.onToggleMiniWindow
    this.getMiniWindowEnabled = options.getMiniWindowEnabled

    if (app?.isReady?.()) {
      this.createTray()
    }
  }

  public isSessionRunning(phase: SessionPhase): boolean {
    return (
      phase === 'focus' ||
      phase === 'transition-to-rest' ||
      phase === 'rest' ||
      phase === 'transition-to-focus'
    )
  }

  public handleSnapshot(snapshot: SessionSnapshot): void {
    this.currentSnapshot = snapshot
    if (!this.tray && app?.isReady?.()) {
      this.createTray()
    }
    this.updateTooltip(snapshot)
    this.updateContextMenu()
  }

  public createTray(): void {
    if (this.tray) return
    if (!nativeImage || !Tray || !app || !app?.isReady?.()) return

    try {
      const iconPath = join(__dirname, '../../assets/tray.png')
      let icon = nativeImage.createFromPath(iconPath)
      if (icon.isEmpty()) {
        const fallbackPath = join(app.getAppPath(), 'assets/tray.png')
        icon = nativeImage.createFromPath(fallbackPath)
      }

      this.tray = new Tray(icon)
      this.tray.setToolTip('Revive · Idle')
      this.updateContextMenu()

      this.tray.on('click', () => {
        this.showMainWindow()
      })
    } catch {
      // Ignored in unit testing environments without native display
    }
  }

  public updateContextMenu(): void {
    if (!this.tray) return

    const isFocus = this.currentSnapshot?.phase === 'focus'
    const miniEnabled = this.getMiniWindowEnabled()

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Revive',
        click: (): void => {
          this.showMainWindow()
        }
      },
      {
        label: miniEnabled ? 'Hide mini timer' : 'Show mini timer',
        click: (): void => {
          this.onToggleMiniWindow()
          this.updateContextMenu()
        }
      },
      {
        label: 'Skip to rest',
        enabled: Boolean(isFocus),
        click: (): void => {
          this.onSkipToRest()
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: (): void => {
          this.destroyTray()
          this.onQuit()
        }
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  public updateTooltip(snapshot: SessionSnapshot): void {
    if (!this.tray) return

    let text = 'Revive · Idle'
    if (snapshot.phase === 'focus') {
      const timeStr = this.formatMmSs(snapshot.remainingMs)
      text = `Revive · Focus · ${timeStr}`
    } else if (snapshot.phase === 'rest') {
      const timeStr = this.formatMmSs(snapshot.remainingMs)
      text = `Revive · Rest · ${timeStr}`
    } else if (snapshot.phase === 'transition-to-rest') {
      text = 'Revive · Rest'
    } else if (snapshot.phase === 'transition-to-focus') {
      text = 'Revive · Focus'
    } else if (snapshot.phase === 'session-complete') {
      text = 'Revive · Session Complete'
    }

    try {
      this.tray.setToolTip(text)
    } catch {
      // Ignore if tray destroyed concurrently
    }
  }

  private showMainWindow(): void {
    const win = this.getMainWindow()
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  }

  private formatMmSs(ms: number): string {
    const totalSec = Math.max(0, Math.ceil(ms / 1000))
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  public destroyTray(): void {
    if (this.tray) {
      try {
        this.tray.destroy()
      } catch {
        // Ignore
      }
      this.tray = null
    }
  }
}
