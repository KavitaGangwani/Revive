import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, SplashBridge } from '../shared/types'

const splashBridge: SplashBridge = {
  onProgress: (callback: (progress: number) => void): void => {
    const subscription = (_event: Electron.IpcRendererEvent, progress: number): void => {
      callback(progress)
    }
    ipcRenderer.on(IPC_CHANNELS.SPLASH_PROGRESS, subscription)
  },
  done: (): void => {
    ipcRenderer.send(IPC_CHANNELS.SPLASH_DONE)
  },
  minimize: (): void => {
    ipcRenderer.send(IPC_CHANNELS.SPLASH_MINIMIZE)
    ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE)
  },
  close: (): void => {
    ipcRenderer.send(IPC_CHANNELS.SPLASH_CLOSE)
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE)
  },
  onStartAnimation: (callback: () => void): (() => void) => {
    const sub = (): void => {
      callback()
    }
    ipcRenderer.on('splash:start-animation', sub)
    return (): void => {
      ipcRenderer.removeListener('splash:start-animation', sub)
    }
  }
}

contextBridge.exposeInMainWorld('splashBridge', splashBridge)
contextBridge.exposeInMainWorld('windowControls', {
  minimize: splashBridge.minimize,
  close: splashBridge.close
})
contextBridge.exposeInMainWorld('windowApi', {
  minimize: splashBridge.minimize,
  close: splashBridge.close,
  closeChoice: () => {},
  onCloseRequested: () => () => {}
})
