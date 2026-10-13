const fs = require('fs');
const path = require('path');

const splashHtmlPath = path.resolve(__dirname, '../src/renderer/splash/index.html');
const splashContent = fs.readFileSync(splashHtmlPath, 'utf8');

// Extract the exact SVG #mark element from the desktop app splash screen
const svgStart = splashContent.indexOf('<svg id="mark"');
const svgEnd = splashContent.indexOf('</svg>', svgStart) + 6;
if (svgStart === -1 || svgEnd === -1) {
  console.error('Could not find <svg id="mark"> in splash index.html');
  process.exit(1);
}
const svgMark = splashContent.substring(svgStart, svgEnd);

const html = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Revive — Sustained Focus Grounded in Recovery</title>
  <meta name="description" content="Download Revive for Windows and macOS. Desktop recovery app designed to protect cognitive stamina and sustain flow state through peaceful screen pauses, guided breathing, and custom active rest routines." />
  <meta name="theme-color" content="#020407" />

  <!-- OpenGraph -->
  <meta property="og:title" content="Revive — Sustained Focus Grounded in Recovery" />
  <meta property="og:description" content="Desktop recovery app for Windows & macOS." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="assets/revive-ui-screenshot.jpg" />

  <!-- Typography: Strict JetBrains Mono Matching the App -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" href="assets/icon.png" />

  <!-- Animation Libraries: GSAP & ScrollTrigger -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

  <style>
    /* ==========================================================================
       REVIVE DESIGN SYSTEM — PURE JETBRAINS MONO & CALM RECOVERY TOKENS
       ========================================================================== */
    :root {
      color-scheme: dark;
      --bg: #000000;
      --bg-deep: #020407;
      --bg-card: rgba(8, 12, 18, 0.88);
      --bg-card-hover: rgba(14, 22, 34, 0.96);

      --accent: #AFDDFF;
      --accent-hi: #DDF0FF;
      --accent-core: #F2FAFF;
      --accent-glow: rgba(175, 221, 255, 0.35);
      --accent-wash: rgba(175, 221, 255, 0.08);
      --accent-line: rgba(175, 221, 255, 0.28);

      --text: #FFFFFF;
      --muted: rgba(255, 255, 255, 0.62);
      --faint: rgba(255, 255, 255, 0.32);
      --hair: rgba(255, 255, 255, 0.08);
      --hud-border: rgba(255, 255, 255, 0.14);

      --font-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-mono);
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      letter-spacing: 0.04em;
    }

    body {
      overflow-x: hidden;
      min-height: 100vh;
      background: var(--bg);
      line-height: 1.6;
      font-size: 13px;
    }

    /* Keyboard focus accessibility */
    :focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* Fixed Sparse Starfield & Upward Drifting Light Motes */
    .ambience-layer {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }
    .stars {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .stars i {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: #fff;
      opacity: 0;
      animation: tw var(--d, 6s) ease-in-out var(--s, 0s) infinite;
    }
    @keyframes tw {
      0%, 100% { opacity: 0; }
      50% { opacity: var(--o, 0.65); }
    }
    .mote {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      opacity: 0;
      animation: mote-rise var(--m-dur, 24s) linear var(--m-delay, 0s) infinite;
    }
    @keyframes mote-rise {
      0% { transform: translateY(105vh) translateX(0); opacity: 0; }
      15% { opacity: var(--m-op, 0.5); }
      85% { opacity: var(--m-op, 0.5); }
      100% { transform: translateY(-10vh) translateX(var(--m-drift, 20px)); opacity: 0; }
    }

    /* HUD Corner Marks & Margin Plus Ticks */
    .hud-marker {
      position: absolute;
      pointer-events: none;
      color: var(--hud-border);
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 1;
      user-select: none;
      z-index: 2;
    }
    .hud-box {
      position: absolute;
      width: 38px;
      height: 38px;
      border: 1px solid var(--hair);
      pointer-events: none;
      z-index: 2;
    }
    .hud-box::before, .hud-box::after {
      content: "";
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--hud-border);
    }
    .hud-box::before { top: -1px; left: -1px; }
    .hud-box::after { bottom: -1px; right: -1px; }

    .container {
      width: 100%;
      max-width: 1060px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 10;
    }
    .text-center { text-align: center; }

    .caps {
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }

    .shimmer-text {
      color: var(--accent);
      text-shadow: 0 0 25px rgba(175, 221, 255, 0.45);
    }

    /* Word wrapping for motion typography */
    .word-wrap {
      display: inline-block;
      overflow: hidden;
      vertical-align: bottom;
      padding: 2px 0;
    }
    .word-inner {
      display: inline-block;
      will-change: transform, opacity;
      transform-origin: center bottom;
    }

    /* ==========================================================================
       TOP NAVIGATION
       ========================================================================== */
    .nav-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: rgba(2, 4, 7, 0.90);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--hair);
      z-index: 900;
      display: flex;
      align-items: center;
    }
    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #fff;
    }
    .brand-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }
    .brand-name {
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .nav-center-links {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .nav-link {
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.2s ease;
      cursor: pointer;
    }
    .nav-link:hover { color: var(--accent); }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .nav-btn {
      font-family: var(--font-mono);
      font-size: 10.5px;
      letter-spacing: 0.08em;
      padding: 6px 13px;
      border-radius: 999px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      border: 1px solid rgba(175, 221, 255, 0.25);
      background: rgba(175, 221, 255, 0.06);
      color: var(--accent);
      transition: all 0.2s ease;
    }
    .nav-btn:hover {
      background: var(--accent);
      color: #000;
      box-shadow: 0 0 14px rgba(175, 221, 255, 0.45);
    }

    /* ==========================================================================
       HERO SECTION
       ========================================================================== */
    .hero-section {
      position: relative;
      padding-top: 140px;
      padding-bottom: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: radial-gradient(ellipse 65% 50% at 50% 26%, rgba(40, 95, 160, 0.22), transparent 75%);
      overflow: hidden;
    }
    .hero-ambient-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.12;
      mix-blend-mode: screen;
      pointer-events: none;
      mask-image: radial-gradient(ellipse 65% 50% at 50% 40%, black 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 65% 50% at 50% 40%, black 30%, transparent 75%);
    }
    .hero-content {
      max-width: 720px;
      margin: 0 auto;
      position: relative;
      z-index: 5;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      border-radius: 999px;
      background: rgba(175, 221, 255, 0.05);
      border: 1px solid rgba(175, 221, 255, 0.2);
      color: var(--accent);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .hero-title {
      font-size: clamp(28px, 4vw, 46px);
      font-weight: 500;
      letter-spacing: -0.01em;
      line-height: 1.25;
      margin-bottom: 20px;
      color: #fff;
    }
    .hero-desc {
      font-size: 13.5px;
      line-height: 1.7;
      color: var(--muted);
      max-width: 580px;
      margin: 0 auto 34px;
      letter-spacing: 0.03em;
    }
    .download-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .dl-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 13px 26px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      cursor: pointer;
      border: 0;
      transition: all 0.25s var(--ease);
    }
    .dl-btn.primary {
      background: var(--accent);
      color: #000;
      box-shadow: 0 0 25px rgba(175, 221, 255, 0.35);
    }
    .dl-btn.primary:hover {
      background: var(--accent-hi);
      transform: translateY(-2px);
      box-shadow: 0 0 40px rgba(175, 221, 255, 0.6);
    }
    .dl-btn.secondary {
      background: rgba(255, 255, 255, 0.03);
      color: #fff;
      border: 1px solid var(--hud-border);
    }
    .dl-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--accent);
      color: var(--accent);
      transform: translateY(-2px);
    }
    .dl-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

    .hero-specs {
      font-size: 10.5px;
      color: var(--faint);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      letter-spacing: 0.06em;
    }

    /* Section Headings Common */
    .sec-tag {
      font-size: 10.5px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 12px;
      display: inline-block;
    }
    .sec-title {
      font-size: clamp(24px, 3.4vw, 36px);
      font-weight: 500;
      letter-spacing: 0.01em;
      color: #fff;
      margin-bottom: 12px;
    }
    .sec-desc {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.6;
      max-width: 580px;
      margin: 0 auto;
    }

    /* ==========================================================================
       SECTION 1 (NEW): WHY REVIVE (id="why")
       ========================================================================== */
    .why-section {
      padding: 90px 0 80px;
      position: relative;
      border-top: 1px solid var(--hair);
    }
    .why-strips {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 38px;
    }
    .why-strip-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .why-strip {
      height: 112px;
      border-radius: 16px;
      border: 1px solid var(--hud-border);
      background: var(--bg-deep);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px 14px 12px;
    }
    .why-strip.revive-takeover {
      border-color: var(--accent-line);
      box-shadow: 0 0 25px rgba(175, 221, 255, 0.06);
    }
    .strip-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      z-index: 5;
    }
    .strip-dots {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .strip-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
    }
    .strip-labels {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-mono: var(--font-mono);
    }
    .strip-tag-muted { color: var(--muted); }
    .strip-tag-accent { color: var(--accent); }
    .strip-timer-tag {
      font-size: 10px;
      letter-spacing: 0.08em;
      color: var(--faint);
      font-mono: var(--font-mono);
    }

    /* Work lines pulsing in 6s loop */
    .strip-work-lines {
      display: flex;
      flex-direction: column;
      gap: 7px;
      width: 100%;
      margin-top: 6px;
      z-index: 2;
    }
    .strip-work-line {
      height: 6px;
      background: rgba(255, 255, 255, 0.26);
      border-radius: 3px;
      animation: work-pulse 6s ease-in-out infinite;
    }
    .strip-work-line.l1 { width: 88%; --w: 88%; animation-delay: 0s; }
    .strip-work-line.l2 { width: 72%; --w: 72%; animation-delay: 0.5s; }
    .strip-work-line.l3 { width: 56%; --w: 56%; animation-delay: 1s; }
    @keyframes work-pulse {
      0%, 100% { width: var(--w, 80%); }
      50% { width: calc(var(--w, 80%) * 0.82); }
    }

    /* Left strip: Toast sliding in & out */
    .strip-toast {
      position: absolute;
      top: 10px;
      right: 12px;
      background: rgba(14, 22, 34, 0.96);
      border: 1px solid var(--hud-border);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9.5px;
      color: #fff;
      z-index: 10;
      animation: toast-slide 6s ease-in-out infinite;
    }
    .strip-toast-dismiss {
      color: var(--accent);
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.08em;
      cursor: pointer;
    }
    @keyframes toast-slide {
      0%, 15% { transform: translateX(130%); opacity: 0; }
      25%, 65% { transform: translateX(0); opacity: 1; }
      75%, 100% { transform: translateX(130%); opacity: 0; }
    }

    /* Right strip: 12s takeover loop */
    .strip-overlay {
      position: absolute;
      inset: 0;
      background: rgba(2, 4, 7, 0.95);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 8;
      animation: takeover-cycle 12s ease-in-out infinite;
    }
    .strip-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.55;
      mix-blend-mode: screen;
      pointer-events: none;
    }
    .strip-ring {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 1.5px solid var(--accent);
      box-shadow: 0 0 12px var(--accent-wash);
      display: grid;
      place-items: center;
      animation: ring-scale 6s ease-in-out infinite;
      position: relative;
      z-index: 2;
    }
    .strip-breath-text {
      font-size: 9.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
      margin-top: 4px;
      font-weight: 500;
      animation: breath-text 6s ease-in-out infinite;
      position: relative;
      z-index: 2;
    }
    .strip-rest-label {
      position: absolute;
      top: 10px;
      right: 14px;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      z-index: 3;
    }
    @keyframes takeover-cycle {
      0%, 24% { opacity: 0; pointer-events: none; }
      28%, 84% { opacity: 1; pointer-events: auto; }
      88%, 100% { opacity: 0; pointer-events: none; }
    }
    @keyframes ring-scale {
      0%, 100% { transform: scale(0.7); }
      50% { transform: scale(1.15); }
    }
    @keyframes breath-text {
      0%, 46% { opacity: 1; content: "Breathe in"; }
      48%, 52% { opacity: 0; }
      54%, 100% { opacity: 1; content: "Breathe out"; }
    }

    .strip-caption {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.4;
      padding-left: 2px;
    }

    /* ==========================================================================
       SECTION 2: REVIVE IN ACTION (id="preview-section") — UPGRADED LAYOUT
       ========================================================================== */
    .preview-section {
      padding: 90px 0;
      position: relative;
      border-top: 1px solid var(--hair);
    }

    /* Centered Segmented Pill Tab Bar */
    .preview-tab-pill-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 32px auto 0;
    }
    .preview-tab-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hair);
      border-radius: 999px;
      padding: 4px;
      gap: 4px;
    }
    .preview-pill-btn {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 18px;
      border-radius: 999px;
      border: 1px solid transparent;
      color: var(--muted);
      background: none;
      cursor: pointer;
      transition: all 0.2s var(--ease);
      white-space: nowrap;
    }
    .preview-pill-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.04); }
    .preview-pill-btn.active {
      color: var(--accent);
      background: var(--accent-wash);
      border-color: var(--accent-line);
      box-shadow: 0 0 12px rgba(175, 221, 255, 0.15);
    }

    /* Stage Container */
    .preview-frame {
      width: 100%;
      max-width: 840px;
      margin: 28px auto 0;
      border-radius: 18px;
      border: 1px solid var(--hud-border);
      background: var(--bg-deep);
      overflow: hidden;
      position: relative;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(40, 95, 160, 0.15);
    }
    .preview-frame::before {
      content: "";
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(175, 221, 255, 0.5), transparent);
    }
    .preview-stage {
      padding: 40px 24px;
      min-height: 420px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(40, 95, 160, 0.14), transparent 75%), var(--bg-deep);
    }
    .tab-view { display: none; width: 100%; }
    .tab-view.active { display: block; }

    /* Tab 1: Breathing View */
    .breath-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 520px;
      margin: 0 auto;
    }
    .breath-live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      letter-spacing: 0.16em;
      color: var(--accent);
      border: 1px solid var(--accent-line);
      background: var(--accent-wash);
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 10px;
    }
    .breath-ring-stage {
      position: relative;
      width: 176px;
      height: 176px;
      margin: 18px 0 16px;
      display: grid;
      place-items: center;
    }
    .breath-svg {
      position: absolute;
      inset: 0;
      width: 176px;
      height: 176px;
      transform: rotate(-90deg);
      pointer-events: none;
    }
    .breath-svg-track {
      stroke: rgba(255, 255, 255, 0.06);
    }
    .breath-svg-progress {
      stroke: var(--accent);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.25s linear;
      filter: drop-shadow(0 0 6px var(--accent));
    }
    .breath-inner-circle {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--accent-core) 0%, var(--accent) 32%, rgba(175, 221, 255, 0.18) 70%, transparent 80%);
      box-shadow: 0 0 28px rgba(175, 221, 255, 0.45);
      display: grid;
      place-items: center;
      transform: scale(1);
      transition: transform 0.8s var(--ease);
      cursor: pointer;
    }
    .breath-sec-num {
      font-size: 32px;
      font-weight: 500;
      color: #000;
      line-height: 1;
    }
    .breath-phase-word {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 6px;
    }
    .breath-hint-line {
      font-size: 12px;
      color: var(--muted);
      min-height: 18px;
      margin-bottom: 14px;
    }
    .breath-phase-dots {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 22px;
    }
    .phase-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      transition: all 0.3s;
    }
    .phase-dot.active {
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      transform: scale(1.3);
    }
    .breath-chips {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pattern-chip {
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid var(--hud-border);
      background: rgba(255, 255, 255, 0.02);
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .pattern-chip:hover { color: #fff; border-color: rgba(255, 255, 255, 0.3); }
    .pattern-chip.active {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-wash);
    }

    /* Tab 2: Focus Setup View */
    .focus-setup-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 540px;
      margin: 0 auto;
      text-align: center;
    }
    .stepper-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      width: 100%;
      margin-bottom: 24px;
    }
    .stepper-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--hair);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stepper-box {
      display: flex;
      border: 1px solid var(--hud-border);
      border-radius: 12px;
      overflow: hidden;
      width: 140px;
      height: 68px;
      margin: 10px 0;
      background: rgba(255, 255, 255, 0.02);
    }
    .stepper-num {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .stepper-num b {
      font-size: 28px;
      color: var(--accent);
      line-height: 1;
      text-shadow: 0 0 12px rgba(175, 221, 255, 0.45);
    }
    .stepper-num span {
      font-size: 9px;
      color: var(--muted);
      text-transform: uppercase;
      margin-top: 3px;
    }
    .stepper-controls {
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--hud-border);
      width: 32px;
    }
    .stepper-btn {
      flex: 1;
      background: none;
      border: 0;
      color: var(--muted);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.15s;
    }
    .stepper-btn + .stepper-btn { border-top: 1px solid var(--hud-border); }
    .stepper-btn:hover { background: rgba(175, 221, 255, 0.1); color: var(--accent); }

    /* Cycle Bar */
    .cycle-bar-wrap {
      width: 100%;
      margin-bottom: 10px;
    }
    .cycle-bar {
      height: 8px;
      width: 100%;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--hair);
    }
    .cycle-seg-focus {
      background: rgba(255, 255, 255, 0.22);
      height: 100%;
      transition: flex-grow 0.3s var(--ease);
    }
    .cycle-seg-rest {
      background: var(--accent);
      height: 100%;
      box-shadow: 0 0 8px var(--accent);
      transition: flex-grow 0.3s var(--ease);
    }
    .cycle-key {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-size: 10.5px;
      color: var(--muted);
      margin-top: 8px;
    }
    .cycle-key-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .cycle-key-box {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
    .plan-summary-line {
      font-size: 11.5px;
      color: var(--accent);
      margin-top: 16px;
    }

    /* Tab 3: Custom Activities View */
    .custom-act-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 540px;
      margin: 0 auto;
      width: 100%;
    }
    .custom-type-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .custom-type-chip {
      font-family: var(--font-mono);
      font-size: 10.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid var(--hud-border);
      background: rgba(255, 255, 255, 0.02);
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .custom-type-chip.active, .custom-type-chip:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-wash);
    }
    .custom-input-row {
      display: flex;
      gap: 8px;
      width: 100%;
      margin-bottom: 14px;
    }
    .custom-input-text {
      flex: 1;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hud-border);
      border-radius: 999px;
      padding: 9px 16px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: #fff;
      outline: none;
    }
    .custom-input-text:focus { border-color: var(--accent); }
    .custom-input-mins {
      width: 75px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hud-border);
      border-radius: 999px;
      padding: 9px 12px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: #fff;
      text-align: center;
      outline: none;
    }
    .custom-add-btn {
      padding: 9px 18px;
      border-radius: 999px;
      background: var(--accent);
      color: #000;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 0;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .custom-add-btn:hover { background: var(--accent-hi); }
    .custom-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
      width: 100%;
      margin-top: 6px;
      max-height: 140px;
      overflow-y: auto;
    }
    .custom-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      border: 1px solid var(--hair);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      font-size: 11.5px;
      transition: opacity 0.3s;
    }
    .custom-item-empty {
      padding: 12px;
      border: 1px dashed var(--hud-border);
      border-radius: 10px;
      color: var(--muted);
      font-size: 11px;
      text-align: center;
    }
    .custom-del-btn {
      background: none;
      border: 0;
      color: var(--muted);
      cursor: pointer;
      font-size: 13px;
      padding: 0 4px;
      transition: color 0.2s;
    }
    .custom-del-btn:hover { color: #fff; }
    .routine-total-line {
      font-size: 11px;
      color: var(--accent);
      margin-top: 14px;
    }

    /* ==========================================================================
       SECTION 3: SCIENCE OF FLOW STATE (id="workflow") & ROUND TIMELINE
       ========================================================================== */
    .sec-wrap {
      padding: 90px 0;
      position: relative;
      border-top: 1px solid var(--hair);
    }
    .timeline-wrap {
      max-width: 620px;
      margin: 0 auto 40px;
      width: 100%;
    }
    .timeline-segments {
      display: flex;
      gap: 8px;
      width: 100%;
      margin-bottom: 10px;
    }
    .timeline-pill {
      font-size: 10.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--hud-border);
      background: rgba(255, 255, 255, 0.02);
      color: var(--muted);
      text-align: center;
      font-mono: var(--font-mono);
    }
    .timeline-pill.focus {
      flex: 25;
    }
    .timeline-pill.rest {
      flex: 5;
      border-color: var(--accent-line);
      color: var(--accent);
      background: var(--accent-wash);
    }
    .timeline-track {
      width: 100%;
      height: 2px;
      background: rgba(255, 255, 255, 0.08);
      position: relative;
      border-radius: 2px;
      overflow: visible;
    }
    .timeline-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
      animation: timeline-fill 14s linear infinite;
      position: relative;
      box-shadow: 0 0 8px var(--accent);
    }
    .timeline-dot {
      position: absolute;
      right: -3px;
      top: -3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 8px var(--accent), 0 0 14px var(--accent);
    }
    @keyframes timeline-fill {
      0% { width: 0%; }
      100% { width: 100%; }
    }

    .flow-cycle-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .flow-card {
      background: var(--bg-card);
      border: 1px solid var(--hair);
      border-radius: 14px;
      padding: 22px 18px;
      transition: all 0.3s var(--ease);
      position: relative;
      cursor: pointer;
    }
    .flow-card:hover {
      border-color: rgba(175, 221, 255, 0.45);
      background: var(--bg-card-hover);
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(175, 221, 255, 0.15);
    }
    .flow-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(175, 221, 255, 0.06);
      border: 1px solid rgba(175, 221, 255, 0.22);
      display: grid;
      place-items: center;
      margin-bottom: 14px;
      color: var(--accent);
      transition: all 0.3s;
    }
    .flow-card:hover .flow-icon-box {
      background: rgba(175, 221, 255, 0.12);
      border-color: var(--accent);
      box-shadow: 0 0 16px rgba(175, 221, 255, 0.35);
    }
    .flow-icon-box svg {
      width: 22px;
      height: 22px;
      overflow: visible;
    }
    .flow-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .flow-num {
      font-size: 15px;
      font-weight: 500;
      color: var(--accent);
    }
    .flow-time-badge {
      font-size: 9.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      font-mono: var(--font-mono);
    }
    .flow-card-title {
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 6px;
    }
    .flow-card-desc {
      font-size: 11.5px;
      color: var(--muted);
      line-height: 1.5;
    }

    /* ==========================================================================
       SECTION 4 (NEW): WHAT REST LOOKS LIKE (id="rest")
       ========================================================================== */
    .rest-section {
      padding: 90px 0;
      position: relative;
      border-top: 1px solid var(--hair);
    }
    .rest-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 38px 0 28px;
    }
    .rest-card {
      background: var(--bg-card);
      border: 1px solid var(--hair);
      border-radius: 20px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.3s var(--ease);
      position: relative;
    }
    .rest-card:hover {
      border-color: rgba(175, 221, 255, 0.45);
      background: var(--bg-card-hover);
      transform: translateY(-3px);
    }
    .rest-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(175, 221, 255, 0.06);
      border: 1px solid rgba(175, 221, 255, 0.25);
      display: grid;
      place-items: center;
      margin-bottom: 16px;
      color: var(--accent);
      box-shadow: 0 0 14px rgba(175, 221, 255, 0.2);
    }
    .rest-icon-box svg {
      width: 20px;
      height: 20px;
    }
    .rest-card-title {
      font-size: 16px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 8px;
    }
    .rest-card-desc {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.55;
      margin-bottom: 20px;
    }
    .rest-card-tag {
      display: inline-block;
      align-self: flex-start;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--hud-border);
      color: var(--accent);
      font-size: 9.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(175, 221, 255, 0.04);
    }
    .rest-toasts-strip {
      border: 1px dashed var(--hud-border);
      border-radius: 14px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: rgba(255, 255, 255, 0.015);
    }
    .rest-toast-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      color: var(--muted);
    }
    .rest-toast-item::before {
      content: "";
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
    }
    .rest-toast-note {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--faint);
    }

    /* ==========================================================================
       SECTION 5 (NEW): CLOSING CTA DIRECTLY ABOVE FOOTER
       ========================================================================== */
    .closing-cta-section {
      padding: 90px 0;
      position: relative;
      border-top: 1px solid var(--hair);
      text-align: center;
    }
    .closing-cta-content {
      max-width: 660px;
      margin: 0 auto;
    }

    /* ==========================================================================
       SECTION 6: COMPACT SPLASH SCREEN FOOTER (KEEP EXACT & UNTOUCHED)
       ========================================================================== */
    .splash-footer-wrap {
      position: relative;
      width: 100%;
      height: 360px;
      overflow: hidden;
      border-top: none;
      background: radial-gradient(ellipse 45% 38% at 50% 50%, rgba(40, 95, 160, 0.22), transparent 70%);
      cursor: pointer;
    }
    .splash-footer-wrap .jf {
      position: absolute;
      width: min(30vw, 175px);
      height: min(30vw, 175px);
      pointer-events: none;
      z-index: 8;
      overflow: hidden;
      mix-blend-mode: screen;
      opacity: 0.92;
    }
    .splash-footer-wrap .jf.tr { top: 4px; right: -20px; }
    .splash-footer-wrap .jf.bl { bottom: 4px; left: -20px; }
    .splash-footer-wrap .jf video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .splash-footer-wrap .center {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 50;
    }
    .splash-footer-wrap .center svg {
      width: min(52vw, 360px);
      height: auto;
      max-height: 220px;
    }
    .splash-replay-hint {
      position: absolute;
      bottom: 14px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9.5px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--faint);
      pointer-events: none;
      z-index: 60;
    }

    .site-subfooter {
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      border-top: 1px solid var(--hair);
      padding: 18px 0;
    }
    .site-subfooter-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }

    /* ==========================================================================
       DOWNLOAD MODAL (Windows & macOS)
       ========================================================================== */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.84);
      backdrop-filter: blur(12px);
      z-index: 2000;
      display: none;
      place-items: center;
      padding: 20px;
    }
    .modal-backdrop.open { display: grid; }
    .dl-modal {
      background: #020407;
      border: 1px solid var(--hud-border);
      border-radius: 18px;
      width: 100%;
      max-width: 480px;
      padding: 28px;
      position: relative;
      box-shadow: 0 20px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(40, 95, 160, 0.25);
    }
    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: 1px solid var(--hair);
      color: var(--muted);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.2s;
    }
    .modal-close:hover { color: #fff; border-color: var(--accent); }
    .modal-os-tabs {
      display: flex;
      gap: 8px;
      margin: 14px 0 18px;
    }
    .modal-tab-btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--hud-border);
      background: rgba(255, 255, 255, 0.02);
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .modal-tab-btn.active {
      background: rgba(175, 221, 255, 0.08);
      border-color: rgba(175, 221, 255, 0.35);
      color: var(--accent);
    }
    .modal-tab-content { display: none; }
    .modal-tab-content.active { display: block; }
    .modal-step {
      display: flex;
      gap: 10px;
      margin-bottom: 11px;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
    }
    .modal-step-num {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(175, 221, 255, 0.1);
      border: 1px solid var(--accent);
      color: var(--accent);
      font-size: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Toast Notification */
    .toast-notice {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(8, 14, 22, 0.95);
      border: 1px solid rgba(175, 221, 255, 0.4);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(175, 221, 255, 0.25);
      border-radius: 12px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 3000;
      transform: translateY(120%);
      transition: transform 0.35s var(--ease);
    }
    .toast-notice.show { transform: translateY(0); }

    /* ==========================================================================
       RESPONSIVE RULES (DOWN TO 400PX WITH ZERO OVERFLOW)
       ========================================================================== */
    @media (max-width: 820px) {
      .hud-marker, .hud-box { display: none; }
      .nav-center-links { display: none; }
      .why-strips { grid-template-columns: 1fr; }
      .flow-cycle-grid { grid-template-columns: 1fr 1fr; }
      .rest-cards-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 580px) {
      .container { padding: 0 16px; }
      .stepper-grid { grid-template-columns: 1fr; }
      .preview-pill-btn { font-size: 9.5px; padding: 6px 10px; }
      .download-row { flex-direction: column; width: 100%; }
      .dl-btn { width: 100%; justify-content: center; }
      .timeline-segments { flex-direction: column; }
    }
    @media (max-width: 480px) {
      .rest-cards-grid { grid-template-columns: 1fr; }
      .flow-cycle-grid { grid-template-columns: 1fr; }
      .why-strip { height: 120px; }
    }

    /* Respect Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .timeline-fill { width: 100% !important; animation: none !important; }
      .ambience-layer { display: none !important; }
      .strip-overlay { opacity: 1 !important; animation: none !important; }
      .strip-ring { transform: scale(1) !important; animation: none !important; }
      .strip-toast { transform: translateX(0) !important; opacity: 1 !important; animation: none !important; }
    }
  </style>
</head>
<body>

  <!-- Ambient Sparse Starfield & Motes Layer (Fixed Across Complete Page) -->
  <div class="ambience-layer" id="ambience-layer">
    <div class="stars" id="stars"></div>
    <div id="motes"></div>
  </div>

  <!-- Ambient HUD Margins & Corners -->
  <div class="hud-box" style="top: 80px; left: 30px;"></div>
  <div class="hud-box" style="top: 80px; right: 30px;"></div>
  <div class="hud-marker" style="top: 140px; left: 34px;">+</div>
  <div class="hud-marker" style="top: 140px; right: 34px;">+</div>
  <div class="hud-marker" style="top: 50%; left: 24px;">+</div>
  <div class="hud-marker" style="top: 50%; right: 24px;">+</div>

  <!-- ========================================================================
       TOP NAVIGATION
       ======================================================================== -->
  <header class="nav-bar">
    <div class="container nav-container">
      <a href="#hero" class="nav-brand">
        <span class="brand-indicator"></span>
        <span class="brand-name">Revive</span>
      </a>

      <!-- 4-Link Center Nav with "Why Revive" -->
      <div class="nav-center-links">
        <a href="#why" class="nav-link">Why Revive</a>
        <a href="#preview-section" class="nav-link">Revive in Action</a>
        <a href="#workflow" class="nav-link">Workflow</a>
        <a href="#rest" class="nav-link">Rest</a>
      </div>

      <div class="nav-actions">
        <button type="button" class="nav-btn" onclick="openDownloadModal('win')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/></svg>
          Windows
        </button>
        <button type="button" class="nav-btn" onclick="openDownloadModal('mac')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.73-.85.03-1.89.57-2.5 1.28-.54.63-.99 1.65-.87 2.64.95.07 1.91-.47 2.49-1.19z"/></svg>
          macOS
        </button>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       HERO SECTION
       ======================================================================== -->
  <section class="hero-section" id="hero">
    <!-- Ambient video backdrop if file present -->
    <video class="hero-ambient-video" muted loop playsinline autoplay preload="auto" src="assets/ambient-drift.mp4" onerror="this.remove()"></video>

    <div class="container hero-content">
      <div class="hero-badge" id="hero-badge">
        <span class="brand-indicator"></span>
        <span>Flow State Recovery · Windows & macOS</span>
      </div>

      <h1 class="hero-title" id="hero-title">
        Sustained focus.<br />
        <span class="shimmer-text">Grounded in recovery.</span>
      </h1>

      <p class="hero-desc" id="hero-desc">
        Revive protects your cognitive stamina. When your focus interval finishes, your screen gently shifts into a peaceful, distraction-free atmosphere for active rest, guided breathing, and physical renewal.
      </p>

      <div class="download-row" id="hero-cta">
        <button type="button" class="dl-btn primary" onclick="openDownloadModal('win')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
          </svg>
          Download for Windows (.exe)
        </button>

        <button type="button" class="dl-btn secondary" onclick="openDownloadModal('mac')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.73-.85.03-1.89.57-2.5 1.28-.54.63-.99 1.65-.87 2.64.95.07 1.91-.47 2.49-1.19z"/>
          </svg>
          Download for macOS (.dmg)
        </button>
      </div>

      <div class="hero-specs" id="hero-specs">
        <span>Windows 10 / 11 (64-bit)</span>
        <span style="opacity:0.3;">·</span>
        <span>macOS 12+ (Universal)</span>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 1 (NEW): WHY REVIVE (id="why")
       ======================================================================== -->
  <section class="why-section" id="why">
    <div class="container text-center">
      <span class="sec-tag">Why it exists</span>
      <h2 class="sec-title split-text-anim">
        You already know you should take breaks. <span class="shimmer-text">You just don't.</span>
      </h2>
      <p class="sec-desc">
        A reminder is easy to dismiss, so deep work swallows it. Revive waits until your focus time is up, then takes over every screen with something short to do. Nothing to remember. Nothing to argue with.
      </p>

      <!-- Two Compact Strips (~112px tall) -->
      <div class="why-strips">
        <!-- Left Strip: A normal reminder (Ignored) -->
        <div class="why-strip-card">
          <div class="why-strip">
            <div class="strip-topbar">
              <div class="strip-dots">
                <span class="strip-dot"></span>
                <span class="strip-dot"></span>
                <span class="strip-dot"></span>
              </div>
              <div class="strip-labels">
                <span class="strip-tag-muted">A normal reminder · Ignored</span>
              </div>
              <div class="strip-timer-tag">Focus · 24:58</div>
            </div>

            <!-- Horizontal work lines gently stretching & shrinking -->
            <div class="strip-work-lines">
              <div class="strip-work-line l1"></div>
              <div class="strip-work-line l2"></div>
              <div class="strip-work-line l3"></div>
            </div>

            <!-- Toast sliding in from top-right then sliding out -->
            <div class="strip-toast">
              <span>Time for a break?</span>
              <span class="strip-toast-dismiss">Dismiss</span>
            </div>
          </div>
          <p class="strip-caption text-center">
            One click and it is gone. You keep working, and the break never happens.
          </p>
        </div>

        <!-- Right Strip: Revive (Takes over) -->
        <div class="why-strip-card">
          <div class="why-strip revive-takeover">
            <div class="strip-topbar">
              <div class="strip-dots">
                <span class="strip-dot" style="background:var(--accent);"></span>
                <span class="strip-dot"></span>
                <span class="strip-dot"></span>
              </div>
              <div class="strip-labels">
                <span class="strip-tag-accent">Revive · Takes over</span>
              </div>
              <div class="strip-timer-tag">Focus · 24:58</div>
            </div>

            <!-- Background work lines running beneath takeover -->
            <div class="strip-work-lines">
              <div class="strip-work-line l1"></div>
              <div class="strip-work-line l2"></div>
              <div class="strip-work-line l3"></div>
            </div>

            <!-- 12s Takeover Overlay -->
            <div class="strip-overlay">
              <!-- Video slot under ring if available -->
              <video class="strip-video" muted loop playsinline autoplay preload="auto" src="assets/rest-breath.mp4" onerror="this.remove()"></video>
              <div class="strip-rest-label">Rest · 5:00</div>
              <div class="strip-ring"></div>
              <div class="strip-breath-text" id="strip-breath-txt">Breathe in</div>
            </div>
          </div>
          <p class="strip-caption text-center">
            The screen belongs to your rest. It hands back control when the rest is done.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 2: REVIVE IN ACTION — UPGRADED CENTERED SEGMENTED PILL & TABS
       ======================================================================== -->
  <section class="preview-section" id="preview-section">
    <div class="container text-center">
      <span class="sec-tag">Interactive Preview</span>
      <h2 class="sec-title split-text-anim">Revive in Action</h2>
      <p class="sec-desc">Test the breathing guidance, configure your sprint intervals, and build your custom active rest routines.</p>

      <!-- Centered One Segmented Pill Tab Bar -->
      <div class="preview-tab-pill-wrap">
        <div class="preview-tab-pill" role="tablist">
          <button class="preview-pill-btn active" id="tab-btn-breathing" role="tab" onclick="switchTab('breathing')">1. Breathing</button>
          <button class="preview-pill-btn" id="tab-btn-session" role="tab" onclick="switchTab('session')">2. Focus Setup</button>
          <button class="preview-pill-btn" id="tab-btn-custom" role="tab" onclick="switchTab('custom')">3. Custom Activities</button>
        </div>
      </div>

      <!-- Preview Window Frame -->
      <div class="preview-frame" id="preview-frame">
        <div class="preview-stage">

          <!-- TAB 1: BREATHING (All Centered in a Column) -->
          <div class="tab-view active" id="view-breathing">
            <div class="breath-col">
              <div class="breath-live-badge">
                <span class="brand-indicator" style="width:5px;height:5px;"></span>
                <span>LIVE</span>
              </div>
              <span class="caps" style="font-size:10.5px;color:var(--muted);letter-spacing:0.16em;">Guided Diaphragmatic Breath</span>

              <!-- 176px Ring with Thin Progress Arc + Inner Scaled Circle -->
              <div class="breath-ring-stage">
                <svg class="breath-svg" viewBox="0 0 176 176">
                  <circle class="breath-svg-track" cx="88" cy="88" r="82" fill="none" stroke-width="2" />
                  <circle class="breath-svg-progress" id="breath-arc" cx="88" cy="88" r="82" fill="none" stroke-width="2.5" stroke-dasharray="515" stroke-dashoffset="515" />
                </svg>

                <div class="breath-inner-circle" id="live-orb" title="Click to cycle breath phase" onclick="advanceBreathPhase()">
                  <span class="breath-sec-num" id="live-sec">4</span>
                </div>
              </div>

              <div class="breath-phase-word" id="live-phase">INHALE</div>
              <p class="breath-hint-line" id="live-cue">Expand diaphragm slowly · Rest your eyes</p>

              <!-- Phase Tracking Dots -->
              <div class="breath-phase-dots" id="breath-phase-dots">
                <span class="phase-dot active"></span>
                <span class="phase-dot"></span>
                <span class="phase-dot"></span>
                <span class="phase-dot"></span>
              </div>

              <!-- 3 Pattern Chips -->
              <div class="breath-chips">
                <button type="button" class="pattern-chip active" id="chip-box" onclick="selectPattern('box')">Box 4·4·4·4</button>
                <button type="button" class="pattern-chip" id="chip-478" onclick="selectPattern('478')">4-7-8</button>
                <button type="button" class="pattern-chip" id="chip-coherence" onclick="selectPattern('coherence')">Coherence 5·5</button>
              </div>
            </div>
          </div>

          <!-- TAB 2: FOCUS SETUP (Centered) -->
          <div class="tab-view" id="view-session">
            <div class="focus-setup-col">
              <div class="stepper-grid">
                <div class="stepper-card">
                  <span class="caps" style="font-size:10px;color:var(--muted);">Focus Interval</span>
                  <div class="stepper-box">
                    <div class="stepper-num">
                      <b id="val-focus">25</b>
                      <span>Mins</span>
                    </div>
                    <div class="stepper-controls">
                      <button type="button" class="stepper-btn" onclick="stepVal('focus', 5)">▲</button>
                      <button type="button" class="stepper-btn" onclick="stepVal('focus', -5)">▼</button>
                    </div>
                  </div>
                  <p style="font-size:11px;color:var(--muted);">Deep concentration</p>
                </div>

                <div class="stepper-card">
                  <span class="caps" style="font-size:10px;color:var(--muted);">Active Rest</span>
                  <div class="stepper-box">
                    <div class="stepper-num">
                      <b id="val-rest">5</b>
                      <span>Mins</span>
                    </div>
                    <div class="stepper-controls">
                      <button type="button" class="stepper-btn" onclick="stepVal('rest', 1)">▲</button>
                      <button type="button" class="stepper-btn" onclick="stepVal('rest', -1)">▼</button>
                    </div>
                  </div>
                  <p style="font-size:11px;color:var(--muted);">Gentle screen pause</p>
                </div>
              </div>

              <!-- Proportional 4-Cycle Bar (Focus faint white, Rest accent) -->
              <div class="cycle-bar-wrap">
                <div class="cycle-bar" id="cycle-bar-segments">
                  <!-- Generated dynamically in JS based on fVal & rVal -->
                </div>
                <div class="cycle-key">
                  <div class="cycle-key-item">
                    <span class="cycle-key-box" style="background:rgba(255,255,255,0.22);"></span>
                    <span>Focus Segment</span>
                  </div>
                  <div class="cycle-key-item">
                    <span class="cycle-key-box" style="background:var(--accent);"></span>
                    <span>Active Rest</span>
                  </div>
                </div>
              </div>

              <!-- Computed Plan Line -->
              <p class="plan-summary-line" id="val-summary">
                Plan: 4 focus cycles · 4 active rest breaks (~2 hours total)
              </p>
            </div>
          </div>

          <!-- TAB 3: CUSTOM ACTIVITIES (Centered) -->
          <div class="tab-view" id="view-custom">
            <div class="custom-act-col">
              <span class="caps" style="font-size:10.5px;color:var(--accent);margin-bottom:12px;">Create Custom Rest Routine</span>

              <div class="custom-type-chips">
                <button type="button" class="custom-type-chip active" onclick="selectActChip(this, 'Breath')">Breath</button>
                <button type="button" class="custom-type-chip" onclick="selectActChip(this, 'Stretch')">Stretch</button>
                <button type="button" class="custom-type-chip" onclick="selectActChip(this, 'Spotify')">Spotify</button>
                <button type="button" class="custom-type-chip" onclick="selectActChip(this, 'Custom')">Custom</button>
              </div>

              <div class="custom-input-row">
                <input type="text" id="custom-act-name" class="custom-input-text" placeholder="e.g. Neck mobility & hydrate" />
                <input type="number" id="custom-act-mins" class="custom-input-mins" value="5" min="1" max="60" />
                <button type="button" class="custom-add-btn" onclick="addCustomActivity()">+ Add to Routine</button>
              </div>

              <div class="custom-list" id="custom-list">
                <!-- Starts with the 2 preset rows -->
                <div class="custom-item-row" data-mins="5">
                  <span>Box Breathing Routine (Breath) · 5 mins</span>
                  <button type="button" class="custom-del-btn" onclick="removeCustomItem(this)" title="Remove">✕</button>
                </div>
                <div class="custom-item-row" data-mins="5">
                  <span>Spinal Decompression & Walk (Stretch) · 5 mins</span>
                  <button type="button" class="custom-del-btn" onclick="removeCustomItem(this)" title="Remove">✕</button>
                </div>
              </div>

              <div class="routine-total-line" id="routine-total-line">
                Routine total: 10 mins · 2 activities
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>

  <!-- Optional Wide 16:9 Demo Section (Only shown if assets/demo.mp4 loads) -->
  <section class="sec-wrap" id="demo-section" style="display:none;padding-bottom:0;">
    <div class="container text-center">
      <div style="width:100%;max-width:840px;margin:0 auto;aspect-ratio:16/9;border-radius:18px;border:1px solid var(--hud-border);overflow:hidden;background:#000;">
        <video muted loop playsinline autoplay preload="auto" src="assets/demo.mp4" onloadeddata="document.getElementById('demo-section').style.display='block'" onerror="document.getElementById('demo-section').remove()" style="width:100%;height:100%;object-fit:cover;"></video>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 3: THE SCIENCE OF FLOW STATE & ROUND TIMELINE (id="workflow")
       ======================================================================== -->
  <section class="sec-wrap" id="workflow">
    <div class="container">
      <div class="text-center" style="max-width:640px;margin:0 auto 36px;">
        <span class="sec-tag">The Science of Flow State</span>
        <h2 class="sec-title split-text-anim">Why Recovery Sustains Deep Work</h2>
        <p class="sec-desc">
          High-performance focus operates in natural biological waves. Incorporating intentional, active rest prevents dopamine exhaustion and preserves sharp cognitive stamina.
        </p>
      </div>

      <!-- Round Timeline: 25:5 Pill Segments + 2px Filling Track -->
      <div class="timeline-wrap">
        <div class="timeline-segments">
          <div class="timeline-pill focus">Focus · 25 min</div>
          <div class="timeline-pill rest">Rest · 5</div>
        </div>
        <div class="timeline-track">
          <div class="timeline-fill">
            <span class="timeline-dot"></span>
          </div>
        </div>
      </div>

      <!-- 4-Step Flow Cycle with Timestamps -->
      <div class="flow-cycle-grid">
        <!-- Step 1: Deep Sprint -->
        <div class="flow-card" id="flow-card-1" onclick="replayCardSVG(1)">
          <div class="flow-icon-box">
            <svg id="svg-flow-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="3" x2="12" y2="7" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="3" y1="12" x2="7" y2="12" />
              <line x1="17" y1="12" x2="21" y2="12" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div class="flow-meta-row">
            <span class="flow-num">01</span>
            <span class="flow-time-badge">0:00</span>
          </div>
          <div class="flow-card-title">Deep Sprint</div>
          <p class="flow-card-desc">Immerse into uninterrupted focus. Revive runs quietly in the system tray without disturbing your workspace.</p>
        </div>

        <!-- Step 2: Peaceful Pause -->
        <div class="flow-card" id="flow-card-2" onclick="replayCardSVG(2)">
          <div class="flow-icon-box">
            <svg id="svg-flow-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div class="flow-meta-row">
            <span class="flow-num">02</span>
            <span class="flow-time-badge">25:00</span>
          </div>
          <div class="flow-card-title">Peaceful Pause</div>
          <p class="flow-card-desc">Your screens gently dim into a calm horizon, prompting you to release muscular and mental tension.</p>
        </div>

        <!-- Step 3: Active Rest -->
        <div class="flow-card" id="flow-card-3" onclick="replayCardSVG(3)">
          <div class="flow-icon-box">
            <svg id="svg-flow-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4v16" />
              <path d="M12 9c-3-3-7-1-7 4 0 4 3 6 7 7" />
              <path d="M12 9c3-3 7-1 7 4 0 4-3 6-7 7" />
            </svg>
          </div>
          <div class="flow-meta-row">
            <span class="flow-num">03</span>
            <span class="flow-time-badge">25:00 – 30:00</span>
          </div>
          <div class="flow-card-title">Active Rest</div>
          <p class="flow-card-desc">Engage in restorative diaphragmatic breathwork, neck mobility, or sensory silence to reset your nervous system.</p>
        </div>

        <!-- Step 4: Refreshed Return -->
        <div class="flow-card" id="flow-card-4" onclick="replayCardSVG(4)">
          <div class="flow-icon-box">
            <svg id="svg-flow-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-5.19" />
            </svg>
          </div>
          <div class="flow-meta-row">
            <span class="flow-num">04</span>
            <span class="flow-time-badge">30:00</span>
          </div>
          <div class="flow-card-title">Refreshed Return</div>
          <p class="flow-card-desc">Your desktop smoothly restores. You resume work with clear vision, relaxed shoulders, and renewed stamina.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 4 (NEW): WHAT REST LOOKS LIKE (id="rest")
       ======================================================================== -->
  <section class="rest-section" id="rest">
    <div class="container text-center">
      <span class="sec-tag">What rest looks like</span>
      <h2 class="sec-title split-text-anim">
        A few ways to <span class="shimmer-text">actually switch off.</span>
      </h2>
      <p class="sec-desc">
        Choose a default, or pick a different one for each rest. Build your own breathing pattern if the presets do not suit you.
      </p>

      <!-- 4 Rest Modality Cards -->
      <div class="rest-cards-grid text-left">
        <!-- Card 1: Breathing -->
        <div class="rest-card">
          <div>
            <div class="rest-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 4v16" />
                <path d="M12 9c-3-3-7-1-7 4 0 4 3 6 7 7" />
                <path d="M12 9c3-3 7-1 7 4 0 4-3 6-7 7" />
              </svg>
            </div>
            <h3 class="rest-card-title">Breathing</h3>
            <p class="rest-card-desc">Box, 4-7-8 or coherence. Or set your own phases and seconds.</p>
          </div>
          <span class="rest-card-tag">Ends on the timer</span>
        </div>

        <!-- Card 2: Stretch -->
        <div class="rest-card">
          <div>
            <div class="rest-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v8" />
                <path d="M7 11l5-2 5 2" />
                <path d="M9 19l3-4 3 4" />
              </svg>
            </div>
            <h3 class="rest-card-title">Stretch</h3>
            <p class="rest-card-desc">Neck, shoulders and spine, one step at a time with a countdown.</p>
          </div>
          <span class="rest-card-tag">Ends on the timer</span>
        </div>

        <!-- Card 3: A video you pick -->
        <div class="rest-card">
          <div>
            <div class="rest-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
            </div>
            <h3 class="rest-card-title">A video you pick</h3>
            <p class="rest-card-desc">Paste a link to a dance, a workout, or something that makes you laugh.</p>
          </div>
          <span class="rest-card-tag">You end it</span>
        </div>

        <!-- Card 4: Music -->
        <div class="rest-card">
          <div>
            <div class="rest-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <h3 class="rest-card-title">Music</h3>
            <p class="rest-card-desc">Spotify, or a built-in ambient sound like rain.</p>
          </div>
          <span class="rest-card-tag">You end it</span>
        </div>
      </div>

      <!-- Dashed-Border Small Toasts Strip -->
      <div class="rest-toasts-strip">
        <div class="rest-toast-item">
          <span>Eye break every 20 min</span>
        </div>
        <div class="rest-toast-item">
          <span>Drink water every 45 min</span>
        </div>
        <div class="rest-toast-note">
          Small toasts. Never full screen.
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 5 (NEW): CLOSING CTA DIRECTLY ABOVE FOOTER
       ======================================================================== -->
  <section class="closing-cta-section" id="closing-cta">
    <div class="container closing-cta-content text-center">
      <h2 class="sec-title split-text-anim" style="margin-bottom:28px;">
        Rest is part of the work. <span class="shimmer-text">Revive makes sure it happens.</span>
      </h2>

      <div class="download-row">
        <button type="button" class="dl-btn primary" onclick="openDownloadModal('win')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
          </svg>
          Download for Windows
        </button>

        <button type="button" class="dl-btn secondary" onclick="openDownloadModal('mac')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.73-.85.03-1.89.57-2.5 1.28-.54.63-.99 1.65-.87 2.64.95.07 1.91-.47 2.49-1.19z"/>
          </svg>
          Download for macOS
        </button>
      </div>

      <div style="font-size:11px;color:var(--faint);letter-spacing:0.08em;margin-top:14px;">
        Windows & macOS
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 6: COMPACT SPLASH SCREEN FOOTER (KEEP EXACT & UNTOUCHED)
       ======================================================================== -->
  <footer class="splash-footer-wrap" id="splash-footer" title="Click anywhere or press Space / R to replay neon boot animation">
    <!-- Corner Ambient Videos -->
    <div class="jf tr">
      <video muted loop playsinline autoplay preload="auto" src="assets/corner.mp4" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='src/renderer/splash/assets/corner.mp4'}else if(this.dataset.fb==1){this.dataset.fb=2;this.src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'}else{this.remove()}"></video>
    </div>
    <div class="jf bl">
      <video muted loop playsinline autoplay preload="auto" src="assets/corner.mp4" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='src/renderer/splash/assets/corner.mp4'}else if(this.dataset.fb==1){this.dataset.fb=2;this.src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'}else{this.remove()}"></video>
    </div>

    <!-- Center Revive Neon Mark -->
    <div class="center" id="splash-center">
      ${svgMark}
    </div>

    <div class="splash-replay-hint">
      [ Click anywhere to replay neon write-in · Press 'R' or Space ]
    </div>
  </footer>

  <!-- Subfooter Bar -->
  <div class="site-subfooter">
    <div class="container site-subfooter-inner">
      <span style="font-size:11px;color:var(--faint);">© 2026 Revive. Offline-First Recovery. Available for Windows & macOS.</span>
      <div style="display:flex;align-items:center;gap:14px;">
        <a href="#hero" class="nav-link">Top ↑</a>
        <button type="button" class="nav-btn" onclick="openDownloadModal('win')">Get for Windows</button>
        <button type="button" class="nav-btn" onclick="openDownloadModal('mac')">Get for Mac</button>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       DOWNLOAD MODAL (Windows & macOS)
       ======================================================================== -->
  <div class="modal-backdrop" id="download-modal" onclick="closeDownloadModal(event)">
    <div class="dl-modal" onclick="event.stopPropagation()">
      <button type="button" class="modal-close" onclick="closeDownloadModal()">✕</button>

      <span class="caps" style="font-size:10px;color:var(--accent);">Download Revive v0.1.0</span>
      <h3 style="font-size:18px;font-weight:500;color:#fff;margin:6px 0 12px;">Choose Your Platform</h3>

      <div class="modal-os-tabs">
        <button type="button" class="modal-tab-btn active" id="modal-tab-win" onclick="switchModalTab('win')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/></svg>
          Windows
        </button>
        <button type="button" class="modal-tab-btn" id="modal-tab-mac" onclick="switchModalTab('mac')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.73-.85.03-1.89.57-2.5 1.28-.54.63-.99 1.65-.87 2.64.95.07 1.91-.47 2.49-1.19z"/></svg>
          macOS
        </button>
      </div>

      <!-- Windows Tab Content -->
      <div class="modal-tab-content active" id="modal-content-win">
        <div style="background:rgba(175,221,255,0.06);border:1px solid rgba(175,221,255,0.2);border-radius:12px;padding:14px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <b style="font-size:12px;color:var(--accent);">Revive-Setup-0.1.0.exe</b>
            <span style="font-size:11px;color:var(--muted);">~78 MB</span>
          </div>
          <p style="font-size:11px;color:var(--muted);">Windows 10 & 11 (64-bit installer)</p>
          <button type="button" class="dl-btn primary" style="padding:8px 18px;font-size:11px;margin-top:10px;" onclick="triggerFileDownload('win')">
            Download .exe
          </button>
        </div>

        <div class="modal-step">
          <div class="modal-step-num">1</div>
          <div>Run <code style="color:var(--accent);">Revive-Setup-0.1.0.exe</code> on your PC.</div>
        </div>
        <div class="modal-step">
          <div class="modal-step-num">2</div>
          <div>If Windows SmartScreen prompts, click <em>More info</em> then <em>Run anyway</em>.</div>
        </div>
        <div class="modal-step">
          <div class="modal-step-num">3</div>
          <div>Revive starts quietly in your system tray ready for your first focus cycle.</div>
        </div>
      </div>

      <!-- Mac Tab Content -->
      <div class="modal-tab-content" id="modal-content-mac">
        <div style="background:rgba(175,221,255,0.06);border:1px solid rgba(175,221,255,0.2);border-radius:12px;padding:14px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <b style="font-size:12px;color:var(--accent);">Revive-0.1.0-mac.dmg</b>
            <span style="font-size:11px;color:var(--muted);">~82 MB</span>
          </div>
          <p style="font-size:11px;color:var(--muted);">Universal build (Apple Silicon M1/M2/M3/M4 & Intel)</p>
          <button type="button" class="dl-btn primary" style="padding:8px 18px;font-size:11px;margin-top:10px;" onclick="triggerFileDownload('mac')">
            Download .dmg
          </button>
        </div>

        <div class="modal-step">
          <div class="modal-step-num">1</div>
          <div>Open <code style="color:var(--accent);">Revive-0.1.0-mac.dmg</code>.</div>
        </div>
        <div class="modal-step">
          <div class="modal-step-num">2</div>
          <div>Drag the Revive icon into your <b>Applications</b> folder.</div>
        </div>
        <div class="modal-step">
          <div class="modal-step-num">3</div>
          <div>Launch Revive from Spotlight or Launchpad.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast-notice" id="toast-notice">
    <span class="brand-indicator"></span>
    <div>
      <b style="font-size:12px;color:#fff;display:block;" id="toast-filename">Revive-Setup-0.1.0.exe</b>
      <span style="font-size:11px;color:var(--muted);">Download started · Check your downloads folder</span>
    </div>
  </div>

  <!-- ========================================================================
       SCRIPTS: MOTION, TIMELINES, INTERACTIVE PREVIEWS & PARTICLES
       ======================================================================== -->
  <script>
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && typeof gsap !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      function splitAndAnimateWords(el, options = {}) {
        if (!el) return;
        const originalText = el.innerText;
        const words = originalText.split(/\\s+/);
        el.innerHTML = words.map(w => '<span class="word-wrap"><span class="word-inner">' + w + '&nbsp;</span></span>').join('');

        const inners = el.querySelectorAll('.word-inner');
        if (options.scrollTrigger) {
          gsap.from(inners, {
            y: "120%",
            opacity: 0,
            rotateX: -40,
            stagger: options.stagger || 0.04,
            duration: options.duration || 0.85,
            ease: "power3.out",
            scrollTrigger: options.scrollTrigger
          });
        }
      }

      window.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll(".split-text-anim").forEach(title => {
          splitAndAnimateWords(title, {
            scrollTrigger: {
              trigger: title,
              start: "top 85%",
              toggleActions: "play none none none"
            },
            stagger: 0.035,
            duration: 0.75
          });
        });

        // 4 SVGs in Science of Flow State
        [1, 2, 3, 4].forEach(i => {
          const card = document.getElementById("flow-card-" + i);
          const svg = document.getElementById("svg-flow-" + i);
          if (card && svg) {
            ScrollTrigger.create({
              trigger: card,
              start: "top 80%",
              onEnter: () => animateSVGDraw(svg)
            });
          }
        });

        // Splash Signature in Footer
        const splashFooter = document.getElementById("splash-footer");
        if (splashFooter) {
          ScrollTrigger.create({
            trigger: splashFooter,
            start: "top 78%",
            onEnter: () => replaySplash()
          });
          splashFooter.addEventListener("click", replaySplash);
        }
      });
    }

    function prepSVG(svg) {
      if (!svg) return [];
      const paths = svg.querySelectorAll("path, circle, line, rect");
      paths.forEach(p => {
        let len = 60;
        try {
          if (p.getTotalLength) len = p.getTotalLength();
        } catch(e) {}
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.dataset.len = len;
      });
      return paths;
    }

    function animateSVGDraw(svg) {
      if (!svg) return;
      const paths = svg.querySelectorAll("path, circle, line, rect");
      paths.forEach((p, idx) => {
        const len = p.dataset.len || 60;
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(p, 
            { strokeDashoffset: len, opacity: 0.2 },
            { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: "power2.out", delay: idx * 0.08 }
          );
        } else {
          p.style.strokeDashoffset = "0";
          p.style.opacity = "1";
        }
      });
    }

    function replayCardSVG(num) {
      const svg = document.getElementById("svg-flow-" + num);
      if (svg) animateSVGDraw(svg);
    }

    function replaySplash(e) {
      if (e) e.stopPropagation();
      const svgEl = document.getElementById("mark");
      if (!svgEl) return;
      const clone = svgEl.cloneNode(true);
      svgEl.parentNode.replaceChild(clone, svgEl);
    }

    // =========================================================================
    // AMBIENCE: ~34 FAINT STARS & 7 DRIFTING LIGHT MOTES
    // =========================================================================
    (function initAmbience() {
      if (prefersReducedMotion) return;
      const st = document.getElementById("stars");
      if (st) {
        for (let i = 0; i < 34; i++) {
          const s = document.createElement("i");
          const is3px = i < 4;
          s.style.cssText = "left:" + (Math.random() * 100).toFixed(1) + "%;top:" + (Math.random() * 100).toFixed(1) + "%;--d:" + (4 + Math.random() * 6).toFixed(1) + "s;--s:-" + (Math.random() * 6).toFixed(1) + "s;--o:" + (0.25 + Math.random() * 0.45).toFixed(2) + ";" + (is3px ? "width:3px;height:3px;" : "");
          st.appendChild(s);
        }
      }

      const motesEl = document.getElementById("motes");
      if (motesEl) {
        for (let m = 0; m < 7; m++) {
          const mote = document.createElement("div");
          mote.className = "mote";
          const dur = (18 + Math.random() * 14).toFixed(1);
          const delay = (Math.random() * 18).toFixed(1);
          const left = (8 + Math.random() * 84).toFixed(1);
          const drift = (Math.random() * 40 - 20).toFixed(0);
          const op = (0.35 + Math.random() * 0.25).toFixed(2);
          mote.style.cssText = "left:" + left + "%;--m-dur:" + dur + "s;--m-delay:-" + delay + "s;--m-drift:" + drift + "px;--m-op:" + op + ";";
          motesEl.appendChild(mote);
        }
      }
    })();

    // Footer keyboard replay
    document.addEventListener("keydown", function(e) {
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) return;
        if (window.scrollY > document.body.scrollHeight - 900) {
          replaySplash();
        }
      }
    });

    // =========================================================================
    // SECTION 2: TABS LOGIC
    // =========================================================================
    function switchTab(tabKey) {
      const btns = document.querySelectorAll(".preview-pill-btn");
      btns.forEach(b => b.classList.remove("active"));
      const btn = document.getElementById("tab-btn-" + tabKey);
      if (btn) btn.classList.add("active");

      const views = document.querySelectorAll(".tab-view");
      views.forEach(v => {
        v.classList.remove("active");
        v.style.display = "none";
      });
      const target = document.getElementById("view-" + tabKey);
      if (target) {
        target.classList.add("active");
        target.style.display = "block";
      }
    }

    // =========================================================================
    // BREATHING ENGINE (BOX, 4-7-8, COHERENCE)
    // =========================================================================
    const PATTERNS = {
      box: {
        name: "Box 4·4·4·4",
        phases: [
          { name: "INHALE", sec: 4, scale: 1.25, cue: "Expand diaphragm slowly · Rest your eyes" },
          { name: "HOLD", sec: 4, scale: 1.25, cue: "Stay soft · Let your shoulders drop" },
          { name: "EXHALE", sec: 4, scale: 0.8, cue: "Release slowly · Unclench your jaw" },
          { name: "HOLD", sec: 4, scale: 0.8, cue: "Stay soft · Let your shoulders drop" }
        ]
      },
      "478": {
        name: "4-7-8",
        phases: [
          { name: "INHALE", sec: 4, scale: 1.25, cue: "Expand diaphragm slowly · Rest your eyes" },
          { name: "HOLD", sec: 7, scale: 1.25, cue: "Stay soft · Let your shoulders drop" },
          { name: "EXHALE", sec: 8, scale: 0.8, cue: "Release slowly · Unclench your jaw" }
        ]
      },
      coherence: {
        name: "Coherence 5·5",
        phases: [
          { name: "INHALE", sec: 5, scale: 1.25, cue: "Expand diaphragm slowly · Rest your eyes" },
          { name: "EXHALE", sec: 5, scale: 0.8, cue: "Release slowly · Unclench your jaw" }
        ]
      }
    };

    let curPatternKey = "box";
    let curPhaseIdx = 0;
    let phaseSecRem = 4;
    const CIRCLE_CIRCUMFERENCE = 515;

    function renderPhaseDots() {
      const container = document.getElementById("breath-phase-dots");
      if (!container) return;
      const phases = PATTERNS[curPatternKey].phases;
      container.innerHTML = phases.map((_, i) => '<span class="phase-dot' + (i === curPhaseIdx ? ' active' : '') + '"></span>').join('');
    }

    function selectPattern(key) {
      if (!PATTERNS[key]) return;
      curPatternKey = key;
      document.querySelectorAll(".pattern-chip").forEach(c => c.classList.remove("active"));
      const chip = document.getElementById("chip-" + key);
      if (chip) chip.classList.add("active");

      curPhaseIdx = 0;
      phaseSecRem = PATTERNS[key].phases[0].sec;
      applyBreathPhase(false);
      renderPhaseDots();
    }

    function applyBreathPhase(animate = true) {
      const phase = PATTERNS[curPatternKey].phases[curPhaseIdx];
      const orb = document.getElementById("live-orb");
      if (orb) {
        orb.style.transform = "scale(" + phase.scale + ")";
      }
      const phWord = document.getElementById("live-phase");
      if (phWord) phWord.textContent = phase.name;
      const cue = document.getElementById("live-cue");
      if (cue) cue.textContent = phase.cue;
      const sec = document.getElementById("live-sec");
      if (sec) sec.textContent = phaseSecRem;

      updateProgressArc();
      renderPhaseDots();
    }

    function updateProgressArc() {
      const phase = PATTERNS[curPatternKey].phases[curPhaseIdx];
      const arc = document.getElementById("breath-arc");
      if (!arc) return;
      const total = phase.sec;
      const elapsed = total - phaseSecRem;
      const fraction = Math.min(1, Math.max(0, elapsed / total));
      const offset = CIRCLE_CIRCUMFERENCE * (1 - fraction);
      arc.style.strokeDashoffset = offset;
    }

    function advanceBreathPhase() {
      const phases = PATTERNS[curPatternKey].phases;
      curPhaseIdx = (curPhaseIdx + 1) % phases.length;
      phaseSecRem = phases[curPhaseIdx].sec;
      applyBreathPhase(true);
    }

    if (!prefersReducedMotion) {
      setInterval(() => {
        phaseSecRem--;
        if (phaseSecRem < 0) {
          advanceBreathPhase();
        } else {
          const sec = document.getElementById("live-sec");
          if (sec) sec.textContent = phaseSecRem;
          updateProgressArc();
        }
      }, 1000);
    }
    renderPhaseDots();

    // =========================================================================
    // FOCUS SETUP STEPPER & PROPORTIONAL 4-CYCLE BAR
    // =========================================================================
    let fVal = 25;
    let rVal = 5;

    function renderCycleBar() {
      const container = document.getElementById("cycle-bar-segments");
      if (!container) return;
      let html = '';
      for (let i = 0; i < 4; i++) {
        html += '<div class="cycle-seg-focus" style="flex:' + fVal + ';"></div>';
        html += '<div class="cycle-seg-rest" style="flex:' + rVal + ';"></div>';
      }
      container.innerHTML = html;

      const totalMins = 4 * (fVal + rVal);
      let timeText = '';
      if (totalMins % 60 === 0) {
        const hrs = totalMins / 60;
        timeText = '~' + hrs + (hrs === 1 ? ' hour' : ' hours');
      } else {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        timeText = '~' + (hrs ? hrs + 'h ' : '') + mins + 'm';
      }
      const summary = document.getElementById("val-summary");
      if (summary) {
        summary.textContent = "Plan: 4 focus cycles · 4 active rest breaks (" + timeText + " total)";
      }
    }

    function stepVal(type, delta) {
      if (type === "focus") {
        fVal = Math.max(5, Math.min(180, fVal + delta));
        const el = document.getElementById("val-focus");
        if (el) el.textContent = fVal;
      } else {
        rVal = Math.max(1, Math.min(60, rVal + delta));
        const el = document.getElementById("val-rest");
        if (el) el.textContent = rVal;
      }
      renderCycleBar();
    }
    renderCycleBar();

    // =========================================================================
    // CUSTOM ACTIVITIES TAB
    // =========================================================================
    let chosenChipType = "Breath";
    function selectActChip(btn, typeName) {
      document.querySelectorAll(".custom-type-chip").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      chosenChipType = typeName;
    }

    function updateRoutineTotal() {
      const list = document.getElementById("custom-list");
      const rows = list.querySelectorAll(".custom-item-row");
      const totalLine = document.getElementById("routine-total-line");
      if (!totalLine) return;

      if (rows.length === 0) {
        list.innerHTML = '<div class="custom-item-empty">Add your first activity above.</div>';
        totalLine.textContent = "Routine total: 0 mins · 0 activities";
        return;
      }

      let totalMins = 0;
      rows.forEach(r => {
        totalMins += parseInt(r.getAttribute("data-mins") || "0", 10);
      });
      totalLine.textContent = "Routine total: " + totalMins + " mins · " + rows.length + " activities";
    }

    function addCustomActivity() {
      const nameIn = document.getElementById("custom-act-name");
      const minsIn = document.getElementById("custom-act-mins");
      const name = nameIn.value.trim() || (chosenChipType + " Routine");
      const mins = parseInt(minsIn.value, 10) || 5;

      const list = document.getElementById("custom-list");
      const emptyNotice = list.querySelector(".custom-item-empty");
      if (emptyNotice) emptyNotice.remove();

      const row = document.createElement("div");
      row.className = "custom-item-row";
      row.setAttribute("data-mins", mins);
      row.innerHTML = '<span>' + name + ' (' + chosenChipType + ') · ' + mins + ' mins</span><button type="button" class="custom-del-btn" onclick="removeCustomItem(this)" title="Remove">✕</button>';
      row.style.opacity = "0";
      list.prepend(row);

      setTimeout(() => { row.style.opacity = "1"; }, 10);
      nameIn.value = "";
      updateRoutineTotal();
    }

    function removeCustomItem(btn) {
      const row = btn.closest(".custom-item-row");
      if (row) {
        row.remove();
        updateRoutineTotal();
      }
    }
    updateRoutineTotal();

    // =========================================================================
    // DOWNLOAD MODAL & TRIGGER
    // =========================================================================
    function openDownloadModal(platform) {
      const modal = document.getElementById("download-modal");
      if (modal) modal.classList.add("open");
      switchModalTab(platform || "win");
      triggerFileDownload(platform || "win");
    }

    function closeDownloadModal(e) {
      if (e && e.target !== e.currentTarget && !e.target.classList.contains("modal-close")) return;
      const modal = document.getElementById("download-modal");
      if (modal) modal.classList.remove("open");
    }

    function switchModalTab(os) {
      document.getElementById("modal-tab-win").classList.toggle("active", os === "win");
      document.getElementById("modal-tab-mac").classList.toggle("active", os === "mac");
      document.getElementById("modal-content-win").classList.toggle("active", os === "win");
      document.getElementById("modal-content-mac").classList.toggle("active", os === "mac");
    }

    function triggerFileDownload(os) {
      const filename = os === "mac" ? "Revive-0.1.0-mac.dmg" : "Revive-Setup-0.1.0.exe";
      const toastFn = document.getElementById("toast-filename");
      if (toastFn) toastFn.textContent = filename;

      const toast = document.getElementById("toast-notice");
      if (toast) {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 5000);
      }

      const content = os === "mac" ? "Revive macOS Universal DMG Build" : "Revive Windows Desktop Installer (.exe)";
      const blob = new Blob([content], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    }
  </script>
</body>
</html>
`;

// Compile to root index.html and landing.html
fs.writeFileSync(path.resolve(__dirname, '../index.html'), html, 'utf8');
fs.writeFileSync(path.resolve(__dirname, '../landing.html'), html, 'utf8');

// Compile to dist-site for isolated Vercel static deployment
const distSite = path.resolve(__dirname, '../dist-site');
if (!fs.existsSync(distSite)) {
  fs.mkdirSync(distSite, { recursive: true });
}
fs.writeFileSync(path.join(distSite, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(distSite, 'landing.html'), html, 'utf8');

const srcAssets = path.resolve(__dirname, '../assets');
const destAssets = path.join(distSite, 'assets');
if (fs.existsSync(srcAssets)) {
  fs.cpSync(srcAssets, destAssets, { recursive: true });
}

console.log('Successfully compiled landing page to root and dist-site for Vercel deployment!');
