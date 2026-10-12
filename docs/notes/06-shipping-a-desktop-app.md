# 06 — Shipping a Desktop App: Session Complete, Toasts, Mini Window, System Tray & Hardening

---

## 1. What We Built

### Kid Version (Like I'm 10)
Imagine a busy restaurant with a quiet kitchen timer and friendly runners. When your table's dinner is done, the chef puts a gold checkmark on the board and asks if you want dessert or are ready to go home. While you work at your table, a polite waiter occasionally taps a small bell to whisper "Take a sip of water" or "Look out the window" without ever grabbing your fork or pencil from your hands. There's also a tiny pocket stopwatch you can drag to any corner of your desk to keep an eye on your time, and a quiet bell on the door that keeps things running even when the front door is closed. When you close your laptop to go to sleep, the kitchen remembers exactly what time it was and jumps to dessert if dinner cooked while you were asleep!

### CS Student Level
In Prompt 6, we productionized the desktop companion into an offline-first Windows desktop application. We implemented an authoritatively coordinated lifecycle spanning:
1. **Session Complete Screen**: Rendered exclusively on the primary display overlay when the final loop's rest ends, featuring a synchronized SVG progress ring with animated stroke checkmark, styled text actions ("Another one" to immediately restart focus with preserved configuration, and "Done for now" with 1.1s `expo-in-out` exit fade), and left-to-right underline draws.
2. **Non-Stealing Desktop Toasts**: Frameless, transparent, `alwaysOnTop: 'screen-saver'`, non-focusable BrowserWindow instances spawned via `showInactive()` anchored at the bottom-right `workArea` with 8-second linear drain progress bars, independent `Date.now()` diffing schedulers, rest-suppression, and 60-second rest warning triggers.
3. **Floating Draggable Mini Focus Window**: 184x208 frameless widget displaying a 112px progress ring, tabular numerals countdown, caps labels, and circular action buttons (`-webkit-app-region: drag` with `no-drag` interactive button exclusions), persisted position per display, and multi-display re-clamping.
4. **System Tray Lifecycle & Close-to-Tray**: Persistent tray icon with dynamic formatted tooltips (`Revive · Focus · 24:31`), context menu controls, and graceful window interception hiding to tray on close while reserving termination for explicit tray Quit.
5. **Multi-Monitor, Fullscreen & Power Hardening**: `screen.on('display-added' | 'display-removed' | 'display-metrics-changed')` dynamic re-anchoring, `powerMonitor.on('suspend' | 'resume')` timestamp reconciliation, and single-instance mutex locks (`app.requestSingleInstanceLock()`).
6. **Packaging & NSIS Distribution**: `electron-builder` configuration for per-user NSIS installation, `asarUnpack` media extraction, and 256px app/tray icon bundling.

---

## 2. Why This Order

1. **Shared Types & Store Configuration**: Extended `AppSettings`, `UserPrefs`, and IPC channel contracts first to provide end-to-end type safety for toasts, mini windows, and settings toggles.
2. **Authoritative Engine & Hardening**: Enhanced `SessionEngine` to emit rest warnings at 60s remaining, handle `anotherOne` immediate focus transitions, and reconcile sleep deltas on `handleSystemResume()`.
3. **Main Process Managers**: Built `ToastManager`, `NudgeScheduler`, and `MiniWindowManager` before the UI components so IPC endpoints and OS window flags were established.
4. **Renderer Views & Design System**: Created `SessionComplete.tsx`, `MiniFocusScreen.tsx`, and `ToastScreen.tsx` with precise CSS animations adhering strictly to `DESIGN.md`.
5. **Tray & Packaging Configuration**: Wired tray context menus, close-to-tray interception, icon generation, and `electron-builder` NSIS scripts.

---

## 3. Install and Command Log

| Package / Command | Purpose | Why Chosen Over Alternatives | What Breaks Without It |
|---|---|---|---|
| `electron-builder` | Builds Windows NSIS installer and unpacks ASAR media | Industry standard for Electron packaging with built-in auto-update and NSIS support | Cannot generate distributable `.exe` installers for Windows |
| `npm run typecheck` | Validates TypeScript across node and web compilation targets | Catches interface mismatches before packaging | Runtime crashes on IPC message deserialization |
| `npm test` | Runs Vitest unit tests for session engines, store, and tray | Ultra-fast ESM-native test runner | Regressions in timer diffing and phase transitions |
| `npm run dist` | Compiles frontend/backend and packages standalone NSIS installer | Single-command automated production pipeline | Manual asset copying and unsigned artifact creation |

---

## 4. Files Created or Changed

