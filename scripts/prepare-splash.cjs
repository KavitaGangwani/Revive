const fs = require('fs');
const path = require('path');

const svgPath = path.resolve(__dirname, '../refer/assets/revive-tube.svg');
let svg = fs.readFileSync(svgPath, 'utf8');

// Strip XML declaration & c2pa metadata
svg = svg.replace(/<\?xml[^>]*\?>\s*/i, '');
svg = svg.replace(/<metadata>[\s\S]*?<\/metadata>/i, '');
// Remove opaque background rect & CSS background property so cosmic gradient shows through
svg = svg.replace(/<rect[^>]*fill="#000(?:000)?"[^>]*\/>/gi, '');
svg = svg.replace(/svg\s*\{\s*background\s*:\s*#000(?:000)?\s*\}/gi, '');
// Ensure id="mark" is on the svg
if (!svg.includes('id="mark"')) {
  svg = svg.replace('<svg ', '<svg id="mark" ');
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Revive — Splash</title>
<style>
@import "@fontsource/jetbrains-mono/index.css";
</style>
<style>
:root{color-scheme:dark;--accent:#AFDDFF;--muted:rgba(255,255,255,.5);--faint:rgba(255,255,255,.28);--track:rgba(255,255,255,.1);--hair:rgba(255,255,255,.08);--in:cubic-bezier(.16,1,.3,1);--inout:cubic-bezier(.76,0,.24,1);box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
*{box-sizing:border-box;margin:0}
html,body{height:100%;background:#000;color:#fff;overflow:hidden;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.frame{position:fixed;inset:0;background:radial-gradient(ellipse 45% 38% at 50% 50%,rgba(40,95,160,.2),transparent 70%),#020407;overflow:hidden;cursor:pointer;transition:transform 1.1s var(--inout)}
.frame.out{transform:translateY(-100%)}
.stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:0;animation:tw var(--d,4s) ease-in-out var(--s,0s) infinite}
@keyframes tw{0%,100%{opacity:0}50%{opacity:var(--o,.7)}}
.hud{position:absolute;aspect-ratio:1/1;border:1px solid rgba(255,255,255,.12);opacity:0;animation:fade 1.4s var(--in) .5s forwards}
.hud::before,.hud::after{content:"";position:absolute;width:3px;height:3px;border-radius:50%;background:var(--faint)}
.hud::before{left:-2px;top:-2px}.hud::after{right:-2px;bottom:-2px}
.pl{position:absolute;width:11px;height:11px;opacity:0;animation:fade 1.2s var(--in) .5s forwards}
.pl::before,.pl::after{content:"";position:absolute;background:var(--faint)}
.pl::before{left:5px;top:0;width:1px;height:11px}.pl::after{top:5px;left:0;height:1px;width:11px}
.app-titlebar{position:absolute;top:max(14px,env(safe-area-inset-top));left:20px;right:20px;padding-bottom:1px;display:flex;justify-content:space-between;align-items:center;opacity:0;animation:fade 1s var(--in) .3s forwards;-webkit-app-region:no-drag !important;z-index:1000}
.app-titlebar::after{content:"";position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(175,221,255,.12) 15%,rgba(175,221,255,.6) 50%,rgba(175,221,255,.12) 85%,transparent 100%);pointer-events:none}
.app-brand{display:flex;align-items:center;gap:7px;-webkit-app-region:no-drag !important;pointer-events:auto !important;user-select:none}
.brand-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);display:inline-block}
.brand-title{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text);font-weight:500;line-height:1}
.titlebar-drag{flex:1;height:24px;-webkit-app-region:drag !important;pointer-events:auto}
.win-ctrls{display:flex;align-items:center;gap:6px;position:relative;z-index:1020;-webkit-app-region:no-drag !important;pointer-events:auto !important}
.win-btn{background:rgba(255,255,255,.03);border:1px solid var(--hud-border);color:var(--muted);cursor:pointer !important;font-family:inherit;font-size:11px;padding:3px 8px;line-height:1;border-radius:4px;transition:all .15s ease;-webkit-app-region:no-drag !important;pointer-events:auto !important;user-select:none;display:inline-flex;align-items:center;justify-content:center}
.win-btn:hover{color:#fff;background:rgba(255,255,255,.12);border-color:var(--hair)}
.win-close-btn:hover,#splash-close-btn:hover{background:rgba(239,68,68,.35) !important;border-color:rgba(239,68,68,.5) !important;color:#fff !important}
.jf{position:absolute;width:min(48vw, 300px);height:min(48vw, 300px);pointer-events:none;z-index:8;overflow:hidden;mix-blend-mode:screen;opacity:.92;transition:opacity .3s ease}
.jf.tr{top:15px;right:-45px}
.jf.bl{bottom:-16px;left:-45px}
.jf video{width:100%;height:100%;object-fit:cover;display:block}
.center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:50}
.center svg{width:min(48vw, 350px);height:auto;max-height:44vh}
@keyframes rise{to{opacity:1;transform:none}}@keyframes fade{to{opacity:1}}
@media (max-width:620px){.hide-s{display:none}}
@media (prefers-reduced-motion:reduce){.stars i,.jf video,.jf svg,.bell,.ten{animation:none}.stars i{opacity:.5}}
</style>
</head>
<body>
<main class="frame" id="frame">
  <div class="stars" id="stars"></div>
  <div class="hud" style="left:18%;top:28%;width:76px"></div>
  <div class="hud" style="left:24%;top:39%;width:90px"></div>
  <div class="hud" style="left:48%;top:23%;width:96px"></div>
  <div class="hud" style="left:48%;top:59%;width:100px"></div>
  <div class="hud" style="left:60%;top:53%;width:104px;opacity:.55"></div>
  <div class="hud" style="left:76%;top:40%;width:88px;opacity:.5"></div>
  <i class="pl" style="left:18%;top:25%"></i><i class="pl" style="left:62%;top:18%"></i><i class="pl" style="left:34%;top:78%"></i><i class="pl" style="left:78%;top:58%"></i>

  <div class="jf tr" data-j>
    <video muted loop playsinline autoplay preload="auto" src="./assets/corner.mp4" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='assets/corner.mp4'}else if(this.dataset.fb==1){this.dataset.fb=2;this.src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'}else{this.remove()}"></video>
  </div>
  <div class="jf bl" data-j>
    <video muted loop playsinline autoplay preload="auto" src="./assets/corner.mp4" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src='assets/corner.mp4'}else if(this.dataset.fb==1){this.dataset.fb=2;this.src='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'}else{this.remove()}"></video>
  </div>

  <div class="app-titlebar" id="app-titlebar">
    <div class="app-brand">
      <span class="brand-dot"></span>
      <span class="brand-title">Revive</span>
    </div>
    <div class="titlebar-drag"></div>
    <div class="win-ctrls">
      <button type="button" id="splash-min-btn" class="win-btn" title="Minimize" aria-label="Minimize">─</button>
      <button type="button" id="splash-close-btn" class="win-btn win-close-btn" title="Close" aria-label="Close">✕</button>
    </div>
  </div>

  <div class="center">
