# Revive — Windows Desktop Recovery Companion

Revive is an offline-first Windows desktop recovery companion engineered with a dark editorial aesthetic, JetBrains Mono typography, hairline borders, and ice-blue luminous accents.

---

## 📦 Features

- **Authoritative Main Session Engine**: Zero-drift epoch timing, full persistence in `electron-store`, power suspend/resume awareness.
- **Chrome-Free Recovery Takeover**: Immersive multi-display fullscreen overlay with breathing orb, video, Spotify, and custom activities.
- **Session Complete**: Primary overlay closing progress ring with drawn check, "Another one" (starts immediately) and "Done for now" (fades to tray) text actions with animated underlines.
- **Non-Stealing Desktop Toasts**: Frameless, transparent, always-on-top toasts (Eye break, Drink water, 60s Rest warning) with 8s draining progress bars that never steal typing focus.
- **Floating Mini Focus Window**: 184x208 compact draggable timer widget with progress ring, tabular countdown, and Skip / Open controls.
- **System Tray Integration**: Dynamic tooltip (`Revive · Focus · 24:31`), context menu (Show Revive, Show/Hide mini timer, Skip to rest, Quit), and close-to-tray behavior.
- **Multi-Monitor & Fullscreen Hardening**: Dynamic display connect/disconnect re-layout, `screen-saver` always-on-top level, single-instance mutex.
- **Windows Autostart**: Optional launch on startup via `app.setLoginItemSettings`.

---

## 🚀 Development & Testing

```bash
# Install dependencies
npm install

# Run dev server with hot reload
npm run dev

# Run TypeScript type check
npm run typecheck

# Run Vitest test suite
npm test

# Build production bundle
npm run build
```

---

## 🛠️ Producing the Installer

To build the standalone Windows NSIS installer (`.exe`):

```bash
npm run dist
```

This compiles the TypeScript code, bundles the Vite frontend and Electron main process, copies icons and media assets, and runs `electron-builder` to generate the per-user installer in the `dist/` directory.

### Code Signing Notice
The produced installer in `dist/` is unsigned for local development. To configure code signing for production distribution, configure the following environment variables or `electron-builder` options in `package.json`:
- `CSC_LINK` (path to `.pfx` code signing certificate)
- `CSC_KEY_PASSWORD` (certificate password)
- Alternatively, configure Azure Trusted Signing / Hardware Security Module (HSM) tools in the `win.sign` configuration.
