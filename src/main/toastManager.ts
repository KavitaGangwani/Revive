import { BrowserWindow, screen, app, ipcMain } from 'electron'
import { join } from 'path'
import { ToastData, ToastType, IPC_CHANNELS } from '../shared/types'

export interface ActiveToast {
  id: string;
  data: ToastData;
  window: BrowserWindow;
  timer: any;
}

export class ToastManager {
  private activeToasts: ActiveToast[] = []
  private readonly TOAST_WIDTH = 340
  private readonly TOAST_HEIGHT = 86
  private readonly MARGIN = 20
  private readonly GAP = 10
  private readonly DURATION_MS = 8000

  constructor() {
    ipcMain.on(IPC_CHANNELS.TOAST_DISMISS, (_event, toastId: string) => {
      this.dismissToast(toastId)
    })
  }

  public showToast(type: ToastType): void {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    let label = ''
    let text = ''

    if (type === 'eyeBreak') {
      label = 'Eye break'
      text = 'Look at something far away for 20 seconds.'
    } else if (type === 'drinkWater') {
      label = 'Drink water'
      text = 'Take a few sips. Your body will thank you.'
    } else if (type === 'restWarning') {
      label = 'Rest in 1 minute'
      text = 'Find a good stopping point. Revive will take over the screen soon.'
    }

    const toastData: ToastData = {
      id,
      type,
      label,
      text,
      durationMs: this.DURATION_MS
    }

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workArea
    const index = this.activeToasts.length

    const x = Math.round(workArea.x + workArea.width - this.TOAST_WIDTH - this.MARGIN)
    const y = Math.round(workArea.y + workArea.height - this.TOAST_HEIGHT - this.MARGIN - index * (this.TOAST_HEIGHT + this.GAP))

    const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

    const win = new BrowserWindow({
      x,
      y,
      width: this.TOAST_WIDTH,
      height: this.TOAST_HEIGHT,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: false,
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

    win.setAlwaysOnTop(true, 'screen-saver')

    const queryParams = new URLSearchParams({
      toast: type,
      toastId: id,
      label,
      text,
      duration: String(this.DURATION_MS)
    }).toString()

    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?${queryParams}`)
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'), {
        search: queryParams
      })
    }

    win.once('ready-to-show', () => {
      if (!win.isDestroyed()) {
        win.showInactive()
      }
    })

    const timer = setTimeout(() => {
      this.dismissToast(id)
    }, this.DURATION_MS)

    const activeItem: ActiveToast = {
      id,
      data: toastData,
      window: win,
      timer
    }

    this.activeToasts.push(activeItem)

    win.on('closed', () => {
      this.activeToasts = this.activeToasts.filter((t) => t.id !== id)
      this.repositionToasts()
    })
  }

  public dismissToast(id: string): void {
    const item = this.activeToasts.find((t) => t.id === id)
    if (!item) return

    if (item.timer) {
      clearTimeout(item.timer)
    }

    if (!item.window.isDestroyed()) {
      item.window.close()
    }
  }

  public repositionToasts(): void {
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workArea

    this.activeToasts.forEach((item, index) => {
      if (!item.window.isDestroyed()) {
        const x = Math.round(workArea.x + workArea.width - this.TOAST_WIDTH - this.MARGIN)
        const y = Math.round(workArea.y + workArea.height - this.TOAST_HEIGHT - this.MARGIN - index * (this.TOAST_HEIGHT + this.GAP))
        item.window.setPosition(x, y, true)
      }
    })
  }

  public destroy(): void {
    for (const item of this.activeToasts) {
      if (item.timer) clearTimeout(item.timer)
      if (!item.window.isDestroyed()) {
        item.window.close()
      }
    }
    this.activeToasts = []
  }
}