${svg}
  </div>
</main>
<script>
(function(){
  var st = document.getElementById("stars");
  if (st) {
    for (var i = 0; i < 90; i++) {
      var s = document.createElement("i");
      s.style.cssText = "left:" + (Math.random() * 100) + "%;top:" + (Math.random() * 100) + "%;--d:" + (3 + Math.random() * 5).toFixed(1) + "s;--s:-" + (Math.random() * 6).toFixed(1) + "s;--o:" + (.3 + Math.random() * .6).toFixed(2);
      if (Math.random() < .12) s.style.width = s.style.height = "3px";
      st.appendChild(s);
    }
  }

  var minBtn = document.getElementById("splash-min-btn");
  if (minBtn) {
    minBtn.addEventListener("click", function(e){
      if (e) { e.stopPropagation(); e.preventDefault(); }
      var b = window.splashBridge || window.windowControls || window.windowApi || (window.revive && window.revive.windowControls);
      if (b && b.minimize) b.minimize();
    });
  }
  var closeBtn = document.getElementById("splash-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", function(e){
      if (e) { e.stopPropagation(); e.preventDefault(); }
      var b = window.splashBridge || window.windowControls || window.windowApi || (window.revive && window.revive.windowControls);
      if (b && b.close) b.close();
      else window.close();
    });
  }

  function replay() {
    var svgEl = document.getElementById("mark");
    if (!svgEl) return;
    var clone = svgEl.cloneNode(true);
    svgEl.parentNode.replaceChild(clone, svgEl);
  }

  document.addEventListener("click", function(e) {
    if (e.target && e.target.closest && e.target.closest(".win-ctrls")) return;
    replay();
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === " " || e.key === "r" || e.key === "R") {
      replay();
    }
  });
})();
</script>
</body>
</html>
`;

const destDir = path.resolve(__dirname, '../src/renderer/splash');
const destIndex = path.join(destDir, 'index.html');
const destSplash = path.join(destDir, 'splash.html');
const referFile = path.resolve(__dirname, '../refer/splash.html');

fs.writeFileSync(destIndex, html, 'utf8');
fs.writeFileSync(destSplash, html, 'utf8');
fs.writeFileSync(referFile, html, 'utf8');
console.log('Splash synchronized successfully. Size:', html.length);
