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
  <meta name="description" content="Download Revive for Windows and macOS. Protect cognitive stamina and sustain flow state through peaceful screen pauses, guided breathing, and custom active rest routines." />
  <meta name="theme-color" content="#020407" />

  <!-- OpenGraph -->
  <meta property="og:title" content="Revive — Sustained Focus Grounded in Recovery" />
  <meta property="og:description" content="Offline-first desktop recovery app for Windows & macOS." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="assets/revive-ui-screenshot.jpg" />

  <!-- Typography: Strict JetBrains Mono Matching the App -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" href="assets/icon.png" />

  <!-- Animation Libraries: GSAP, ScrollTrigger & TextPlugin -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/TextPlugin.min.js"></script>

  <style>
    /* ==========================================================================
       REVIVE DESIGN SYSTEM — PURE JETBRAINS MONO & COLD NEON KINETICS
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

    /* Splash-Matching Ambient Starfield (Unified Across Entire Page) */
    .stars {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }
    .stars i {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: #fff;
      opacity: 0;
      animation: tw var(--d, 4s) ease-in-out var(--s, 0s) infinite;
    }
    @keyframes tw {
      0%, 100% { opacity: 0; }
      50% { opacity: var(--o, 0.7); }
    }

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

    /* Textual Motion Graphics Typography Utilities */
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
       HERO SECTION (Pure JetBrains Mono, Calm, Editorial)
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
    }
    .hero-content {
      max-width: 720px;
      margin: 0 auto;
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
    .shimmer-text {
      color: var(--accent);
      text-shadow: 0 0 25px rgba(175, 221, 255, 0.4);
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

    /* ==========================================================================
       SECTION 1: REVIVE IN ACTION — TABS CENTERED IN THE TOPBAR
       ========================================================================== */
    .preview-section {
      padding: 100px 0 90px;
      position: relative;
      border-top: 1px solid var(--hair);
      background: transparent;
    }
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
      max-width: 560px;
      margin: 0 auto;
    }

    /* Window Frame with MATHEMATICALLY CENTERED Tabs */
    .preview-frame {
      width: 100%;
      max-width: 840px;
      margin: 40px auto 0;
      border-radius: 18px;
      border: 1px solid var(--hud-border);
      background: #020407;
      overflow: hidden;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(40, 95, 160, 0.15);
      position: relative;
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

    /* TOPBAR: EXACT CENTER ALIGNMENT FOR THE 3 TABS */
    .preview-topbar {
      height: 50px;
      background: rgba(8, 12, 18, 0.96);
      border-bottom: 1px solid var(--hair);
      display: grid;
      grid-template-columns: 120px 1fr 120px; /* Equal flanking columns ensures center column is 100% centered */
      align-items: center;
      padding: 0 18px;
    }
    .preview-topbar-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .preview-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
    }
    .preview-dot.red { background: rgba(255, 95, 87, 0.7); }
    .preview-dot.yellow { background: rgba(254, 188, 46, 0.7); }
    .preview-dot.green { background: rgba(40, 200, 64, 0.7); }

    /* TABS EXACTLY IN THE MIDDLE OF THE BAR */
    .preview-tabs {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin: 0 auto;
      width: 100%;
    }
    .preview-tab-btn {
      font-family: var(--font-mono);
      font-size: 10.5px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 7px;
      border: 1px solid transparent;
      color: var(--muted);
      background: none;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .preview-tab-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
    .preview-tab-btn.active {
      color: var(--accent);
      background: rgba(175, 221, 255, 0.09);
      border-color: rgba(175, 221, 255, 0.32);
      box-shadow: 0 0 12px rgba(175, 221, 255, 0.15);
    }

    .preview-topbar-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    .preview-live-badge {
      font-size: 9px;
      letter-spacing: 0.14em;
      color: var(--accent);
      border: 1px solid rgba(175, 221, 255, 0.25);
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(175, 221, 255, 0.05);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .live-pulse-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }

    .preview-stage {
      padding: 36px 24px;
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(40, 95, 160, 0.14), transparent 75%), #020407;
    }
    .tab-view { display: none; width: 100%; }
    .tab-view.active { display: block; }

    /* Tab 1: Breathing View */
    .orb-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .orb-orbit-wrap {
      position: relative;
      width: 190px;
      height: 190px;
      display: grid;
      place-items: center;
      margin: 16px 0 18px;
    }
    .orb-ripple {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(175, 221, 255, 0.15);
      pointer-events: none;
    }
    .orb-ripple.r1 { width: 135px; height: 135px; }
    .orb-ripple.r2 { width: 170px; height: 170px; opacity: 0.45; }
    .orb-ring {
      position: absolute;
      inset: 0;
      border: 1px solid rgba(175, 221, 255, 0.18);
      border-radius: 50%;
      animation: orbit-spin 60s linear infinite;
    }
    .orb-satellite {
      position: absolute;
      top: -3px;
      left: calc(50% - 3px);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
    }
    @keyframes orbit-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .orb-core {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--accent-core) 0%, var(--accent) 30%, rgba(175, 221, 255, 0.2) 65%, transparent 75%);
      box-shadow: 0 0 35px rgba(175, 221, 255, 0.55), inset 0 0 18px rgba(255, 255, 255, 0.8);
      display: grid;
      place-items: center;
      transform: scale(0.6);
      transition: transform 0.1s linear;
      cursor: pointer;
    }
    .orb-sec {
      font-size: 26px;
      font-weight: 500;
      color: #000;
      line-height: 1;
    }
    .orb-phase {
      font-size: 13.5px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 5px;
      font-weight: 500;
    }

    /* Tab 2: Focus Setup View */
    .stepper-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      max-width: 580px;
      margin: 0 auto;
    }
    .stepper-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--hair);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .stepper-box {
      display: flex;
      border: 1px solid var(--hud-border);
      border-radius: 12px;
      overflow: hidden;
      width: 145px;
      height: 70px;
      margin: 12px 0;
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
      font-size: 30px;
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
      width: 34px;
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

    /* Tab 3: Custom Activities View (Add Your Own Activities) */
    .custom-act-wrap {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--hair);
      border-radius: 16px;
      padding: 24px;
    }
    .act-type-tiles {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .act-type-tile {
      height: 48px;
      border: 1px solid var(--hud-border);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      color: var(--muted);
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      transition: all 0.2s;
    }
    .act-type-tile.on, .act-type-tile:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(175, 221, 255, 0.08);
    }
    .act-inputs-row {
      display: grid;
      grid-template-columns: 1fr 100px;
      gap: 10px;
      margin-bottom: 12px;
    }
    .act-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hud-border);
      border-radius: 10px;
      padding: 10px 14px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #fff;
      outline: none;
    }
    .act-input:focus { border-color: var(--accent); }
    .act-add-btn {
      padding: 10px 20px;
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
    }
    .act-add-btn:hover { background: var(--accent-hi); }
    .custom-act-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
      max-height: 120px;
      overflow-y: auto;
    }
    .custom-act-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 13px;
      border: 1px solid var(--hair);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.015);
      font-size: 11px;
    }

    /* ==========================================================================
       SECTION 2: RECOVERY PHILOSOPHY & WORKFLOW (5 SVGs Animating on Scroll)
       ========================================================================== */
    .sec-wrap {
      padding: 100px 0;
      position: relative;
      border-top: 1px solid var(--hair);
      background: transparent;
    }
    .flow-cycle-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 0;
    }
    .flow-card {
      background: var(--bg-card);
      border: 1px solid var(--hair);
      border-radius: 14px;
      padding: 24px 20px;
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
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(175, 221, 255, 0.06);
      border: 1px solid rgba(175, 221, 255, 0.22);
      display: grid;
      place-items: center;
      margin-bottom: 16px;
      color: var(--accent);
      transition: all 0.3s;
    }
    .flow-card:hover .flow-icon-box {
      background: rgba(175, 221, 255, 0.12);
      border-color: var(--accent);
      box-shadow: 0 0 16px rgba(175, 221, 255, 0.35);
    }
    .flow-icon-box svg {
      width: 24px;
      height: 24px;
      overflow: visible;
    }
    .flow-num {
      font-size: 16px;
      font-weight: 500;
      color: var(--accent);
      margin-bottom: 6px;
    }
    .flow-card-title {
      font-size: 14.5px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 6px;
    }
    .flow-card-desc {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
    }

    /* ==========================================================================
       SECTION 3: COMPACT SPLASH SCREEN FOOTER (5th SVG Animated on Scroll)
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
    .splash-footer-wrap::before {
      display: none;
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

    /* Responsive adjustments */
    @media (max-width: 820px) {
      .flow-cycle-grid { grid-template-columns: 1fr 1fr; }
      .nav-center-links { display: none; }
      .preview-topbar { grid-template-columns: 80px 1fr 80px; padding: 0 10px; }
      .preview-live-badge { display: none; }
    }
    @media (max-width: 580px) {
      .flow-cycle-grid { grid-template-columns: 1fr; }
      .stepper-grid { grid-template-columns: 1fr; }
      .act-type-tiles { grid-template-columns: 1fr 1fr; }
      .download-row { flex-direction: column; width: 100%; }
      .dl-btn { width: 100%; justify-content: center; }
      .preview-topbar { grid-template-columns: 1fr; }
      .preview-topbar-left { display: none; }
      .preview-topbar-right { display: none; }
      .preview-tab-btn { font-size: 9.5px; padding: 5px 8px; }
    }
  </style>
