/// <reference types="vite/client" />
import {
  ReviveAPI,
  MainBridge,
  LibraryAPI,
  SettingsAPI,
  WindowAPI,
  OverlayAPI,
  MiniWindowAPI,
  ToastAPI
} from '../../shared/types'

declare global {
  interface Window {
    api?: MainBridge;
    revive?: ReviveAPI;
    still?: ReviveAPI;
    libraryApi?: LibraryAPI;
    settingsApi?: SettingsAPI;
    windowApi?: WindowAPI;
    overlayApi?: OverlayAPI;
    miniWindowApi?: MiniWindowAPI;
    toastApi?: ToastAPI;
    windowControls?: {
      minimize: () => void;
      close: () => void;
      show?: () => void;
    };
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: any;
  }
}