| File Path | Purpose | Architectural Layer |
|---|---|---|
| `src/shared/types.ts` | Extended types with `ToastData`, `MiniWindowAPI`, `ToastAPI`, and new IPC channels | Shared Contracts |
| `src/main/store.ts` | Added `restWarning`, `autostart`, and `miniFocusWindow` defaults and clamping | Main Process Persistence |
| `src/main/sessionEngine.ts` | Added 60s rest warning emission, `anotherOne` immediate restart, and power resume leap | Main Engine |
| `src/main/toastManager.ts` | Manages non-stealing, frameless, transparent toast windows stacked at bottom-right | Main Window Management |
| `src/main/nudgeScheduler.ts` | Independent `Date.now()` diffing timer for eye break and drink water nudges | Main Scheduler |
| `src/main/miniWindowManager.ts` | Manages floating 184x208 draggable timer widget with coordinate persistence | Main Window Management |
| `src/main/tray.ts` | System tray icon, status tooltip, and context menu | Main OS Integration |
| `src/main/index.ts` | Bootstraps all managers, single-instance lock, autostart, and multi-monitor listeners | Main Orchestrator |
| `src/preload/index.ts` | Securely exposes `miniWindowApi`, `toastApi`, and `showMainWindow` via `contextBridge` | Preload Bridge |
| `src/renderer/src/screens/OverlayScreen.tsx` | Routes between recovery players and `SessionComplete` on primary overlay | Renderer View |
| `src/renderer/src/components/SessionComplete.tsx` | Staggered entrance, animated checkmark ring, and underline hover action links | Renderer Component |
| `src/renderer/src/screens/MiniFocusScreen.tsx` | Draggable floating focus widget with SVG progress ring and countdown | Renderer View |
| `src/renderer/src/screens/ToastScreen.tsx` | Frameless toast with ringed icon, luminous top edge, and 8s draining bar | Renderer View |
| `src/renderer/src/components/FocusScreen.tsx` | Pure focus setup view without separate running screen | Renderer View |
| `src/renderer/src/components/SettingsScreen.tsx` | Added Rest warning toggle and Desktop (Autostart & Mini widget) settings | Renderer View |
| `src/renderer/styles/main.css` | Token-accurate styling for SessionComplete, Mini Window, and Toasts | Styling & Tokens |
| `package.json` | Configured `electron-builder`, NSIS target, `asarUnpack`, and build scripts | Packaging Metadata |

---

## 5. Architectural Flow & Communications

```mermaid
sequenceDiagram
    autonumber
    participant User as User
    participant Main as Main Process (SessionEngine)
    participant Nudge as NudgeScheduler
    participant Toast as ToastManager (BrowserWindow)
    participant Mini as MiniWindowManager (BrowserWindow)
    participant Overlay as OverlayManager (BrowserWindow)

    Note over Main: Focus Phase (e.g. 25:00)
    Main->>Mini: Broadcast Tick (25:00)
    Mini-->>User: Display Countdown inside 112px Ring

    Note over Main: 60 Seconds Remaining in Focus
    Main->>Toast: showToast('restWarning')
    Toast->>User: Display Non-Focus Stealing Toast (8s drain)

    Note over Main: Focus Ends -> Transition to Rest
    Main->>Mini: Hide Mini Window
    Main->>Overlay: Open Fullscreen Overlays (All Monitors)
    Overlay-->>User: Primary runs Activity Player; Secondaries run Space Backdrop

    Note over Nudge: Nudge interval elapses during Rest
    Nudge->>Nudge: Skip Nudge (Overlay is Active)

    Note over Main: Last Rest Ends -> Session Complete
    Main->>Overlay: Transition Primary Overlay to SessionComplete
    Overlay-->>User: Draw Checkmark Ring + "Nice work — that's one done."
    
    alt User clicks "Another one"
        User->>Overlay: Click "Another one"
        Overlay->>Main: session.anotherOne()
        Main->>Overlay: Close Overlays
        Main->>Main: Start Focus Immediately (Loop 0)
        Main->>Mini: Show Mini Window
    else User clicks "Done for now"
        User->>Overlay: Click "Done for now"
        Overlay->>Main: session.doneForNow()
        Main->>Overlay: 1.1s Exit Fade & Close
        Main->>Main: Set Phase to 'idle'
    end
```

---

## 6. Common Mistakes & How to Debug Them

1. **Toast Stealing Keystrokes While User Is Typing**:
   - *Mistake*: Calling `win.show()` on the toast window.
   - *Fix*: Call `win.showInactive()`, set `focusable: false`, and `skipTaskbar: true` in the BrowserWindow constructor.
2. **Buttons Not Clickable in Draggable Mini Window**:
   - *Mistake*: Setting `-webkit-app-region: drag` on the container without setting `-webkit-app-region: no-drag` on nested button controls.
   - *Fix*: Apply `style={{ WebkitAppRegion: 'no-drag' }}` to button elements and interactive icons.
