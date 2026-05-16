const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="url(#grad)"/>
  <path d="M8 26V10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <path d="M20 10l3-3 3 3v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-1" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="10" y1="26" x2="20" y2="26" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="11" y1="15" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
</svg>`

const SIZES = [192, 512]
const OUT_DIR = path.join(__dirname, '..', 'frontend', 'public')

async function generate() {
  const browser = await chromium.launch()
  for (const size of SIZES) {
    const page = await browser.newPage()
    await page.setViewportSize({ width: size, height: size })
    const encoded = encodeURIComponent(SVG)
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0F172A"><img src="data:image/svg+xml,${encoded}" width="${size}" height="${size}" style="display:block"></body></html>`)
    await page.waitForTimeout(200)
    const outPath = path.join(OUT_DIR, `icon-${size}.png`)
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: size, height: size } })
    await page.close()
    console.log(`✅ icon-${size}.png → ${outPath}`)
  }
  await browser.close()
  console.log('🎉 Iconos generados')
}

generate().catch(e => { console.error(e); process.exit(1) })
