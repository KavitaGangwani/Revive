# Still — Learning Notes

## Prompt 6: shipping a desktop app

### 1. Main vs renderer process, and why the main process owns timing
- **What it is**: The main process is the Node.js backend managing OS windows and hardware, while renderer processes are Chromium web pages rendering the user interface.
- **Why Still needs it**: Still's session timing and break reminders must never stall or drift when the user minimizes the app, drags a window, or when Chromium throttles background browser tabs.
- **One gotcha**: Renderer timers like `setInterval` are heavily throttled by Chromium down to 1 tick per second (or paused completely) when windows are hidden or inactive.

### 2. contextBridge and IPC: why renderers never get raw ipcRenderer
- **What it is**: A secure bridge mechanism in preload scripts that selectively exposes controlled API functions to the renderer window while keeping Node.js internals isolated.
- **Why Still needs it**: Exposing raw `ipcRenderer` allows untrusted renderer code or embedded web content (like Spotify or YouTube webviews) to invoke arbitrary internal IPC messages and compromise OS security.
- **One gotcha**: Objects passed across `contextBridge` are deep-cloned and strip out prototype functions and symbol keys, requiring plain serializable data structures.

### 3. BrowserWindow flags: frameless, transparent, alwaysOnTop levels, focusable, showInactive
- **What it is**: Window configuration flags that remove native OS chrome (`frame: false`), allow see-through alpha channels (`transparent: true`), elevated layer priority (`level: 'screen-saver'`), and non-interactive display (`focusable: false`, `showInactive()`).
- **Why Still needs it**: Still uses these flags to create immersive fullscreen space overlays, floating mini timers, and unobtrusive toasts that never steal keyboard focus or interrupt active typing.
- **One gotcha**: Showing a window with `show()` automatically steals input focus on Windows; to show a toast without stealing typing focus, you must use `win.showInactive()`.

### 4. -webkit-app-region (draggable regions) and the no-drag exception for buttons
- **What it is**: A CSS property (`-webkit-app-region: drag`) that turns any HTML element into a native OS window drag handle, with `no-drag` carved out for clickable controls.
- **Why Still needs it**: The mini floating focus timer is frameless and needs to be freely draggable anywhere across the screen while keeping its Skip and Open buttons clickable.
- **One gotcha**: If interactive buttons inside a draggable region do not have `-webkit-app-region: no-drag`, mouse clicks and hover events will be swallowed by the OS window manager.

### 5. The screen API and display events; bounds vs workArea; scaleFactor
- **What it is**: Electron's hardware display management API for enumerating active monitors, detecting monitor plug/unplug events, and querying display geometry.
- **Why Still needs it**: Still monitors display changes to cover every screen during rest takeovers, clamp the floating mini timer within visible desktop boundaries, and position toasts above the taskbar.
- **One gotcha**: `display.bounds` includes the full resolution including the Windows taskbar, whereas `display.workArea` subtracts taskbars and docked toolbars; mixing them causes toasts to appear behind the taskbar.

### 6. powerMonitor and recomputing time from timestamps after sleep
- **What it is**: An OS event emitter that alerts Electron when the computer goes to sleep, suspends, resumes, locks, or unlocks.
- **Why Still needs it**: When a laptop lid closes during a focus or rest block, JavaScript execution halts; on wake, Still recomputes the elapsed epoch delta against persisted timestamps to jump straight to the correct phase.
- **One gotcha**: `setInterval` does not accumulate ticks while a computer is asleep, so relying on counter decrements leaves the timer frozen at the exact second sleep started.

### 7. Why Date.now() diffing beats setInterval counting
- **What it is**: Calculating remaining duration by subtracting the current system clock (`Date.now()`) from a fixed target timestamp (`phaseEndsAt`) instead of subtracting 1 on every timer tick.
- **Why Still needs it**: It guarantees absolute time accuracy with zero drift, regardless of CPU load spikes, event loop delays, or system suspend/wake cycles.
- **One gotcha**: Wall-clock time can jump if the user manually changes their system clock or time zone, which should be clamped or validated against negative deltas.

### 8. System tray and close-to-tray vs quit
- **What it is**: A background taskbar notification icon providing a persistent status tooltip and context menu while keeping the app alive when windows are hidden.
- **Why Still needs it**: Still is an ambient recovery companion that runs quietly in the background; closing the main window hides it to the tray, while clicking "Quit" in the tray menu truly terminates the process.
- **One gotcha**: Intercepting the `close` event with `event.preventDefault()` without checking if the app is actually quitting (`app.isQuitting`) will prevent the app and Windows from ever shutting down.

### 9. Single-instance lock
- **What it is**: An OS mutex mechanism (`app.requestSingleInstanceLock()`) ensuring only one instance of the desktop application runs at a time.
- **Why Still needs it**: Prevents duplicate session engines, conflicting audio cues, and multiple overlay windows when the user clicks the app icon multiple times.
- **One gotcha**: The second instance must call `app.quit()` immediately if the lock returns `false`, and the first instance must listen to `second-instance` to restore and focus its window.

### 10. Login items (autostart)
- **What it is**: Registering the application with the Windows Registry Run key via `app.setLoginItemSettings()` so it launches automatically on user login.
- **Why Still needs it**: Users want Still to start silently on boot and keep their work/recovery rhythm consistent every day without manual launches.
- **One gotcha**: In development mode, setting login items registers the Electron binary executable path rather than the production app shortcut unless guarded by `app.isPackaged`.

### 11. electron-builder, NSIS, and what asar is (and why asarUnpack exists)
- **What it is**: `electron-builder` packages Electron apps into a Windows NSIS installer; `asar` packs source files into a single read-only archive, and `asarUnpack` extracts binary assets onto disk.
- **Why Still needs it**: Still uses an NSIS per-user installer for clean, permission-free installation, and extracts media files (`corner.mp4`, audio files) so native decoders and webviews can read them by absolute path.
- **One gotcha**: Media files and native Node binaries inside an ASAR archive cannot always be loaded directly by external system decoders without extraction via `asarUnpack`.

### 12. Code signing and why unsigned installers trigger SmartScreen
- **What it is**: Cryptographically signing the executable with a verified digital certificate (EV or standard code signing certificate) recognized by Microsoft.
- **Why Still needs it**: Unsigned Windows installers trigger Microsoft Defender SmartScreen warnings ("Windows protected your PC") until reputation is built or a digital signature is applied.
- **One gotcha**: Without code signing, Windows considers any newly downloaded binary unknown and untrusted, requiring users to click "More info" -> "Run anyway".