3. **App Not Quitting on Tray Quit**:
   - *Mistake*: The `win.on('close')` handler unconditionally calls `event.preventDefault()` without checking an `isQuitting` boolean flag.
   - *Fix*: Set `isQuitting = true` inside the tray Quit handler before calling `app.quit()`.
4. **Toasts Appearing Behind the Windows Taskbar**:
   - *Mistake*: Positioning toasts using `screen.getPrimaryDisplay().bounds` instead of `.workArea`.
   - *Fix*: Use `display.workArea.x + display.workArea.width` and `display.workArea.y + display.workArea.height` to respect the taskbar height and docked side.

---

## 7. Interview Questions & Answers

1. **Q: Why does Revive use `Date.now()` diffing in the main process instead of `setInterval` decrement counters?**
   *A*: Chromium throttles `setInterval` in background tabs and hidden windows, and OS sleep halts JavaScript execution entirely. Calculating `remainingMs = phaseEndsAt - Date.now()` against authoritative epoch timestamps guarantees zero drift regardless of thread scheduling or system suspend states.

2. **Q: What is the purpose of `app.requestSingleInstanceLock()` and how does it function?**
   *A*: It creates an OS-level mutex. If a second instance is launched, the lock returns `false`, causing the second instance to immediately terminate while sending a `second-instance` event to the primary instance to restore and focus the main window.

3. **Q: Why must media files like `corner.mp4` and audio packs be specified in `asarUnpack`?**
   *A*: Electron ASAR archives are virtual read-only filesystems. Native video decoders and external system APIs cannot always read media streams directly from inside an ASAR package via filesystem path, so `asarUnpack` extracts them as physical files on disk.

4. **Q: How does `showInactive()` differ from `show()` in BrowserWindow?**
   *A*: `show()` activates the window and shifts OS keyboard and input focus to it. `showInactive()` makes the window visible on-screen without stealing focus from the currently active application, which is mandatory for background toasts.

5. **Q: What is the difference between `display.bounds` and `display.workArea` in Electron's `screen` API?**
   *A*: `display.bounds` represents the full physical pixel resolution of the monitor. `display.workArea` represents the usable desktop area excluding reserved system elements like the Windows taskbar and docked toolbars.

6. **Q: How are non-drag regions configured inside a `-webkit-app-region: drag` window?**
   *A*: By applying `-webkit-app-region: no-drag` to specific interactive child elements (like buttons, links, or inputs). This instructs Chromium's hit-testing layer to pass mouse events to the DOM rather than forwarding them to the OS window manager as drag gestures.

7. **Q: What happens when the operating system resumes from sleep during an active rest session?**
   *A*: `powerMonitor.on('resume')` triggers `sessionEngine.handleSystemResume()`. The engine checks `clock.now() >= phaseEndsAt`; if the rest duration has fully elapsed while asleep, it immediately advances to the next focus segment (or session complete) without forcing the user to wait out a stale rest timer.

8. **Q: Why do unsigned desktop installers trigger Windows SmartScreen warnings?**
   *A*: Windows Defender SmartScreen maintains a reputation score for executable files based on digital certificate verification. Unsigned binaries lack cryptographic proof of publisher identity, prompting Windows to display a defensive warning until the binary builds sufficient reputation.

---

## 8. Try It Yourself (Safe Experiments)

1. **Non-Stealing Toast Validation**: Open a text editor and start typing continuously. Trigger a toast; observe that typing is never interrupted and no keystrokes are lost.
2. **Display Metric Re-Clamping**: Drag the mini focus timer to the edge of the monitor, change your display resolution or orientation in Windows Settings, and observe the mini window smoothly re-clamping within the new workArea.
3. **Sleep/Wake Time Reconciliation**: Start a 5-minute session in dev speed mode, put the laptop to sleep for 30 seconds, wake it up, and verify that the remaining time accurately reflects the physical elapsed duration.

---

## 9. 5-Bullet Recap

- **Session Complete on Primary Overlay**: Shows an animated progress ring with drawn check, "Another one" (starts immediately), and "Done for now" (fades to tray) text actions.
- **Non-Stealing Desktop Toasts**: Three 8-second draining toast notifications (Eye break, Drink water, 60s Rest warning) that never steal input focus.
- **Floating Mini Focus Window**: 184x208 draggable timer widget with countdown and skip/open controls that remembers its screen position.
- **System Tray & Close-to-Tray**: Dynamic tray tooltip, context menu, and window close interception.
- **Hardened & Packaged**: Multi-monitor resilience, power suspend/resume recovery, NSIS per-user installer configuration, and 256px icons.
