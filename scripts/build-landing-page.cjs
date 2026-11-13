// Vercel build step for the static landing page.
//
// `landing.html` is the single source of truth for the site (hand-edited, no
// template compilation). This script only publishes it: it copies landing.html
// into dist-site/ as index.html + landing.html and brings the assets along.
//
// Vercel runs this via vercel.json:
//   buildCommand:   node scripts/build-landing-page.cjs
//   outputDirectory: dist-site
//
// Note: an older version of this file generated landing.html from a hardcoded
// template, which silently overwrote hand edits. Do not reintroduce that.

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const sourceHtml = path.join(root, 'landing.html')
const distSite = path.join(root, 'dist-site')

if (!fs.existsSync(sourceHtml)) {
  console.error('landing.html not found at', sourceHtml)
  process.exit(1)
}

const html = fs.readFileSync(sourceHtml, 'utf8')

if (!fs.existsSync(distSite)) {
  fs.mkdirSync(distSite, { recursive: true })
}

fs.writeFileSync(path.join(distSite, 'index.html'), html, 'utf8')
fs.writeFileSync(path.join(distSite, 'landing.html'), html, 'utf8')

const srcAssets = path.join(root, 'assets')
if (fs.existsSync(srcAssets)) {
  fs.cpSync(srcAssets, path.join(distSite, 'assets'), { recursive: true })
}

console.log('Published landing.html to dist-site/index.html for Vercel.')
