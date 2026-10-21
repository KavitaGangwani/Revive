# Revive — Design System & Visual Architecture

Revive is an offline-first Windows desktop recovery companion engineered with a dark editorial aesthetic, JetBrains Mono typography, hairline borders, and ice-blue luminous accents.

---

## 1. Design Philosophy & Aesthetic Core
- **No Generic Drop Shadows**: Never use generic fuzzy CSS drop shadows. Glow is reserved exclusively for luminous/active elements (the breathing light orb, active brand indicator dot, accent progress bars).
- **Hairline Borders**: Fine 1px hairline dividers and borders (`rgba(255, 255, 255, 0.08)` and `rgba(255, 255, 255, 0.12)`).
- **Monospace Discipline**: Pure JetBrains Mono typography with uppercase label treatments and wide letter spacing (`0.08em` - `0.18em`).
- **Dark Editorial Palette**:
  - `--bg`: `#000000` / `#020407` (Deep space base)
  - `--bg-deep`: `#020407` (Backdrop base for full-screen overlay takeovers)
  - `--accent`: `#AFDDFF` (Ice-blue luminous accent)
  - `--accent-hi`: `#DDF0FF` (Highlight state)
  - `--accent-wash`: `rgba(175, 221, 255, 0.08)` (Subtle surface tint)
  - `--accent-line`: `rgba(175, 221, 255, 0.28)` (Active hairline borders)
  - `--accent-edge`: `rgba(175, 221, 255, 0.45)` (Focus rings)
  - `--text`: `#FFFFFF`
  - `--muted`: `rgba(255, 255, 255, 0.50)`
  - `--faint`: `rgba(255, 255, 255, 0.28)`
  - `--hair`: `rgba(255, 255, 255, 0.08)`
  - `--hud-border`: `rgba(255, 255, 255, 0.12)`

---

## 2. Recovery Overlay Takeover & Multi-Display Architecture
When a rest period begins (`transition-to-rest` or `rest`):
1. **Multi-Display Execution**: The main process enumerates all active monitors using `screen.getAllDisplays()`.
   - If `settings.takeover.allDisplays` is `true`, a frameless fullscreen always-on-top window (`level: 'screen-saver'`) is spawned for every display.
   - If `false`, the takeover spawns exclusively on the primary monitor (`screen.getPrimaryDisplay()`).
2. **Primary Display (Interactive)**: Runs the active recovery activity player (`BreathingPlayer`, `VideoPlayer`, `SpotifyPlayer`, `CustomPlayer`, `MovementPlayer`).
3. **Secondary Displays (Non-Interactive Backdrop)**: Renders pure space canvas (`#020407`), 45% x 38% radial glow, and ~40 faint twinkling stars. Zero controls, zero sound, pure visual peace.
4. **Exit & Transition**: On rest completion or "Resume focus", overlays execute a 1.1s cubic-bezier exit (`cubic-bezier(0.76, 0, 0.24, 1)`), smoothly closing and restoring the main window.

---

## 3. Activity Players

### Breathing Player (Immersive, Chrome-Free)
- **Pre-roll**: Before the first breath starts, displays a dedicated "Get comfortable" screen with "Breathing begins in 5 4 3 2 1" (5 seconds, its own part of the transition-to-rest intro, not counted in rest time). Audio cue schedule starts immediately after pre-roll.
- **Visuals**:
  - Luminous light core (Orb) driven by Web Animations API or CSS transitions matching the exact phase seconds (Inhale grows from `0.6` to `1.0`, Hold stays stable, Exhale shrinks from `1.0` to `0.6`). No per-frame React state updates.
  - Thin SVG circular phase progress ring matching phase duration.
  - Monospace seconds counter inside orb (`Math.ceil((phaseEndsAt - now)/1000)`), updated only on integer change so React renders once per second.
  - Large phase word (`INHALE` / `HOLD` / `EXHALE`), `48px`, display font, centered below the orb, with clean typographic hierarchy.
  - 2px hairline rest progress bar at the bottom edge.
- **Timer Rule**:
  - Breathing is the one intentional exception that shows TWO numeric timers: the breath-seconds counter inside the orb (`4, 3, 2, 1`) AND the small overall rest countdown in the top bar (next to "Rest N of M" and the pulsating status dot).
  - Every other activity (Custom, Movement, Routine, Video, Spotify) shows ONLY the small overall rest countdown in the top bar. Nothing else shows a number.
- **Quiet Rest Experience**: Zero on-screen "Resume focus" buttons. The rest environment is pure, serene, and free from buttons that tempt early exit.
- **Timing**: Main process owns authoritative clock and generates `BreathingScheduleItem[]` with epoch timestamps (`startEpochMs`, `durationMs`). Renderer derives all phase and timer state from `Date.now()`.

### Video Player
- 16:9 embedded `<webview>` container with hairline border and subtle luminous top edge.
- Quiet top bar ("Rest N of M", status dot, countdown timer).
- Tag + Title beneath video.

### Spotify Player (*Scope Change*)
- Embedded `<webview>` pointing to Spotify playlist/album embed URL with persisted partition (`persist:spotify`).
- Cover and equaliser aesthetic.

### Custom & Movement Players
- Monospace user-defined activity title.
- Thin SVG circular ring countdown timer.
- Note beneath ("Leave the screen. Stretch your legs.").

---

## 4. Single-Clock Authoritative Audio Engine
- **Single Source of Truth**: Main process `SessionEngine` generates the full timestamped schedule (`BreathingScheduleItem[]`) at rest start.
- **Web Audio API**: Single `AudioContext` created in primary overlay. Audio buffers pre-decoded during `transition-to-rest`.
- **Zero Drift**: Audio cues scheduled with precise `audioCtx.currentTime` offsets computed from epoch delta (`startEpochMs - Date.now()`), avoiding `setTimeout` timer throttling and OS sleep drift.
- **Procedural Built-in Synthesis**:
  - *Soft tones*: Rising sine wave for Inhale (220Hz -> 380Hz), short gentle chime for Hold (523Hz), falling sine wave for Exhale (380Hz -> 220Hz).
  - *Singing bowl*: Harmonic rich resonant strikes at 320Hz (Inhale), 480Hz (Hold), and 240Hz (Exhale).
- **Tail Fade**: 300ms smooth fade-out if audio buffer exceeds phase duration.
