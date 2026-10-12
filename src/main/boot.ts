import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/types'

// Constants
const SPLASH_ANIM_MS = 1000
const SPLASH_HOLD_MS = 300
const MIN_VISIBLE_MS = SPLASH_ANIM_MS + SPLASH_HOLD_MS // 1300ms
const SPLASH_FADE_MS = 250

export interface BootContext {
  splashWindow: BrowserWindow;
  mainWindow: BrowserWindow;
}

export async function runBootSequence(appReadyAt: number = Date.now()): Promise<BootContext> {
  const isDev = !app.isPackaged && Boolean(process.env['ELECTRON_RENDERER_URL'])

  // 1. Create Splash Window (900x720 frameless, centered)
  const splashWindow = new BrowserWindow({
    title: 'Revive',
    width: 900,
    height: 720,
    center: true,
    frame: false,
    resizable: false,
    minimizable: true,
    skipTaskbar: false,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/splash.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // Register window control handlers for splash window
  ipcMain.on(IPC_CHANNELS.SPLASH_MINIMIZE, () => {
    if (!splashWindow.isDestroyed()) {
      splashWindow.minimize()
    }
  })

  ipcMain.on(IPC_CHANNELS.SPLASH_CLOSE, () => {
    if (!splashWindow.isDestroyed()) {
      splashWindow.close()
    }
    app.quit()
  })

  // 2. Create Main Window Shell with show: false
  const mainWindow = new BrowserWindow({
    title: 'Revive',
    width: 900,
    height: 720,
    minWidth: 860,
    minHeight: 640,
    backgroundColor: '#000000',
    frame: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // 3. Boot & Swap State
  let splashShownAt = 0
  let mainReady = false
  let swapped = false

  const trySwap = async (): Promise<void> => {
    if (process.env['SPLASH_PREVIEW'] === '1' || process.env['SPLASH_PREVIEW'] === 'true') {
      console.log('[boot] SPLASH_PREVIEW active: keeping splash window open for editing')
      return
    }
    if (swapped) return
    if (!mainReady || splashShownAt === 0) return
    const elapsed = Date.now() - splashShownAt
    if (elapsed < MIN_VISIBLE_MS) {
      setTimeout(trySwap, MIN_VISIBLE_MS - elapsed)
      return
    }

    swapped = true
    console.log(`[boot] swap: ${Date.now() - appReadyAt}ms`)

    // Swap = mainWindow.show() + focus()
    if (!mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
    }

    // Fade splash out over SPLASH_FADE_MS with setOpacity, then close it
    if (!splashWindow.isDestroyed()) {
      const steps = 10
      const stepDuration = SPLASH_FADE_MS / steps

      for (let i = 1; i <= steps; i++) {
        if (splashWindow.isDestroyed()) break
        const opacity = Math.max(0, 1 - i / steps)
        splashWindow.setOpacity(opacity)
        await new Promise((r) => setTimeout(r, stepDuration))
      }

      if (!splashWindow.isDestroyed()) {
        splashWindow.close()
      }
    }
  }

  // 4. Measure splash time from when the splash has actually painted (ready-to-show)
  const onSplashPainted = (): void => {
    if (splashShownAt > 0) return
    splashShownAt = Date.now()
    if (!splashWindow.isDestroyed()) {
      splashWindow.show()
    }
    console.log(`[boot] splash painted: ${splashShownAt - appReadyAt}ms`)
    setTimeout(trySwap, MIN_VISIBLE_MS)
  }

  splashWindow.once('ready-to-show', onSplashPainted)
  splashWindow.webContents.once('did-finish-load', () => {
    if (splashShownAt === 0) {
      onSplashPainted()
    }
  })

  // 5. Main window ready-to-show handler (sets mainReady and tries swap)
  mainWindow.once('ready-to-show', () => {
    mainReady = true
    console.log(`[boot] main ready: ${Date.now() - appReadyAt}ms`)
    trySwap()
  })

  // Load splash content
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/splash/index.html`)
  } else {
    splashWindow.loadFile(join(__dirname, '../renderer/splash/index.html'))
  }

  // Load main window content
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return { splashWindow, mainWindow }
}
