import { BrowserWindow, screen, app, ipcMain } from 'electron'
import { join } from 'path'
import { ToastData, ToastType, IPC_CHANNELS, REST_WARNING_SECONDS } from '../shared/types'

export interface ActiveToast {
  id: string;
  data: ToastData;
  window: BrowserWindow;
  timer: any;
  width: number;
  height: number;
}

export class ToastManager {
  private activeToasts: ActiveToast[] = []
  private readonly TOAST_WIDTH = 380
  private readonly TOAST_HEIGHT = 86
  private readonly WARNING_HEIGHT = 132
  private readonly MARGIN = 20
  private readonly GAP = 10
  private readonly DURATION_MS = 8000

  constructor() {
    ipcMain.on(IPC_CHANNELS.TOAST_DISMISS, (_event, toastId: string) => {
      this.dismissToast(toastId)
    })
    ipcMain.on(IPC_CHANNELS.TOAST_KEEP_OPEN, (_event, toastId: string) => {
      this.keepToastOpen(toastId)
    })
    ipcMain.on(
      IPC_CHANNELS.TOAST_RESIZE,
      (_event, payload: { id: string; width: number; height: number }) => {
        if (payload && typeof payload.id === 'string' && typeof payload.height === 'number') {
          const clampedWidth = Math.max(360, Math.min(420, Math.round(payload.width || this.TOAST_WIDTH)))
          const clampedHeight = Math.max(60, Math.round(payload.height))
          this.resizeToast(payload.id, clampedWidth, clampedHeight)
        }
      }
    )
  }

  public showToast(type: ToastType, options?: { canSnooze?: boolean }): void {
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
      label = `Rest in ${REST_WARNING_SECONDS} seconds`
      text = 'Find a good stopping point. Revive will take over the screen soon.'
    }

    const toastData: ToastData = {
      id,
      type,
      label,
      text,
      durationMs: this.DURATION_MS
    }

    const isRestWarning = type === 'restWarning'
    const toastHeight = isRestWarning ? this.WARNING_HEIGHT : this.TOAST_HEIGHT

    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workArea

    let currentBottomOffset = this.MARGIN
    for (const existing of this.activeToasts) {
      const h = existing.height || (existing.data.type === 'restWarning' ? this.WARNING_HEIGHT : this.TOAST_HEIGHT)
      currentBottomOffset += h + this.GAP
    }
    currentBottomOffset += toastHeight

    const x = Math.round(workArea.x + workArea.width - this.TOAST_WIDTH - this.MARGIN)
    const y = Math.round(workArea.y + workArea.height - currentBottomOffset)

    const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

    const win = new BrowserWindow({
      x,
      y,
      width: this.TOAST_WIDTH,
      height: toastHeight,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: isRestWarning,
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

    if (isRestWarning) {
      win.setAlwaysOnTop(true, 'floating')
    } else {
      win.setAlwaysOnTop(true, 'screen-saver')
    }

    const canSnooze = options?.canSnooze ?? true
    const queryParams = new URLSearchParams({
      toast: type,
      toastId: id,
      label,
      text,
      duration: String(this.DURATION_MS),
      canSnooze: String(canSnooze)
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
      timer,
      width: this.TOAST_WIDTH,
      height: toastHeight
    }

    this.activeToasts.push(activeItem)

    win.on('closed', () => {
      this.activeToasts = this.activeToasts.filter((t) => t.id !== id)
      this.repositionToasts()
    })
  }

  public keepToastOpen(id: string): void {
    const item = this.activeToasts.find((t) => t.id === id)
    if (item && item.timer) {
      clearTimeout(item.timer)
      item.timer = null
    }
  }

  public resizeToast(id: string, width: number, height: number): void {
    const item = this.activeToasts.find((t) => t.id === id)
    if (!item || item.window.isDestroyed()) return
    item.width = width
    item.height = height
    this.repositionToasts()
  }

  public dismissToast(id: string): void {
    const item = this.activeToasts.find((t) => t.id === id)
    if (!item) return

    if (item.timer) {
      clearTimeout(item.timer)
      item.timer = null
    }

    if (!item.window.isDestroyed()) {
      item.window.close()
    }
  }

  public dismissRestWarnings(): void {
    const toDismiss = this.activeToasts.filter((t) => t.data.type === 'restWarning')
    for (const item of toDismiss) {
      this.dismissToast(item.id)
    }
  }

  public repositionToasts(): void {
    const primaryDisplay = screen.getPrimaryDisplay()
    const workArea = primaryDisplay.workArea

    let currentBottomOffset = this.MARGIN
    for (let i = 0; i < this.activeToasts.length; i++) {
      const item = this.activeToasts[i]
      const h = item.height || (item.data.type === 'restWarning' ? this.WARNING_HEIGHT : this.TOAST_HEIGHT)
      const w = item.width || this.TOAST_WIDTH
      currentBottomOffset += h
      if (!item.window.isDestroyed()) {
        const x = Math.round(workArea.x + workArea.width - w - this.MARGIN)
        const y = Math.round(workArea.y + workArea.height - currentBottomOffset)
        item.window.setBounds({ x, y, width: w, height: h })
      }
      currentBottomOffset += this.GAP
    }
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
