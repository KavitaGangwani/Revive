import {
  ReviveAPI,
  StillAPI,
  LibraryAPI,
  MainBridge,
  SplashBridge,
  SettingsAPI,
  WindowAPI,
  OverlayAPI
} from '../shared/types'

declare global {
  interface Window {
    revive?: ReviveAPI;
    still?: StillAPI;
    libraryApi?: LibraryAPI;
    settingsApi?: SettingsAPI;
    windowApi?: WindowAPI;
    overlayApi?: OverlayAPI;
    api?: MainBridge;
    splashBridge?: SplashBridge;
    windowControls?: {
      minimize: () => void;
      close: () => void;
    };
  }
}
