# Revive — Project Context & Scope Reference

## Architectural Summary
Revive is an offline-first Windows recovery desktop companion. It uses an authoritative main process state engine (`SessionEngine`), single-lock application lifetime, multi-display fullscreen overlay takeovers, and Web Audio synthesis.

## Scope History & Additions
- **Prompt 1**: Scaffold, Tailwind v4 tokens, splash window, hardware-timed boot tween.
- **Prompt 2**: Geometry, taskbar integration, frameless window controls.
- **Prompt 3**: Authoritative SessionEngine in main, state machine, focus/rest cycle.
- **Prompt 4**: Library CRUD, Activity data modeling, cascade deletions, migration logic.
- **Prompt 5**: Settings screen, tray lifecycle, close notice modal.
- **Prompt 6 (Current)**:
  - Fullscreen multi-display recovery overlay takeovers (`screen.getAllDisplays()`).
  - Primary interactive display vs non-interactive backdrop displays.
  - Immersive chrome-free Breathing player with animated orb, orbiting point, and 2px bottom hairline.
  - Single-clock authoritative audio schedule and procedural Web Audio engine (Soft tones & Singing bowl).
  - Video player, Custom player, Movement player with quiet top bar and "Resume focus" pill.
  - **Spotify Player (Deliberate Scope Change)**: Integrated embedded `<webview>` with partition `persist:spotify` for ambient playlists.