</head>
<body>

  <!-- Splash-Matching Starfield (Fixed Across Complete Page) -->
  <div class="stars" id="stars"></div>

  <!-- ========================================================================
       TOP NAVIGATION
       ======================================================================== -->
  <header class="nav-bar">
    <div class="container nav-container">
      <a href="#hero" class="nav-brand">
        <span class="brand-indicator"></span>
        <span class="brand-name">Revive</span>
      </a>

      <!-- 2-Link Center Nav -->
      <div class="nav-center-links">
        <a href="#preview-section" class="nav-link">Revive in Action</a>
        <a href="#workflow" class="nav-link">Workflow</a>
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
       HERO SECTION — 100VH COMPLETE TAKEOVER + TEXTUAL MOTION GRAPHICS
       ======================================================================== -->
  <section class="hero-section" id="hero">
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

      <!-- Primary Download Buttons for Windows and Mac -->
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
        <span style="opacity:0.3;">·</span>
        <span>Offline-First</span>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 1: REVIVE IN ACTION — TABS CENTERED IN THE TOPBAR (3 Tabs)
       ======================================================================== -->
  <section class="preview-section" id="preview-section">
    <div class="container text-center">
      <span class="sec-tag">Interactive Preview</span>
      <h2 class="sec-title split-text-anim">Revive in Action</h2>
      <p class="sec-desc">Test the breathing guidance, configure your sprint intervals, and build your custom active rest routines.</p>

      <!-- Frame containing exactly 3 tabs CENTERED in the topbar -->
      <div class="preview-frame" id="preview-frame">
        <div class="preview-topbar">
          <!-- Left: Mac Window Controls -->
          <div class="preview-topbar-left">
            <div class="preview-dot red"></div>
            <div class="preview-dot yellow"></div>
            <div class="preview-dot green"></div>
          </div>

          <!-- Center: 3 TABS IN THE EXACT MIDDLE OF THE BAR -->
          <div class="preview-tabs">
            <button class="preview-tab-btn active" onclick="switchTab('breathing')">1. Breathing</button>
            <button class="preview-tab-btn" onclick="switchTab('session')">2. Focus Setup</button>
            <button class="preview-tab-btn" onclick="switchTab('custom')">3. Custom Activities</button>
          </div>

          <!-- Right: Live Indicator -->
          <div class="preview-topbar-right">
            <div class="preview-live-badge">
              <span class="live-pulse-dot"></span>
              <span>LIVE</span>
            </div>
          </div>
        </div>

        <div class="preview-stage">
          <!-- Tab 1: Breathing -->
          <div class="tab-view active" id="view-breathing">
            <div class="orb-stage">
              <span class="caps" style="font-size:10px;color:var(--muted);letter-spacing:0.16em;">Guided Diaphragmatic Breath</span>
              <div class="orb-orbit-wrap">
                <div class="orb-ripple r1"></div>
                <div class="orb-ripple r2"></div>
                <div class="orb-ring"><div class="orb-satellite"></div></div>
                <div class="orb-core" id="live-orb" title="Click to accelerate breathing rhythm" onclick="advanceBreathPhase()">
                  <span class="orb-sec" id="live-sec">4</span>
                </div>
              </div>
              <div class="orb-phase" id="live-phase">INHALE</div>
              <p style="font-size:12.5px;color:var(--muted);max-width:32ch;" id="live-cue">Expand diaphragm slowly · Rest your eyes</p>
            </div>
          </div>

          <!-- Tab 2: Focus Setup -->
          <div class="tab-view" id="view-session">
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
                <p style="font-size:11px;color:var(--muted);">Deep, quiet concentration</p>
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
            <p style="font-size:11.5px;color:var(--accent);text-align:center;margin-top:18px;" id="val-summary">
              Plan: 4 focus cycles · 4 active rest breaks (~2 hours total)
            </p>
          </div>

          <!-- Tab 3: Custom Activities (Add your own activities) -->
          <div class="tab-view" id="view-custom">
            <div class="custom-act-wrap">
              <span class="caps" style="font-size:10.5px;color:var(--accent);display:block;margin-bottom:12px;">Create Custom Rest Routine</span>

              <div class="act-type-tiles">
                <button type="button" class="act-type-tile on" onclick="selectActType(this, 'Breathing')">Breath</button>
                <button type="button" class="act-type-tile" onclick="selectActType(this, 'Movement')">Stretch</button>
                <button type="button" class="act-type-tile" onclick="selectActType(this, 'Spotify')">Spotify</button>
                <button type="button" class="act-type-tile" onclick="selectActType(this, 'Custom')">Custom</button>
              </div>

              <div class="act-inputs-row">
                <input type="text" id="custom-act-name" class="act-input" placeholder="e.g. Neck mobility & hydrate" />
                <input type="number" id="custom-act-mins" class="act-input" value="5" min="1" max="30" />
              </div>

              <div style="display:flex;justify-content:flex-end;">
                <button type="button" class="act-add-btn" onclick="addCustomActivity()">+ Add to Routine</button>
              </div>

              <div class="custom-act-list" id="custom-act-list">
                <div class="custom-act-item">
                  <span>Box Breathing Routine (Breath)</span>
                  <span style="color:var(--accent);">5 mins</span>
                </div>
                <div class="custom-act-item">
                  <span>Spinal Decompression & Walk (Stretch)</span>
                  <span style="color:var(--accent);">5 mins</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       SECTION 2: FLOW STATE RECOVERY & WORKFLOW (5 SVGs Animating on Scroll)
       ======================================================================== -->
  <section class="sec-wrap" id="workflow">
    <div class="container">
      <div class="text-center" style="max-width:640px;margin:0 auto 48px;">
        <span class="sec-tag">The Science of Flow State</span>
        <h2 class="sec-title split-text-anim">Why Recovery Sustains Deep Work</h2>
        <p class="sec-desc">
          High-performance focus operates in natural biological waves. Incorporating intentional, active rest prevents dopamine exhaustion and preserves sharp cognitive stamina.
        </p>
      </div>

      <!-- 4-Step Flow Cycle with Scroll-Animated SVGs (SVGs 1 to 4) -->
      <div class="flow-cycle-grid">
        <!-- SVG 1: Deep Sprint focus crosshair -->
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
          <div class="flow-num">01</div>
          <div class="flow-card-title">Deep Sprint</div>
          <p class="flow-card-desc">Immerse into uninterrupted focus. Revive runs quietly in the system tray without disturbing your workspace.</p>
        </div>

        <!-- SVG 2: Screen takeover window -->
        <div class="flow-card" id="flow-card-2" onclick="replayCardSVG(2)">
          <div class="flow-icon-box">
            <svg id="svg-flow-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div class="flow-num">02</div>
          <div class="flow-card-title">Peaceful Pause</div>
          <p class="flow-card-desc">Your screens gently dim into a calm horizon, prompting you to release muscular and mental tension.</p>
        </div>

        <!-- SVG 3: Breathwork pulse / lungs -->
        <div class="flow-card" id="flow-card-3" onclick="replayCardSVG(3)">
          <div class="flow-icon-box">
            <svg id="svg-flow-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 4v16" />
              <path d="M12 9c-3-3-7-1-7 4 0 4 3 6 7 7" />
              <path d="M12 9c3-3 7-1 7 4 0 4-3 6-7 7" />
            </svg>
          </div>
          <div class="flow-num">03</div>
          <div class="flow-card-title">Active Rest</div>
          <p class="flow-card-desc">Engage in restorative diaphragmatic breathwork, neck mobility, or sensory silence to reset your nervous system.</p>
        </div>

        <!-- SVG 4: Circular restoration flow -->
        <div class="flow-card" id="flow-card-4" onclick="replayCardSVG(4)">
          <div class="flow-icon-box">
            <svg id="svg-flow-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-5.19" />
            </svg>
          </div>
          <div class="flow-num">04</div>
          <div class="flow-card-title">Refreshed Return</div>
          <p class="flow-card-desc">Your desktop smoothly restores. You resume work with clear vision, relaxed shoulders, and renewed stamina.</p>
        </div>
      </div>

    </div>
  </section>

  <!-- ========================================================================
       SECTION 3: COMPACT SPLASH SCREEN FOOTER (5th SVG Animated on Scroll)
       ======================================================================== -->
  <footer class="splash-footer-wrap" id="splash-footer" title="Click anywhere or press Space / R to replay neon boot animation">


    <!-- Corner Ambient Videos -->
    <div class="jf tr">
      <video muted loop playsinline autoplay preload="auto" src="assets/corner.mp4" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='src/renderer/splash/assets/corner.mp4'}else if(this.dataset.fb==1){this.dataset.fb=2;this.src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'}else{this.remove()}"></video>
    </div>
    <div class="jf bl">
      <video muted loop playsinline autoplay preload="auto" src="assets/corner.mp4" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='src/renderer/splash/assets/corner.mp4'}else if(this.dataset.fb==1){this.dataset.fb=2;this.src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'}else{this.remove()}"></video>
    </div>

    <!-- Center Revive Neon Mark (5th SVG triggered automatically on scroll arrival!) -->
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
       GSAP KINETIC TEXT, SCROLLTRIGGER & 5 SVG ANIMATIONS ON SCROLL
       ======================================================================== -->
  <script>
    gsap.registerPlugin(ScrollTrigger);

    // 1. Textual Motion Graphics: Word-by-Word Split Kinetic Typography
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
      } else {
        gsap.from(inners, {
          y: "120%",
          opacity: 0,
          rotateX: -40,
          stagger: options.stagger || 0.04,
          duration: options.duration || 0.85,
          ease: "power3.out",
          delay: options.delay || 0.2
        });
      }
    }

    // 2. Five SVGs Animating on Scroll
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
        gsap.fromTo(p, 
          { strokeDashoffset: len, opacity: 0.2 },
          { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: "power2.out", delay: idx * 0.08 }
        );
      });
      gsap.fromTo(svg,
        { scale: 0.88, filter: "drop-shadow(0 0 0px var(--accent))" },
        { scale: 1, filter: "drop-shadow(0 0 10px rgba(175, 221, 255, 0.65))", duration: 0.7, ease: "back.out(1.8)" }
      );
    }

    function replayCardSVG(num) {
      const svg = document.getElementById("svg-flow-" + num);
      if (svg) animateSVGDraw(svg);
    }

    // 4. Replay Splash SVG Neon Mark (5th SVG)
    function replaySplash(e) {
      if (e) e.stopPropagation();
      const svgEl = document.getElementById("mark");
      if (!svgEl) return;
      const clone = svgEl.cloneNode(true);
      svgEl.parentNode.replaceChild(clone, svgEl);
    }

    window.addEventListener("DOMContentLoaded", function() {

      // Scroll-Triggered Headings Kinetic Reveals
      document.querySelectorAll(".split-text-anim").forEach(title => {
        splitAndAnimateWords(title, {
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            toggleActions: "play none none none"
          },
          stagger: 0.04,
          duration: 0.75
        });
      });

      // Prepare SVGs 1 to 4
      [1, 2, 3, 4].forEach(i => {
        const svg = document.getElementById("svg-flow-" + i);
        if (svg) prepSVG(svg);
      });

      // ScrollTrigger for SVGs 1 to 4: Animate whenever viewer reaches that point
      [1, 2, 3, 4].forEach(i => {
        const card = document.getElementById("flow-card-" + i);
        const svg = document.getElementById("svg-flow-" + i);
        if (card && svg) {
          ScrollTrigger.create({
            trigger: card,
            start: "top 80%",
            onEnter: () => {
              animateSVGDraw(svg);
            }
          });
        }
      });

      // SVG 5: Master Signature SVG #mark in Footer triggers write-in animation on scroll arrival
      const splashFooter = document.getElementById("splash-footer");
      if (splashFooter) {
        ScrollTrigger.create({
          trigger: splashFooter,
          start: "top 78%",
          onEnter: () => {
            replaySplash();
          }
        });
        splashFooter.addEventListener("click", replaySplash);
      }

      // Preview window floating physics
      gsap.to("#preview-frame", {
        y: -6,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    // =========================================================================
    // UNIFIED STARFIELD (Exact Splash Screen Stars Across Complete Page & Footer)
    // =========================================================================
    (function initStars() {
      const st = document.getElementById("stars");
      if (!st) return;
      for (let i = 0; i < 160; i++) {
        const s = document.createElement("i");
        s.style.cssText = "left:" + (Math.random() * 100).toFixed(2) + "%;top:" + (Math.random() * 100).toFixed(2) + "%;--d:" + (3 + Math.random() * 5).toFixed(1) + "s;--s:-" + (Math.random() * 6).toFixed(1) + "s;--o:" + (0.3 + Math.random() * 0.6).toFixed(2);
        if (Math.random() < 0.12) {
          s.style.width = s.style.height = "3px";
        }
        st.appendChild(s);
      }
    })();

    // Keyboard replay for footer splash
    document.addEventListener("keydown", function(e) {
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) return;
        if (window.scrollY > document.body.scrollHeight - 900) {
          replaySplash();
        }
      }
    });

    // Preview Tab Switching (Centered Tabs Bar, 3 Tabs)
    function switchTab(tabKey) {
      const btns = document.querySelectorAll(".preview-tab-btn");
      btns.forEach(b => b.classList.remove("active"));
      const activeBtn = Array.from(btns).find(b => b.getAttribute("onclick") && b.getAttribute("onclick").indexOf(tabKey) !== -1);
      if (activeBtn) activeBtn.classList.add("active");

      const views = document.querySelectorAll(".tab-view");
      views.forEach(v => {
        v.classList.remove("active");
        v.style.display = "none";
      });
      const target = document.getElementById("view-" + tabKey);
      if (target) {
        target.classList.add("active");
        target.style.display = "block";
        if (typeof gsap !== "undefined") {
          gsap.fromTo(target, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
        }
      }
    }

    // Focus & Rest Stepper Logic
    let fVal = 25;
    let rVal = 5;
    function stepVal(type, delta) {
      if (type === "focus") {
        fVal = Math.max(5, Math.min(120, fVal + delta));
        document.getElementById("val-focus").textContent = fVal;
      } else {
        rVal = Math.max(1, Math.min(30, rVal + delta));
        document.getElementById("val-rest").textContent = rVal;
      }
      const totalMinutes = 4 * (fVal + rVal);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      document.getElementById("val-summary").textContent = "Plan: 4 focus cycles · 4 active rest breaks (~" + (hrs ? hrs + "h " : "") + (mins ? mins + "m" : "") + " total)";
    }

    // Breathing Cycle Loop
    let orbP = 0;
    let orbSec = 4;
    const pData = [
      { name: "INHALE", cue: "Expand diaphragm slowly · Rest your eyes", scale: 1.05 },
      { name: "HOLD", cue: "Stillness · Keep lungs gently expanded", scale: 1.05 },
      { name: "EXHALE", cue: "Slow controlled release · Drop shoulders", scale: 0.6 },
      { name: "HOLD", cue: "Pause before the next cycle", scale: 0.6 }
    ];

    function advanceBreathPhase() {
      orbP = (orbP + 1) % pData.length;
      orbSec = 4;
      const cur = pData[orbP];
      const orb = document.getElementById("live-orb");
      if (orb) {
        if (typeof gsap !== "undefined") {
          gsap.to(orb, { scale: cur.scale, duration: 0.8, ease: "power1.inOut" });
        } else {
          orb.style.transform = "scale(" + cur.scale + ")";
        }
      }
      const ph = document.getElementById("live-phase");
      if (ph) ph.textContent = cur.name;
      const cue = document.getElementById("live-cue");
      if (cue) cue.textContent = cur.cue;
      const sec = document.getElementById("live-sec");
      if (sec) sec.textContent = orbSec;
    }

    setInterval(() => {
      orbSec--;
      if (orbSec <= 0) {
        advanceBreathPhase();
      } else {
        const sec = document.getElementById("live-sec");
        if (sec) sec.textContent = orbSec;
      }
    }, 1000);

    // Custom Activity Adder (Tab 3)
    let selectedType = "Breathing";
    function selectActType(el, typeName) {
      document.querySelectorAll(".act-type-tile").forEach(t => t.classList.remove("on"));
      el.classList.add("on");
      selectedType = typeName;
    }

    function addCustomActivity() {
      const nameInput = document.getElementById("custom-act-name");
      const minsInput = document.getElementById("custom-act-mins");
      const name = nameInput.value.trim() || (selectedType + " Routine");
      const mins = minsInput.value || "5";

      const list = document.getElementById("custom-act-list");
      const item = document.createElement("div");
      item.className = "custom-act-item";
      item.innerHTML = '<span>' + name + ' (' + selectedType + ')</span><span style="color:var(--accent);">' + mins + ' mins</span>';
      list.prepend(item);

      if (typeof gsap !== "undefined") {
        gsap.from(item, { opacity: 0, y: -8, duration: 0.3, ease: "power2.out" });
      }

      nameInput.value = "";
    }

    // Download Modal & Platform Handlers (Windows & macOS)
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
