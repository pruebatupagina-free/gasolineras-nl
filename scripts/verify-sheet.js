const { chromium } = require('playwright')
const path = require('path')
const SD = path.join(__dirname, 'test-screenshots')
const GEO = { latitude: 25.648, longitude: -100.384, accuracy: 10 }
const w = ms => new Promise(r => setTimeout(r, ms))
const BASE = 'https://pruebatupagina-free.github.io/gasolineras-nl'

;(async () => {
  const b = await chromium.launch({ headless: true })
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: GEO })
  const p = await ctx.newPage()
  p.on('pageerror', e => console.log('ERR:', e.message.slice(0, 80)))

  await p.goto(BASE, { waitUntil: 'networkidle' })
  await w(1500)
  await p.locator('a').filter({ hasText: 'Abrir app' }).first().click()
  await w(2000)

  const ins = await p.locator('input').all()
  await ins[0].fill('SheetTest')
  await ins[1].fill(`sht${Date.now()}@g.dev`)
  await ins[2].fill('TestPass2025!')
  await p.locator('button[type=submit]').click()
  await w(5000)

  const skip = p.locator('button', { hasText: 'Omitir' })
  if (await skip.count() > 0) { await skip.click(); await w(300) }

  // Go to Estaciones tab (second bottom nav button)
  await p.locator('nav button').nth(1).click()
  await w(4000)

  // Click first visible station row by position (tap center of first row)
  const rows = await p.locator('[class*="pressable"], div[style*="cursor: pointer"]').all()
  console.log('Pressable divs:', rows.length)

  // Just click at coordinates where first station row should be
  await p.mouse.click(195, 260)
  await w(1500)

  const sh = await p.locator('text=Todos los precios').count()
  console.log('StationSheet visible:', sh, sh > 0 ? '✅ CORRECTO' : '❌ No apareció')
  await p.screenshot({ path: path.join(SD, 'verify-sheet-overlay.png') })

  // Close sheet and verify still on Estaciones
  if (sh > 0) {
    await p.keyboard.press('Escape')
    await w(500)
    const estTabActive = await p.locator('text=Estaciones').count()
    console.log('Sigue en Estaciones:', estTabActive > 0 ? '✅' : '?')
  }

  await b.close()
})()
