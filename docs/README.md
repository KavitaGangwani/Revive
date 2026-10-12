# Revive — Engineering & Learning Index

Revive is an offline-first Windows desktop recovery companion engineered with Electron, React, TypeScript, and Tailwind CSS v4.

---

## Architectural Notes Directory

| # | Note Title | Focus Areas | Key Deliverables |
|---|---|---|---|
| 01 | [Foundation, Splash & Boot Sequence](notes/01-foundation-splash-boot.md) | Electron Multi-Process, Preload Sandboxing, CSP, Single-Instance Lock, Hardware-Timed Splash Tweening, Tailwind v4 Design Tokens | Scaffold, frozen canvas splash integration, `electron-store` persistence, boot orchestration |
| 02 | [Window Geometry, Taskbar & Controls](notes/02-window-geometry-taskbar-controls.md) | Window Dimensions, Windows Taskbar Enumeration (`skipTaskbar`), Frameless Window Controls, Scaled SVG Cursive Rendering | Compact 720x480 splash & 860x580 shell, taskbar registration, minimize/close IPC controls |
| 03 | [Focus Screen & Authoritative Session Engine](notes/03-focus-screen-session-engine.md) | State Machines, Date.now() Diffing, Timer Throttling, Sleep/Wake PowerMonitor, IPC Broadcast, Relaunch Hydration | Authoritative SessionEngine in Main, token-accurate Focus & Rest UI, Vitest test suite |
| 04 | [Activities Screen, Library Data Modeling, CRUD & Validation](notes/04-activities-library-crud.md) | Data Modeling, CRUD Operations, JSON Schema Validation, Cascade Deletions, Dynamic Forms, IPC Event Broadcast | Authoritative library store, 4-type activity builder, live CycleBar visualizer, pick mode banner |
| 05 | [Recovery Overlay, Activity Players & Synchronized Audio](notes/05-recovery-overlay-activity-players-breathing-sounds.md) | Multi-Display Fullscreen Takeovers (`screen.getAllDisplays()`), Always-On-Top `screen-saver` Level, Hardware Web Audio Synthesis, Epoch Audio Sync, Activity Players (`Breathing`, `Video`, `Spotify`, `Custom`) | Fullscreen multi-monitor overlay management, zero-drift Web Audio engine, chrome-free breathing player with light core orb, and 1-time snooze limit |
| 06 | [Shipping a Desktop App: Session Complete, Toasts, Mini Window & Hardening](notes/06-shipping-a-desktop-app.md) | Session Complete screen, non-stealing always-on-top toasts, floating draggable mini window, system tray lifecycle, powerMonitor sleep reconciliation, multi-monitor display listeners, electron-builder NSIS packaging | Primary overlay completion ring with checkmark, 3 toast reminders, 184x208 mini focus timer, tray menu with close-to-tray, and NSIS installer packaging |

---

## Global References

- [Learning Rules & Documentation Standards](LEARNING_RULES.md)
- [System Glossary & OS Terminology](GLOSSARY.md)
