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
  <title>Revive — Sustainable Flow Starts with Recovery</title>
  <meta name="description" content="Revive is a desktop app for sustainable flow. Start a session, and when your focus time ends it opens guided recovery on your screen, then hands you back to your work. Windows and macOS." />
  <meta name="theme-color" content="#000000" />

  <!-- OpenGraph -->
  <meta property="og:title" content="Revive — Sustainable Flow Starts with Recovery" />
  <meta property="og:description" content="Revive is a desktop app for sustainable flow. Start a session, and when your focus time ends it opens guided recovery on your screen, then hands you back to your work. Windows and macOS." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="assets/revive-ui-screenshot.jpg" />

  <!-- Typography: JetBrains Mono & Lavishly Yours for Brand Wordmark -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Lavishly+Yours&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/png" href="assets/icon.png" />

  <style>
    /* ==========================================================================
       REVIVE DESIGN SYSTEM — PURE JETBRAINS MONO & CALM RECOVERY TOKENS
       ========================================================================== */
    :root {
      color-scheme: dark;
      --bg: #000000;
      --surface: #020407;
      --text: #FFFFFF;
      --muted: rgba(255, 255, 255, 0.58);
      --faint: rgba(255, 255, 255, 0.34);
      --hair: rgba(255, 255, 255, 0.08);

      --accent: #AFDDFF;
      --accent-hover: #C8E8FF;
      --accent-wash: rgba(175, 221, 255, 0.08);
      --accent-line: rgba(175, 221, 255, 0.28);
      --accent-glow: rgba(175, 221, 255, 0.35);

      --font-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
      --font-brand: 'Lavishly Yours', cursive;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-mono);
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
    }

    body {
      background: var(--bg);
      color: var(--text);
      line-height: 1.8;
      font-size: 15px;
      font-family: var(--font-mono);
      overflow-x: clip;
      min-height: 100vh;
    }

    /* Accessibility: Visible keyboard focus */
    :focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }

    /* Container: Max width 1200px, 24px gutters */
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      position: relative;
      z-index: 10;
    }

    .text-center { text-align: center; }

    /* Brand Wordmark (Google Font "Lavishly Yours", regular weight, letter-spacing 0) */
    .brand-wordmark {
      font-family: var(--font-brand);
      font-weight: 400;
      letter-spacing: 0;
      font-size: 30px;
      line-height: 1;
      color: #FFFFFF;
      display: inline-block;
      user-select: none;
    }

    /* Section Heads Common */
    .sec-head {
      text-align: center;
      max-width: 820px;
      margin: 0 auto 32px;
    }
    .sec-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 14px;
      display: inline-block;
      font-weight: 500;
    }
    .sec-title {
      font-size: clamp(28px, 4.4vw, 56px);
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: #FFFFFF;
      margin-bottom: 16px;
    }
    .sec-lede {
      font-size: 15px;
      line-height: 1.8;
      color: var(--muted);
      max-width: 680px;
      margin: 0 auto;
    }

    .shimmer-text {
      color: var(--accent);
    }

    /* Pill Badges */
    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hair);
      color: var(--accent);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .glowing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
      flex-shrink: 0;
    }

    /* Pill Buttons (44px) */
    .pill-btn {
      height: 44px;
      padding: 0 24px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.25s var(--ease);
      text-decoration: none;
      white-space: nowrap;
    }
    .pill-btn.primary {
      background: var(--accent);
      color: #000000;
      border-color: var(--accent);
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .pill-btn.primary:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      transform: translateY(-2px);
      box-shadow: 0 0 32px rgba(175, 221, 255, 0.55);
    }
    .pill-btn.outline {
      background: transparent;
      border-color: var(--hair);
      color: #FFFFFF;
    }
    .pill-btn.outline:hover {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-wash);
      transform: translateY(-2px);
    }
    .pill-btn svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    /* Sparse Fixed Ambience Layer: ~18 twinkling stars & 4 drifting motes */
    .ambience-layer {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }
    .ambience-layer i.star {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: #FFFFFF;
      opacity: 0;
      animation: star-twinkle var(--d, 6s) ease-in-out var(--s, 0s) infinite;
    }
    @keyframes star-twinkle {
      0%, 100% { opacity: 0; }
      50% { opacity: var(--o, 0.65); }
    }
    .ambience-layer .mote {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      opacity: 0;
      animation: mote-rise var(--m-dur, 26s) linear var(--m-delay, 0s) infinite;
    }
    @keyframes mote-rise {
      0% { transform: translateY(105vh) translateX(0); opacity: 0; }
      20% { opacity: var(--m-op, 0.5); }
      80% { opacity: var(--m-op, 0.5); }
      100% { transform: translateY(-10vh) translateX(var(--m-drift, 20px)); opacity: 0; }
    }

    /* Breathing Horizon Glow */
    .horizon-glow {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 1200px;
      height: 200px;
      background: radial-gradient(ellipse 70% 85% at 50% 100%, rgba(175, 221, 255, 0.22), rgba(40, 95, 160, 0.08) 50%, transparent 80%);
      pointer-events: none;
      animation: horizon-breathe 8s ease-in-out infinite alternate;
      z-index: 2;
    }
    @keyframes horizon-breathe {
      0% { opacity: 0.55; transform: translateX(-50%) scaleY(0.9); }
      100% { opacity: 0.95; transform: translateX(-50%) scaleY(1.15); }
    }

    /* CARD LANGUAGE: 24px radius, 1px hairline border, faint glass fill with backdrop blur,
       thin accent edge line along top, soft ice-blue radial glow in corner, hover spotlight */
    .glass-card {
      position: relative;
      border-radius: 24px;
      border: 1px solid var(--hair);
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
      transition: border-color 0.25s var(--ease), transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
      --mx: 50%;
      --my: 50%;
    }
    .glass-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 12%;
      right: 12%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(175, 221, 255, 0.45), transparent);
      pointer-events: none;
      z-index: 3;
    }
    .glass-card::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(175, 221, 255, 0.06), transparent 70%);
      pointer-events: none;
      z-index: 1;
    }
    .card-spotlight {
      position: absolute;
      inset: 0;
      background: radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(175, 221, 255, 0.09), transparent 80%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      z-index: 2;
    }
    .glass-card:hover {
      border-color: rgba(175, 221, 255, 0.35);
      transform: translateY(-2px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
    }
    .glass-card:hover .card-spotlight {
      opacity: 1;
    }

    /* Progressive enhancement reveal animation */
    html.js-ready .reveal-section {
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
    }
    html.js-ready .reveal-section.revealed {
      opacity: 1;
      transform: translateY(0);
    }

    /* ==========================================================================
       TOP FLOATING NAV PILL (Sticky, Blurred Dark, Hairline Border, 999px Radius)
       ========================================================================== */
    .nav-floating-wrap {
      position: sticky;
      top: 18px;
      z-index: 900;
      display: flex;
      justify-content: center;
      padding: 0 16px;
      pointer-events: none;
      width: 100%;
    }
    .nav-pill {
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 28px;
      background: rgba(2, 4, 7, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--hair);
      border-radius: 999px;
      padding: 8px 12px 8px 20px;
      max-width: 920px;
      width: 100%;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(175, 221, 255, 0.06);
    }
    .nav-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #FFFFFF;
      flex-shrink: 0;
    }
    .nav-brand .brand-wordmark {
      font-size: 30px;
      padding-top: 2px;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .nav-link {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 999px;
      transition: color 0.2s ease, background 0.2s ease;
      white-space: nowrap;
    }
    .nav-link:hover {
      color: #FFFFFF;
    }
    .nav-link.active {
      color: var(--accent);
      background: var(--accent-wash);
    }
    .nav-download-pill {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 18px;
      border-radius: 999px;
      border: 1px solid var(--accent);
      background: var(--accent);
      color: #000000;
      cursor: pointer;
      transition: all 0.2s var(--ease);
      flex-shrink: 0;
      box-shadow: 0 0 14px rgba(175, 221, 255, 0.35);
    }
    .nav-download-pill:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 0 22px rgba(175, 221, 255, 0.55);
    }

    /* ==========================================================================
       SECTION 1: HERO (Centred, min-height 100vh, Rhythm Wave, Ambient Video)
       ========================================================================== */
    .hero-section {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0 60px;
      text-align: center;
      overflow: hidden; /* Clips horizon glow from leaking */
    }
    .hero-ambient-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.40;
      pointer-events: none;
      mask-image: linear-gradient(180deg, black 30%, transparent 95%);
      -webkit-mask-image: linear-gradient(180deg, black 30%, transparent 95%);
      z-index: 1;
    }
    .hero-content {
      max-width: 860px;
      margin: 0 auto;
      position: relative;
      z-index: 5;
    }
    .hero-title {
      font-size: clamp(34px, 5.8vw, 76px);
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1.12;
      color: #FFFFFF;
      margin: 20px auto 20px;
      max-width: 16ch;
    }
    .hero-desc {
      font-size: 15px;
      line-height: 1.75;
      color: var(--muted);
      max-width: 660px;
      margin: 0 auto 32px;
    }
    .hero-cta-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    /* Hero Reassurance Pill */
    .hero-reassurance-pill {
      display: inline-flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 60ch;
      margin: 8px auto 18px;
      padding: 10px 18px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--hair);
      color: var(--muted);
      font-size: 11.5px;
      line-height: 1.55;
      letter-spacing: 0.02em;
      text-align: left;
    }
    .hero-reassurance-pill .glowing-dot {
      margin-top: 5px;
    }

    .hero-meta {
      font-size: 11px;
      color: var(--faint);
      letter-spacing: 0.08em;
      margin-bottom: 0;
    }

    /* Closing CTA faint line */
    .close-faint-line {
      font-size: 11px;
      color: var(--faint);
      letter-spacing: 0.08em;
      margin-top: 14px;
      margin-bottom: 0;
    }

    /* ==========================================================================
       MARQUEE STRIP (Between Hero & Section 2)
       ========================================================================== */
    .marquee-strip {
      overflow: hidden;
      position: relative;
      width: 100%;
      border-top: 1px solid var(--hair);
      border-bottom: 1px solid var(--hair);
      padding: 16px 0;
      background: rgba(2, 4, 7, 0.6);
      z-index: 5;
    }
    .marquee-track {
      display: flex;
      width: max-content;
      animation: marquee-scroll 12s linear infinite;
    }
    .marquee-content {
      display: flex;
      align-items: center;
      gap: 28px;
      padding-right: 28px;
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--faint);
      white-space: nowrap;
    }
    @keyframes marquee-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* ==========================================================================
       SECTION 2: WHY REVIVE (id="premise") — BENTO GRID OF 3 GLASS CARDS
       ========================================================================== */
    .sec-premise {
      padding: 60px 0 50px;
      position: relative;
    }
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    .bento-card-1 {
      grid-column: span 4;
      grid-row: span 2;
      min-height: 380px;
      padding: 38px 36px 36px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      position: relative;
    }
    .bento-card-2, .bento-card-3 {
      grid-column: span 2;
      min-height: 180px;
      padding: 28px 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-num-label {
      font-size: 10px;
      letter-spacing: 0.14em;
      color: var(--accent);
      font-weight: 500;
      margin-bottom: 12px;
      display: block;
    }
    .card-lead-text {
      color: #FFFFFF;
      font-weight: 500;
      letter-spacing: -0.02em;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    .card-lead-text.lg {
      font-size: clamp(24px, 3vw, 38px);
    }
    .card-lead-text.md {
      font-size: 18px;
    }
    .card-muted-text {
      font-size: 14px;
      line-height: 1.7;
      color: var(--muted);
    }

    /* Concentric rings top-right in Card 1 */
    .concentric-rings {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 220px;
      height: 220px;
      pointer-events: none;
      z-index: 1;
    }
    .c-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(175, 221, 255, 0.14);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: ring-pulse 7s ease-in-out infinite alternate;
    }
    .c-ring.r1 { width: 80px; height: 80px; animation-delay: 0s; }
    .c-ring.r2 { width: 140px; height: 140px; animation-delay: 1.5s; }
    .c-ring.r3 { width: 200px; height: 200px; animation-delay: 3s; }
    @keyframes ring-pulse {
      0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.35; border-color: rgba(175, 221, 255, 0.1); }
      100% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.85; border-color: rgba(175, 221, 255, 0.3); }
    }

    /* ==========================================================================
       SECTION 3: WHAT REVIVE STANDS FOR (id="principles") — 2x2 KEYWORD CARDS
       ========================================================================== */
    .sec-principles {
      padding: 50px 0;
      position: relative;
    }
    .principles-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    .principle-card {
      min-height: 220px;
      padding: 34px 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .keyword-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }
    .keyword-word {
      font-size: clamp(30px, 5vw, 60px);
      font-weight: 500;
      letter-spacing: -0.05em;
      line-height: 1;
      color: #FFFFFF;
      transition: color 0.3s ease, text-shadow 0.3s ease;
    }
    .glass-card:hover .keyword-word {
      color: var(--accent);
      text-shadow: 0 0 24px rgba(175, 221, 255, 0.4);
    }
    .keyword-glow-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
      animation: dot-pulse 3s ease-in-out infinite alternate;
      flex-shrink: 0;
    }
    @keyframes dot-pulse {
      0% { opacity: 0.4; transform: scale(0.85); box-shadow: 0 0 5px var(--accent); }
      100% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 14px var(--accent); }
    }
    .principle-muted {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.7;
    }

    /* ==========================================================================
       SECTION 4: REVIVE IN ACTION (id="demo") — 3 INTERACTIVE TABS & PANEL
       ========================================================================== */
    .sec-demo {
      padding: 50px 0;
      position: relative;
    }

    /* Centered Segmented Pill Tabs */
    .demo-tabs-wrap {
      display: flex;
      justify-content: center;
      margin: 0 auto 32px;
    }
    .demo-tabs-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hair);
      border-radius: 999px;
      padding: 4px;
      gap: 4px;
    }
    .demo-tab-btn {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 20px;
      border-radius: 999px;
      border: 1px solid transparent;
      color: var(--muted);
      background: none;
      cursor: pointer;
      transition: all 0.2s var(--ease);
      white-space: nowrap;
    }
    .demo-tab-btn:hover {
      color: #FFFFFF;
      background: rgba(255, 255, 255, 0.04);
    }
    .demo-tab-btn.active {
      color: var(--accent);
      background: var(--accent-wash);
      border-color: var(--accent-line);
      box-shadow: 0 0 14px rgba(175, 221, 255, 0.18);
    }

    /* Big Rounded 28px Panel (Min-height 560px, Faint Blue Glow, 1px Edge Line) */
    .demo-panel {
      position: relative;
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      border-radius: 28px;
      border: 1px solid var(--hair);
      background: var(--surface);
      min-height: 560px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 50px 32px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(40, 95, 160, 0.15);
    }
    .demo-panel::before {
      content: "";
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(175, 221, 255, 0.5), transparent);
      z-index: 3;
    }
    .demo-panel::after {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 180px;
      background: radial-gradient(ellipse 60% 80% at 50% 0%, rgba(175, 221, 255, 0.12), transparent 75%);
      pointer-events: none;
      z-index: 1;
    }
    .demo-panel-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.22;
      pointer-events: none;
      z-index: 1;
    }
    .demo-tab-view {
      display: none;
      width: 100%;
      position: relative;
      z-index: 5;
    }
    .demo-tab-view.active {
      display: block;
    }

    /* Tab 1: Breathing View */
    .breath-view-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 520px;
      margin: 0 auto;
    }
    .breath-live-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      letter-spacing: 0.16em;
      color: var(--accent);
      border: 1px solid var(--accent-line);
      background: var(--accent-wash);
      padding: 3px 12px;
      border-radius: 999px;
      margin-bottom: 8px;
    }
    .breath-sublabel {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .breath-ring-stage {
      position: relative;
      width: 230px;
      height: 230px;
      margin: 10px 0 16px;
      display: grid;
      place-items: center;
    }
    .breath-svg {
      position: absolute;
      inset: 0;
      width: 230px;
      height: 230px;
      transform: rotate(-90deg);
      pointer-events: none;
    }
    .breath-svg-track {
      stroke: rgba(255, 255, 255, 0.08);
    }
    .breath-svg-progress {
      stroke: var(--accent);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.25s linear;
      filter: drop-shadow(0 0 6px var(--accent));
    }
    .breath-inner-circle {
      width: 130px;
      height: 130px;
      border-radius: 50%;
      background: radial-gradient(circle, #F2FAFF 0%, var(--accent) 32%, rgba(175, 221, 255, 0.18) 70%, transparent 80%);
      box-shadow: 0 0 32px rgba(175, 221, 255, 0.45);
      display: grid;
      place-items: center;
      transform: scale(1);
      transition: transform 0.8s var(--ease);
      cursor: pointer;
    }
    .breath-sec-num {
      font-size: 38px;
      font-weight: 500;
      color: #000000;
      line-height: 1;
    }
    .breath-phase-word {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 6px;
    }
    .breath-hint-line {
      font-size: 13px;
      color: var(--muted);
      min-height: 22px;
      margin-bottom: 16px;
    }
    .breath-phase-dots {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 22px;
    }
    .phase-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
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
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid var(--hair);
      background: rgba(255, 255, 255, 0.03);
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .pattern-chip:hover {
      color: #FFFFFF;
      border-color: rgba(255, 255, 255, 0.25);
    }
    .pattern-chip.active {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--accent-wash);
    }

    /* Tab 2: Focus Setup View (THREE Counters Side by Side) */
    .focus-setup-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 680px;
      margin: 0 auto;
      text-align: center;
      width: 100%;
    }
    .counters-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      width: 100%;
      margin-bottom: 28px;
    }
    .counter-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--hair);
      border-radius: 18px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .counter-label {
      font-size: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 10px;
    }
    .counter-control-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .counter-round-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hair);
      color: #FFFFFF;
      font-family: var(--font-mono);
      font-size: 15px;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.15s;
    }
    .counter-round-btn:hover {
      background: var(--accent-wash);
      border-color: var(--accent);
      color: var(--accent);
      transform: scale(1.05);
    }
    .counter-num-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;
    }
    .counter-val {
      font-size: 32px;
      font-weight: 500;
      color: var(--accent);
      line-height: 1;
      text-shadow: 0 0 12px rgba(175, 221, 255, 0.45);
    }
    .counter-unit {
      font-size: 9px;
      letter-spacing: 0.1em;
      color: var(--muted);
      text-transform: uppercase;
      margin-top: 4px;
    }
    .counter-caption {
      font-size: 11px;
      color: var(--muted);
      line-height: 1.4;
    }

    /* Proportional Bar of All Rounds */
    .cycle-bar-wrap {
      width: 100%;
      margin-bottom: 12px;
    }
    .cycle-bar {
      height: 10px;
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
      gap: 20px;
      font-size: 11px;
      color: var(--muted);
      margin-top: 10px;
    }
    .cycle-key-item {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .cycle-key-box {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
    .focus-summary-line {
      font-size: 13px;
      color: var(--accent);
      margin-top: 14px;
      font-weight: 500;
    }

    /* Tab 3: Custom Activities View */
    .custom-act-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 580px;
      margin: 0 auto;
      width: 100%;
    }
    .custom-chips-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .custom-type-chip {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 999px;
      border: 1px solid var(--hair);
      background: rgba(255, 255, 255, 0.03);
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
      align-items: center;
      gap: 10px;
      width: 100%;
      margin-bottom: 16px;
    }
    .custom-input-text {
      flex: 1;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hair);
      border-radius: 999px;
      padding: 10px 18px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #FFFFFF;
      outline: none;
      transition: border-color 0.2s;
    }
    .custom-input-text:focus {
      border-color: var(--accent);
    }
    .custom-input-mins {
      width: 80px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--hair);
      border-radius: 999px;
      padding: 10px 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: #FFFFFF;
      text-align: center;
      outline: none;
    }
    .custom-badge-endit {
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(175, 221, 255, 0.06);
      border: 1px solid var(--accent-line);
      color: var(--accent);
      font-size: 11px;
      white-space: nowrap;
      display: none;
    }
    .custom-add-pill {
      padding: 10px 20px;
      border-radius: 999px;
      background: var(--accent);
      color: #000000;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 0;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      box-shadow: 0 0 14px rgba(175, 221, 255, 0.3);
    }
    .custom-add-pill:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
    .custom-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      margin-top: 6px;
      max-height: 170px;
      overflow-y: auto;
    }
    .custom-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border: 1px solid var(--hair);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
      font-size: 12px;
      color: #FFFFFF;
      transition: opacity 0.3s;
    }
    .custom-del-btn {
      background: none;
      border: 0;
      color: var(--muted);
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
      transition: color 0.2s;
    }
    .custom-del-btn:hover {
      color: #FFFFFF;
    }
    .custom-empty {
      padding: 16px;
      border: 1px dashed var(--hair);
      border-radius: 12px;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
    }
    .routine-total-line {
      font-size: 12px;
      color: var(--accent);
      margin-top: 16px;
      font-weight: 500;
    }

    /* Optional Wide 16:9 Demo */
    .wide-demo-wrap {
      width: 100%;
      max-width: 900px;
      margin: 40px auto 0;
      aspect-ratio: 16/9;
      border-radius: 20px;
      border: 1px solid var(--hair);
      overflow: hidden;
      background: #000000;
    }
    .wide-demo-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ==========================================================================
       SECTION 5: WAYS TO RECOVER (id="ways") — 2x2 GRID OF GLASS CARDS
       ========================================================================== */
    .sec-ways {
      padding: 50px 0;
      position: relative;
    }
    .ways-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 24px;
    }
    .way-card {
      min-height: 250px;
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .way-icon-tile {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: rgba(175, 221, 255, 0.06);
      border: 1px solid rgba(175, 221, 255, 0.22);
      display: grid;
      place-items: center;
      margin-bottom: 18px;
      color: var(--accent);
      box-shadow: 0 0 14px rgba(175, 221, 255, 0.15);
    }
    .way-icon-tile svg {
      width: 22px;
      height: 22px;
    }
    .way-title {
      font-size: clamp(22px, 2.6vw, 30px);
      font-weight: 500;
      color: #FFFFFF;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .way-desc {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.65;
      margin-bottom: 22px;
    }
    .way-tag {
      display: inline-block;
      align-self: flex-start;
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid var(--hair);
      color: var(--accent);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(175, 221, 255, 0.04);
      font-weight: 500;
    }

    /* Small Toasts Nudge Strip */
    .nudges-strip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 24px;
      border-radius: 999px;
      border: 1px solid var(--hair);
      background: rgba(255, 255, 255, 0.02);
      margin-top: 24px;
      font-size: 12px;
      color: var(--muted);
      flex-wrap: wrap;
    }
    .nudges-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      flex-shrink: 0;
    }

    /* ==========================================================================
       SECTION 6: CLOSE CTA (Big Glass CTA Panel, 36px Radius)
       ========================================================================== */
    .sec-close {
      padding: 50px 0 70px;
      position: relative;
    }
    .close-cta-panel {
      position: relative;
      max-width: 980px;
      margin: 0 auto;
      border-radius: 36px;
      border: 1px solid var(--hair);
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 64px 32px;
      text-align: center;
      overflow: hidden;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.7);
    }
    .close-cta-panel::before {
      content: "";
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(175, 221, 255, 0.4), transparent);
    }
    .close-title {
      font-size: clamp(28px, 4.4vw, 56px);
      font-weight: 500;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: #FFFFFF;
      max-width: 18ch;
      margin: 18px auto 26px;
    }

    /* ==========================================================================
       SECTION 7: COMPACT SPLASH SCREEN FOOTER (KEEP EXACT & AS LAST ELEMENT)
       ========================================================================== */
    .splash-footer-wrap {
      position: relative;
      width: 100%;
      height: 360px;
      overflow: hidden;
      border-top: none;
      background: radial-gradient(ellipse 45% 38% at 50% 50%, rgba(40, 95, 160, 0.22), transparent 70%);
      cursor: default;
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
      border: 1px solid rgba(255, 255, 255, 0.14);
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
    .modal-close:hover { color: #FFFFFF; border-color: var(--accent); }
    .modal-brand-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .modal-brand-header .brand-wordmark {
      font-size: 30px;
    }
    .modal-os-tabs {
      display: flex;
      gap: 8px;
      margin: 14px 0 18px;
    }
    .modal-tab-btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.14);
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
       RESPONSIVENESS (Down to 400px with ZERO Horizontal Scroll)
       ========================================================================== */
    @media (max-width: 900px) {
      .bento-grid {
        grid-template-columns: 1fr;
      }
      .bento-card-1 {
        grid-column: span 1;
        grid-row: span 1;
        min-height: auto;
      }
      .bento-card-2, .bento-card-3 {
        grid-column: span 1;
        min-height: auto;
      }
      .counters-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      .nav-pill {
        padding: 6px 14px;
      }
      .hero-section {
        padding-top: 100px;
      }
      .principles-grid {
        grid-template-columns: 1fr;
      }
      .ways-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 580px) {
      .container {
        padding: 0 16px;
      }
      .hero-cta-row {
        flex-direction: column;
        width: 100%;
      }
      .pill-btn {
        width: 100%;
        justify-content: center;
      }
      .demo-tabs-pill {
        width: 100%;
        justify-content: center;
      }
      .demo-tab-btn {
        font-size: 9.5px;
        padding: 6px 10px;
      }
      .custom-input-row {
        flex-direction: column;
      }
      .custom-input-mins {
        width: 100%;
      }
      .custom-add-pill {
        width: 100%;
      }
      .close-cta-panel {
        padding: 60px 20px;
      }
    }

    /* Respect Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      .ambience-layer { display: none !important; }
      .marquee-track { animation: none !important; }
      .horizon-glow { animation: none !important; opacity: 0.75 !important; }
      html.js-ready .reveal-section {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Sparse Fixed Ambience Layer: ~18 faint twinkling stars and 4 slow drifting motes -->
  <div class="ambience-layer" id="ambience-layer" aria-hidden="true">
    <div id="stars-wrap"></div>
    <div id="motes-wrap"></div>
  </div>

  <!-- ========================================================================
       TOP FLOATING NAV PILL
       ======================================================================== -->
  <header class="nav-floating-wrap">
    <nav class="nav-pill" aria-label="Main Navigation">
      <a href="#hero" class="nav-brand" aria-label="Revive Home">
        <span class="glowing-dot"></span>
        <span class="brand-wordmark">Revive</span>
      </a>

      <div class="nav-links">
        <a href="#premise" class="nav-link">Why Revive</a>
        <a href="#principles" class="nav-link">Principles</a>
        <a href="#demo" class="nav-link">Revive in Action</a>
        <a href="#ways" class="nav-link">Ways to recover</a>
      </div>

      <button type="button" class="nav-download-pill" onclick="openDownloadModal('win')">
        Download
      </button>
    </nav>
  </header>

  <!-- ========================================================================
       1) HERO SECTION
       ======================================================================== -->
  <section class="hero-section" id="hero">
    <!-- Cinematic background ambient video slot (removed gracefully if missing) -->
    <video class="hero-ambient-video" muted loop playsinline autoplay preload="auto" src="assets/ambient-drift.mp4" onerror="this.remove()"></video>

    <!-- Breathing horizon glow at bottom edge (clipped inside hero) -->
    <div class="horizon-glow"></div>

    <div class="container hero-content">
      <div class="pill-badge" style="margin-bottom: 24px;">
        <span class="glowing-dot"></span>
        <span>Sustainable flow · Windows & macOS</span>
      </div>

      <h1 class="hero-title">
        Sustainable flow<br />
        starts with <span class="shimmer-text">recovery.</span>
      </h1>

      <p class="hero-desc">
        Revive is a desktop app for people who do deep work and struggle to stop. You start a session, and when your focus time ends, Revive opens a few minutes of guided recovery on your screen, then hands you back to your work. Do that every day and your focus becomes something you can sustain.
      </p>

      <div class="hero-cta-row">
        <button type="button" class="pill-btn primary" onclick="openDownloadModal('win')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
          </svg>
          Download for Windows (.exe)
        </button>

        <button type="button" class="pill-btn outline" onclick="openDownloadModal('mac')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.73-.85.03-1.89.57-2.5 1.28-.54.63-.99 1.65-.87 2.64.95.07 1.91-.47 2.49-1.19z"/>
          </svg>
          Download for macOS (.dmg)
        </button>
      </div>

      <!-- <div class="hero-reassurance-pill">
        <span class="glowing-dot"></span>
        <span>You are in control. Revive never takes over your screen on its own. Installing or opening the app does nothing: the screen takeover happens only in a session you choose to start.</span>
      </div> -->

      <div class="hero-meta">
        Windows 10 / 11 (64-bit) · macOS 12+ (Universal)
      </div>
    </div>
  </section>

  <!-- Marquee strip between Hero and Section 2 -->
  <div class="marquee-strip" aria-hidden="true">
    <div class="marquee-track">
      <div class="marquee-content">
        <span>Sustainable</span>
        <span>·</span>
        <span>Restorative</span>
        <span>·</span>
        <span>Rhythmic</span>
        <span>·</span>
        <span>Gentle</span>
        <span>·</span>
        <span>Recovery is part of the work</span>
        <span>·</span>
      </div>
      <div class="marquee-content">
        <span>Sustainable</span>
        <span>·</span>
        <span>Restorative</span>
        <span>·</span>
        <span>Rhythmic</span>
        <span>·</span>
        <span>Gentle</span>
        <span>·</span>
        <span>Recovery is part of the work</span>
        <span>·</span>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       2) WHY REVIVE (id="premise")
       ======================================================================== -->
  <section class="sec-premise reveal-section" id="premise">
    <div class="container">
      <div class="sec-head">
        <span class="sec-label">Why I built Revive</span>
        <h2 class="sec-title">
          Flow is not the hard part.<br />
          Staying in it, day after day, <span class="shimmer-text">is.</span>
        </h2>
      </div>

      <div class="bento-grid">
        <!-- Card 1: Spans 4 cols, 2 rows, with concentric rings -->
        <div class="glass-card bento-card-1">
          <div class="card-spotlight"></div>
          <div class="concentric-rings" aria-hidden="true">
            <span class="c-ring r1"></span>
            <span class="c-ring r2"></span>
            <span class="c-ring r3"></span>
          </div>
          <div>
            <span class="card-num-label">01</span>
            <h3 class="card-lead-text lg">Focus spends something real.</h3>
            <p class="card-muted-text">
              Deep work uses attention, patience and energy. Most of us know we should stop, and still keep going, because the work is right there and stopping feels like losing ground.
            </p>
          </div>
        </div>

        <!-- Card 2: Spans 2 cols -->
        <div class="glass-card bento-card-2">
          <div class="card-spotlight"></div>
          <div>
            <span class="card-num-label">02</span>
            <h3 class="card-lead-text md">Sustainable productivity is a rhythm.</h3>
          </div>
          <p class="card-muted-text">
            It is not a longer sprint. It is effort, then recovery, then effort again, a loop you can repeat tomorrow and the day after.
          </p>
        </div>

        <!-- Card 3: Spans 2 cols -->
        <div class="glass-card bento-card-3">
          <div class="card-spotlight"></div>
          <div>
            <span class="card-num-label">03</span>
            <h3 class="card-lead-text md">Recovery needs protecting.</h3>
          </div>
          <p class="card-muted-text">
            So Revive looks after it for you. In a session you start, it moves you into rest when your focus time ends, so you do not have to remember to stop or argue yourself into it.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       3) WHAT REVIVE STANDS FOR (id="principles")
       ======================================================================== -->
  <section class="sec-principles reveal-section" id="principles">
    <div class="container">
      <div class="sec-head">
        <span class="sec-label">What Revive stands for</span>
        <h2 class="sec-title">
          Four ideas the whole app is <span class="shimmer-text">built around.</span>
        </h2>
      </div>

      <div class="principles-grid">
        <!-- Keyword 1: Sustainable -->
        <div class="glass-card principle-card">
          <div class="card-spotlight"></div>
          <div class="keyword-top">
            <span class="keyword-word">Sustainable</span>
            <span class="keyword-glow-dot"></span>
          </div>
          <p class="principle-muted">Focus you can repeat tomorrow, not only today.</p>
        </div>

        <!-- Keyword 2: Restorative -->
        <div class="glass-card principle-card">
          <div class="card-spotlight"></div>
          <div class="keyword-top">
            <span class="keyword-word">Restorative</span>
            <span class="keyword-glow-dot"></span>
          </div>
          <p class="principle-muted">Rest that refills you, taken on purpose.</p>
        </div>

        <!-- Keyword 3: Rhythmic -->
        <div class="glass-card principle-card">
          <div class="card-spotlight"></div>
          <div class="keyword-top">
            <span class="keyword-word">Rhythmic</span>
            <span class="keyword-glow-dot"></span>
          </div>
          <p class="principle-muted">Focus and recovery in a steady cycle that you set.</p>
        </div>

        <!-- Keyword 4: Gentle -->
        <div class="glass-card principle-card">
          <div class="card-spotlight"></div>
          <div class="keyword-top">
            <span class="keyword-word">Gentle</span>
            <span class="keyword-glow-dot"></span>
          </div>
          <p class="principle-muted">Your screen eases into rest. No streaks, no scores, no grind.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       4) REVIVE IN ACTION (id="demo")
       ======================================================================== -->
  <section class="sec-demo reveal-section" id="demo">
    <div class="container">
      <div class="sec-head">
        <span class="sec-label">Interactive preview</span>
        <h2 class="sec-title">Revive in <span class="shimmer-text">Action</span></h2>
        <p class="sec-lede">Test the breathing guidance, configure your sprint intervals, and build your custom active rest routines.</p>
      </div>

      <!-- Segmented Pill Tabs Centered Under Lede -->
      <div class="demo-tabs-wrap">
        <div class="demo-tabs-pill" role="tablist">
          <button class="demo-tab-btn active" id="tab-btn-breathing" role="tab" onclick="switchDemoTab('breathing')">Breathing</button>
          <button class="demo-tab-btn" id="tab-btn-focus" role="tab" onclick="switchDemoTab('focus')">Focus Setup</button>
          <button class="demo-tab-btn" id="tab-btn-custom" role="tab" onclick="switchDemoTab('custom')">Custom Activities</button>
        </div>
      </div>

      <!-- Big 28px Rounded Panel -->
      <div class="demo-panel">
        <!-- Video slot behind panel content -->
        <video class="demo-panel-video" muted loop playsinline autoplay preload="auto" src="assets/rest-breath.mp4" onerror="this.remove()"></video>

        <!-- TAB 1: BREATHING -->
        <div class="demo-tab-view active" id="demo-view-breathing">
          <div class="breath-view-col">
            <div class="breath-live-pill">
              <span class="glowing-dot" style="width:5px;height:5px;"></span>
              <span>LIVE</span>
            </div>
            <div class="breath-sublabel">Guided Diaphragmatic Breath</div>

            <!-- 230px Ring with Thin Progress Arc + Swelling/Shrinking Inner Circle -->
            <div class="breath-ring-stage">
              <svg class="breath-svg" viewBox="0 0 230 230">
                <circle class="breath-svg-track" cx="115" cy="115" r="108" fill="none" stroke-width="2" />
                <circle class="breath-svg-progress" id="breath-arc" cx="115" cy="115" r="108" fill="none" stroke-width="2.5" stroke-dasharray="679" stroke-dashoffset="679" />
              </svg>

              <div class="breath-inner-circle" id="breath-orb" title="Click to cycle breath phase" onclick="advanceBreathPhase()">
                <span class="breath-sec-num" id="breath-sec">4</span>
              </div>
            </div>

            <div class="breath-phase-word" id="breath-phase">INHALE</div>
            <p class="breath-hint-line" id="breath-cue">Expand diaphragm slowly · Rest your eyes</p>

            <div class="breath-phase-dots" id="breath-phase-dots"></div>

            <div class="breath-chips">
              <button type="button" class="pattern-chip active" id="chip-box" onclick="selectBreathPattern('box')">Box 4·4·4·4</button>
              <button type="button" class="pattern-chip" id="chip-478" onclick="selectBreathPattern('478')">4-7-8</button>
              <button type="button" class="pattern-chip" id="chip-coherence" onclick="selectBreathPattern('coherence')">Coherence 5·5</button>
            </div>
          </div>
        </div>

        <!-- TAB 2: FOCUS SETUP -->
        <div class="demo-tab-view" id="demo-view-focus">
          <div class="focus-setup-col">
            <div class="counters-grid">
              <!-- Counter 1: Focus Interval -->
              <div class="counter-card">
                <span class="counter-label">Focus Interval</span>
                <div class="counter-control-box">
                  <button type="button" class="counter-round-btn" onclick="stepFocus(-5)">−</button>
                  <div class="counter-num-wrap">
                    <span class="counter-val" id="val-focus">25</span>
                    <span class="counter-unit">MINS</span>
                  </div>
                  <button type="button" class="counter-round-btn" onclick="stepFocus(5)">+</button>
                </div>
                <p class="counter-caption">Deep, quiet concentration</p>
              </div>

              <!-- Counter 2: Active Rest -->
              <div class="counter-card">
                <span class="counter-label">Active Rest</span>
                <div class="counter-control-box">
                  <button type="button" class="counter-round-btn" onclick="stepRest(-1)">−</button>
                  <div class="counter-num-wrap">
                    <span class="counter-val" id="val-rest">5</span>
                    <span class="counter-unit">MINS</span>
                  </div>
                  <button type="button" class="counter-round-btn" onclick="stepRest(1)">+</button>
                </div>
                <p class="counter-caption">Gentle screen pause</p>
              </div>

              <!-- Counter 3: Rounds -->
              <div class="counter-card">
                <span class="counter-label">Rounds</span>
                <div class="counter-control-box">
                  <button type="button" class="counter-round-btn" onclick="stepRounds(-1)">−</button>
                  <div class="counter-num-wrap">
                    <span class="counter-val" id="val-rounds">4</span>
                    <span class="counter-unit">ROUNDS</span>
                  </div>
                  <button type="button" class="counter-round-btn" onclick="stepRounds(1)">+</button>
                </div>
                <p class="counter-caption">Focus and rest, repeated</p>
              </div>
            </div>

            <!-- Proportional Bar of All Rounds -->
            <div class="cycle-bar-wrap">
              <div class="cycle-bar" id="cycle-bar-segments"></div>
              <div class="cycle-key">
                <div class="cycle-key-item">
                  <span class="cycle-key-box" style="background:rgba(255,255,255,0.22);"></span>
                  <span>Focus</span>
                </div>
                <div class="cycle-key-item">
                  <span class="cycle-key-box" style="background:var(--accent);"></span>
                  <span>Rest</span>
                </div>
              </div>
            </div>

            <p class="focus-summary-line" id="val-summary">
              You'll have 4 rests · about 2h 00m
            </p>
          </div>
        </div>

        <!-- TAB 3: CUSTOM ACTIVITIES -->
        <div class="demo-tab-view" id="demo-view-custom">
          <div class="custom-act-col">
            <span class="sec-label" style="margin-bottom: 12px; color: var(--accent);">Create custom rest routine</span>

            <div class="custom-chips-row">
              <button type="button" class="custom-type-chip active" onclick="selectActChip(this, 'Breathing')">Breathing</button>
              <button type="button" class="custom-type-chip" onclick="selectActChip(this, 'Stretch')">Stretch</button>
              <button type="button" class="custom-type-chip" onclick="selectActChip(this, 'Video')">Video</button>
              <button type="button" class="custom-type-chip" onclick="selectActChip(this, 'Sound')">Sound</button>
            </div>

            <div class="custom-input-row">
              <input type="text" id="custom-act-name" class="custom-input-text" placeholder="Activity name..." />
              <input type="number" id="custom-act-mins" class="custom-input-mins" value="5" min="1" max="60" />
              <span id="custom-badge-endit" class="custom-badge-endit">You end it</span>
              <button type="button" class="custom-add-pill" onclick="addCustomActivity()">+ Add to routine</button>
            </div>

            <div class="custom-list" id="custom-list">
              <div class="custom-row" data-type="Breathing" data-mins="5">
                <span>Box Breathing (Breathing) · 5 mins</span>
                <button type="button" class="custom-del-btn" onclick="removeCustomItem(this)" title="Remove">✕</button>
              </div>
              <div class="custom-row" data-type="Stretch" data-mins="5">
                <span>Spinal Decompression & Walk (Stretch) · 5 mins</span>
                <button type="button" class="custom-del-btn" onclick="removeCustomItem(this)" title="Remove">✕</button>
              </div>
            </div>

            <div class="routine-total-line" id="routine-total-line">
              Timed: 10 mins · 2 activities
            </div>
          </div>
        </div>

      </div>

      <!-- Optional Wide 16:9 Demo Video (Hidden until loadeddata fires) -->
      <div class="wide-demo-wrap" id="wide-demo-wrap" style="display:none;">
        <video class="wide-demo-video" muted loop playsinline autoplay preload="auto" src="assets/demo.mp4" onloadeddata="document.getElementById('wide-demo-wrap').style.display='block'" onerror="document.getElementById('wide-demo-wrap').remove()"></video>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       5) WAYS TO RECOVER (id="ways")
       ======================================================================== -->
  <section class="sec-ways reveal-section" id="ways">
    <div class="container text-center">
      <div class="sec-head">
        <span class="sec-label">What recovery looks like</span>
        <h2 class="sec-title">
          A few ways to <span class="shimmer-text">actually switch off.</span>
        </h2>
        <p class="sec-lede">
          Choose a default, or pick a different one for each rest. Build your own breathing pattern if the presets do not suit you.
        </p>
      </div>

      <div class="ways-grid" style="text-align: left;">
        <!-- Card 1: Breathing (2 concentric circles) -->
        <div class="glass-card way-card">
          <div class="card-spotlight"></div>
          <div>
            <div class="way-icon-tile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.5" />
              </svg>
            </div>
            <h3 class="way-title">Breathing</h3>
            <p class="way-desc">Box, 4-7-8 or coherence, or build a pattern with your own phases and seconds.</p>
          </div>
          <span class="way-tag">Ends on the timer</span>
        </div>

        <!-- Card 2: Stretch (Stick figure) -->
        <div class="glass-card way-card">
          <div class="card-spotlight"></div>
          <div>
            <div class="way-icon-tile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v8" />
                <path d="M7 11l5-2 5 2" />
                <path d="M9 19l3-4 3 4" />
              </svg>
            </div>
            <h3 class="way-title">Stretch</h3>
            <p class="way-desc">Neck, shoulders and spine, one step at a time with a countdown.</p>
          </div>
          <span class="way-tag">Ends on the timer</span>
        </div>

        <!-- Card 3: A video you pick (Play button in rounded rect) -->
        <div class="glass-card way-card">
          <div class="card-spotlight"></div>
          <div>
            <div class="way-icon-tile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="4" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
            </div>
            <h3 class="way-title">A video you pick</h3>
            <p class="way-desc">Paste a link to a dance, a workout, or something that makes you laugh.</p>
          </div>
          <span class="way-tag">You end it</span>
        </div>

        <!-- Card 4: Sound (Vertical bars) -->
        <div class="glass-card way-card">
          <div class="card-spotlight"></div>
          <div>
            <div class="way-icon-tile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <line x1="4" y1="9" x2="4" y2="15" />
                <line x1="8" y1="5" x2="8" y2="19" />
                <line x1="12" y1="7" x2="12" y2="17" />
                <line x1="16" y1="4" x2="16" y2="20" />
                <line x1="20" y1="10" x2="20" y2="14" />
              </svg>
            </div>
            <h3 class="way-title">Sound</h3>
            <p class="way-desc">Your own audio files, or built-in ambient sounds like rain and white noise.</p>
          </div>
          <span class="way-tag">You end it</span>
        </div>
      </div>

      <!-- Eye-break and Drink-water nudges strip -->
      <div class="nudges-strip">
        <span class="nudges-dot"></span>
        <span>Eye-break and drink-water nudges run on their own timers as small toasts. Never full screen.</span>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       6) CLOSE CTA PANEL (36px radius, horizon glow, generous padding)
       ======================================================================== -->
  <section class="sec-close reveal-section" id="close">
    <div class="container">
      <div class="close-cta-panel">
        <div class="horizon-glow"></div>

        <div style="position:relative; z-index:5;">
          <div class="pill-badge" style="margin-bottom: 20px;">
            <span class="glowing-dot"></span>
            <span>Revive · Windows & macOS</span>
          </div>

          <h2 class="close-title">
            Sustainable flow is built one pause at a time.
          </h2>

          <div class="hero-cta-row">
            <button type="button" class="pill-btn primary" onclick="openDownloadModal('win')">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802"/>
              </svg>
              Download for Windows
            </button>

            <button type="button" class="pill-btn outline" onclick="openDownloadModal('mac')">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.73-.85.03-1.89.57-2.5 1.28-.54.63-.99 1.65-.87 2.64.95.07 1.91-.47 2.49-1.19z"/>
              </svg>
              Download for macOS
            </button>
          </div>

          <!-- <p class="close-faint-line">Nothing happens until you start a session.</p> -->
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       7) EXISTING FOOTER (EXACT AND LAST ELEMENT — "Recovery for Windows & macOS")
       ======================================================================== -->
  <footer class="splash-footer-wrap" id="splash-footer">
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
  </footer>

  <!-- Subfooter Bar -->
  <div class="site-subfooter">
    <div class="container site-subfooter-inner">
      <span style="font-size:11px;color:var(--faint);">© 2026 Revive. Recovery for Windows & macOS. Available for Windows & macOS.</span>
      <div style="display:flex;align-items:center;gap:14px;">
        <a href="#hero" class="nav-link">Top ↑</a>
        <button type="button" class="nav-download-pill" style="font-size:10px;padding:6px 14px;" onclick="openDownloadModal('win')">Get for Windows</button>
        <button type="button" class="nav-download-pill" style="font-size:10px;padding:6px 14px;" onclick="openDownloadModal('mac')">Get for Mac</button>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       DOWNLOAD MODAL (Windows & macOS)
       ======================================================================== -->
  <div class="modal-backdrop" id="download-modal" onclick="closeDownloadModal(event)">
    <div class="dl-modal" onclick="event.stopPropagation()">
      <button type="button" class="modal-close" onclick="closeDownloadModal()">✕</button>

      <div class="modal-brand-header">
        <span class="glowing-dot"></span>
        <span class="brand-wordmark">Revive</span>
      </div>

      <span class="sec-label" style="font-size:10px;color:var(--accent);">Download Revive v0.1.0</span>
      <h3 style="font-size:18px;font-weight:500;color:#fff;margin:6px 0 14px;">Choose Your Platform</h3>

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
          <button type="button" class="pill-btn primary" style="height:36px;padding:0 18px;font-size:11px;margin-top:10px;" onclick="triggerFileDownload('win')">
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
          <button type="button" class="pill-btn primary" style="height:36px;padding:0 18px;font-size:11px;margin-top:10px;" onclick="triggerFileDownload('mac')">
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
    <span class="glowing-dot"></span>
    <div>
      <b style="font-size:12px;color:#FFFFFF;display:block;" id="toast-filename">Revive-Setup-0.1.0.exe</b>
      <span style="font-size:11px;color:var(--muted);">Download started · Check your downloads folder</span>
    </div>
  </div>

  <!-- ========================================================================
       SCRIPTS
       ======================================================================== -->
  <script>
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Enable progressive enhancement class only when JS is running
    document.documentElement.classList.add('js-ready');

    // =========================================================================
    // 1. SECTION REVEAL OBSERVER
    // =========================================================================
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal-section').forEach(sec => {
      revealObserver.observe(sec);
    });

    // =========================================================================
    // 2. ACTIVE NAV HIGHLIGHT OBSERVER
    // =========================================================================
    const navLinks = document.querySelectorAll('.nav-link');
    const observedSections = ['premise', 'principles', 'demo', 'ways']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0
    });

    observedSections.forEach(sec => navObserver.observe(sec));

    // =========================================================================
    // 3. CARD HOVER SPOTLIGHT TRACKER
    // =========================================================================
    document.querySelectorAll('.glass-card').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
    });

    // =========================================================================
    // 4. AMBIENCE: 18 STARS & 4 DRIFTING MOTES
    // =========================================================================
    (function initAmbience() {
      if (prefersReducedMotion) return;
      const starsWrap = document.getElementById('stars-wrap');
      if (starsWrap) {
        for (let i = 0; i < 18; i++) {
          const s = document.createElement('i');
          s.className = 'star';
          const left = (Math.random() * 100).toFixed(1);
          const top = (Math.random() * 100).toFixed(1);
          const dur = (4 + Math.random() * 5).toFixed(1);
          const delay = (Math.random() * 6).toFixed(1);
          const op = (0.25 + Math.random() * 0.45).toFixed(2);
          s.style.cssText = 'left:' + left + '%;top:' + top + '%;--d:' + dur + 's;--s:-' + delay + 's;--o:' + op + ';';
          starsWrap.appendChild(s);
        }
      }

      const motesWrap = document.getElementById('motes-wrap');
      if (motesWrap) {
        for (let m = 0; m < 4; m++) {
          const mote = document.createElement('div');
          mote.className = 'mote';
          const dur = (20 + Math.random() * 12).toFixed(1);
          const delay = (Math.random() * 16).toFixed(1);
          const left = (10 + Math.random() * 80).toFixed(1);
          const drift = (Math.random() * 40 - 20).toFixed(0);
          const op = (0.35 + Math.random() * 0.25).toFixed(2);
          mote.style.cssText = 'left:' + left + '%;--m-dur:' + dur + 's;--m-delay:-' + delay + 's;--m-drift:' + drift + 'px;--m-op:' + op + ';';
          motesWrap.appendChild(mote);
        }
      }
    })();

    // =========================================================================
    // 5. REVIVE SIGNATURE ANIMATION ON SCROLL
    // =========================================================================
    function playReviveAnimation() {
      const splashCenter = document.getElementById('splash-center');
      if (!splashCenter) return;
      const svgEl = splashCenter.querySelector('#mark');
      if (!svgEl) return;

      svgEl.classList.remove('anim-paused');
      const clone = svgEl.cloneNode(true);
      clone.classList.remove('anim-paused');
      splashCenter.replaceChild(clone, svgEl);
    }

    const splashFooter = document.getElementById('splash-footer');
    if (splashFooter) {
      let isVisible = false;

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (!isVisible) {
                isVisible = true;
                playReviveAnimation();
              }
            } else {
              isVisible = false;
            }
          });
        }, {
          threshold: 0.2
        });
        observer.observe(splashFooter);
      } else {
        window.addEventListener('scroll', function() {
          const rect = splashFooter.getBoundingClientRect();
          const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15;
          if (inView) {
            if (!isVisible) {
              isVisible = true;
              playReviveAnimation();
            }
          } else {
            isVisible = false;
          }
        }, { passive: true });
      }
    }

    // =========================================================================
    // 6. INTERACTIVE PREVIEW TABS
    // =========================================================================
    function switchDemoTab(tabKey) {
      document.querySelectorAll('.demo-tab-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('tab-btn-' + tabKey);
      if (activeBtn) activeBtn.classList.add('active');

      document.querySelectorAll('.demo-tab-view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
      });
      const targetView = document.getElementById('demo-view-' + tabKey);
      if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
      }
    }

    // =========================================================================
    // 7. BREATHING ENGINE (230px Ring, Arc, Scale & Cue Logic)
    // =========================================================================
    const PATTERNS = {
      box: {
        name: 'Box 4·4·4·4',
        phases: [
          { name: 'INHALE', sec: 4, scale: 1.25, cue: 'Expand diaphragm slowly · Rest your eyes' },
          { name: 'HOLD', sec: 4, scale: 1.25, cue: 'Stay soft · Let your shoulders drop' },
          { name: 'EXHALE', sec: 4, scale: 0.8, cue: 'Release slowly · Unclench your jaw' },
          { name: 'HOLD', sec: 4, scale: 0.8, cue: 'Stay soft · Let your shoulders drop' }
        ]
      },
      '478': {
        name: '4-7-8',
        phases: [
          { name: 'INHALE', sec: 4, scale: 1.25, cue: 'Expand diaphragm slowly · Rest your eyes' },
          { name: 'HOLD', sec: 7, scale: 1.25, cue: 'Stay soft · Let your shoulders drop' },
          { name: 'EXHALE', sec: 8, scale: 0.8, cue: 'Release slowly · Unclench your jaw' }
        ]
      },
      coherence: {
        name: 'Coherence 5·5',
        phases: [
          { name: 'INHALE', sec: 5, scale: 1.25, cue: 'Expand diaphragm slowly · Rest your eyes' },
          { name: 'EXHALE', sec: 5, scale: 0.8, cue: 'Release slowly · Unclench your jaw' }
        ]
      }
    };

    let curPatternKey = 'box';
    let curPhaseIdx = 0;
    let phaseSecRem = 4;
    const CIRCLE_CIRCUMFERENCE = 679; // 2 * PI * 108

    function renderPhaseDots() {
      const container = document.getElementById('breath-phase-dots');
      if (!container) return;
      const phases = PATTERNS[curPatternKey].phases;
      container.innerHTML = phases.map((_, i) => '<span class="phase-dot' + (i === curPhaseIdx ? ' active' : '') + '"></span>').join('');
    }

    function selectBreathPattern(key) {
      if (!PATTERNS[key]) return;
      curPatternKey = key;
      document.querySelectorAll('.pattern-chip').forEach(c => c.classList.remove('active'));
      const chip = document.getElementById('chip-' + key);
      if (chip) chip.classList.add('active');

      curPhaseIdx = 0;
      phaseSecRem = PATTERNS[key].phases[0].sec;
      applyBreathPhase(false);
      renderPhaseDots();
    }

    function applyBreathPhase(animate = true) {
      const phase = PATTERNS[curPatternKey].phases[curPhaseIdx];
      const orb = document.getElementById('breath-orb');
      if (orb) {
        orb.style.transform = 'scale(' + phase.scale + ')';
      }
      const phWord = document.getElementById('breath-phase');
      if (phWord) phWord.textContent = phase.name;
      const cue = document.getElementById('breath-cue');
      if (cue) cue.textContent = phase.cue;
      const sec = document.getElementById('breath-sec');
      if (sec) sec.textContent = phaseSecRem;

      updateProgressArc();
      renderPhaseDots();
    }

    function updateProgressArc() {
      const phase = PATTERNS[curPatternKey].phases[curPhaseIdx];
      const arc = document.getElementById('breath-arc');
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
          const sec = document.getElementById('breath-sec');
          if (sec) sec.textContent = phaseSecRem;
          updateProgressArc();
        }
      }, 1000);
    }
    renderPhaseDots();

    // =========================================================================
    // 8. FOCUS SETUP STEPPERS & PROPORTIONAL BAR
    // =========================================================================
    let fVal = 25;
    let rVal = 5;
    let roundsVal = 4;

    function stepFocus(delta) {
      fVal = Math.max(5, Math.min(180, fVal + delta));
      const el = document.getElementById('val-focus');
      if (el) el.textContent = fVal;
      updateFocusPlan();
    }

    function stepRest(delta) {
      rVal = Math.max(1, Math.min(60, rVal + delta));
      const el = document.getElementById('val-rest');
      if (el) el.textContent = rVal;
      updateFocusPlan();
    }

    function stepRounds(delta) {
      roundsVal = Math.max(1, Math.min(8, roundsVal + delta));
      const el = document.getElementById('val-rounds');
      if (el) el.textContent = roundsVal;
      updateFocusPlan();
    }

    function updateFocusPlan() {
      const bar = document.getElementById('cycle-bar-segments');
      if (bar) {
        let segs = '';
        for (let i = 0; i < roundsVal; i++) {
          segs += '<div class="cycle-seg-focus" style="flex:' + fVal + ';"></div>';
          segs += '<div class="cycle-seg-rest" style="flex:' + rVal + ';"></div>';
        }
        bar.innerHTML = segs;
      }

      const totalMins = roundsVal * (fVal + rVal);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      let timeStr = '';
      if (mins === 0) {
        timeStr = hrs + (hrs === 1 ? ' hour' : ' hours');
      } else {
        timeStr = (hrs > 0 ? hrs + 'h ' : '') + mins + 'm';
      }

      const summary = document.getElementById('val-summary');
      if (summary) {
        summary.textContent = "You'll have " + roundsVal + " rests · about " + timeStr;
      }
    }
    updateFocusPlan();

    // =========================================================================
    // 9. CUSTOM ACTIVITIES
    // =========================================================================
    let chosenActType = 'Breathing';

    function selectActChip(btn, typeName) {
      document.querySelectorAll('.custom-type-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      chosenActType = typeName;

      const minsInput = document.getElementById('custom-act-mins');
      const enditBadge = document.getElementById('custom-badge-endit');

      if (typeName === 'Video' || typeName === 'Sound') {
        if (minsInput) minsInput.style.display = 'none';
        if (enditBadge) enditBadge.style.display = 'inline-block';
      } else {
        if (minsInput) minsInput.style.display = 'inline-block';
        if (enditBadge) enditBadge.style.display = 'none';
      }
    }

    function updateRoutineTotal() {
      const list = document.getElementById('custom-list');
      const rows = list.querySelectorAll('.custom-row');
      const totalLine = document.getElementById('routine-total-line');
      if (!totalLine) return;

      if (rows.length === 0) {
        list.innerHTML = '<div class="custom-empty">Add your first activity above.</div>';
        totalLine.textContent = 'Timed: 0 mins · 0 activities';
        return;
      }

      let totalTimedMins = 0;
      rows.forEach(r => {
        const m = parseInt(r.getAttribute('data-mins') || '0', 10);
        totalTimedMins += m;
      });
      totalLine.textContent = 'Timed: ' + totalTimedMins + ' mins · ' + rows.length + ' activities';
    }

    function addCustomActivity() {
      const nameIn = document.getElementById('custom-act-name');
      const minsIn = document.getElementById('custom-act-mins');
      const name = nameIn.value.trim() || (chosenActType + ' Routine');

      const isUntimed = (chosenActType === 'Video' || chosenActType === 'Sound');
      const mins = isUntimed ? 0 : (parseInt(minsIn.value, 10) || 5);
      const timeLabel = isUntimed ? 'You end it' : (mins + ' mins');

      const list = document.getElementById('custom-list');
      const emptyNotice = list.querySelector('.custom-empty');
      if (emptyNotice) emptyNotice.remove();

      const row = document.createElement('div');
      row.className = 'custom-row';
      row.setAttribute('data-type', chosenActType);
      row.setAttribute('data-mins', mins);
      row.innerHTML = '<span>' + name + ' (' + chosenActType + ') · ' + timeLabel + '</span><button type="button" class="custom-del-btn" onclick="removeCustomItem(this)" title="Remove">✕</button>';
      row.style.opacity = '0';
      list.prepend(row);

      setTimeout(() => { row.style.opacity = '1'; }, 10);
      nameIn.value = '';
      updateRoutineTotal();
    }

    function removeCustomItem(btn) {
      const row = btn.closest('.custom-row');
      if (row) {
        row.remove();
        updateRoutineTotal();
      }
    }
    updateRoutineTotal();

    // =========================================================================
    // 10. DOWNLOAD MODAL & FILE TRIGGER (Unchanged Modal Behaviour)
    // =========================================================================
    function openDownloadModal(platform) {
      const modal = document.getElementById('download-modal');
      if (modal) modal.classList.add('open');
      switchModalTab(platform || 'win');
      triggerFileDownload(platform || 'win');
    }

    function closeDownloadModal(e) {
      if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close')) return;
      const modal = document.getElementById('download-modal');
      if (modal) modal.classList.remove('open');
    }

    function switchModalTab(os) {
      document.getElementById('modal-tab-win').classList.toggle('active', os === 'win');
      document.getElementById('modal-tab-mac').classList.toggle('active', os === 'mac');
      document.getElementById('modal-content-win').classList.toggle('active', os === 'win');
      document.getElementById('modal-content-mac').classList.toggle('active', os === 'mac');
    }

    function triggerFileDownload(os) {
      const filename = os === 'mac' ? 'Revive-0.1.0-mac.dmg' : 'Revive-Setup-0.1.0.exe';
      const toastFn = document.getElementById('toast-filename');
      if (toastFn) toastFn.textContent = filename;

      const toast = document.getElementById('toast-notice');
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 5000);
      }

      const content = os === 'mac' ? 'Revive macOS Universal DMG Build' : 'Revive Windows Desktop Installer (.exe)';
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
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

console.log('Successfully compiled Revive landing page to root and dist-site for Vercel deployment!');
