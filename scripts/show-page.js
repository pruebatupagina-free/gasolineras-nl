const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'https://pruebatupagina-free.github.io/gasolineras-nl'
const OUT = path.join(__dirname, 'test-screenshots')
fs.mkdirSync(OUT, { recursive: true })

const GEO = { latitude: 25.648, longitude: -100.384, accuracy: 10 }

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function show() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 })

  // ── Desktop ──────────────────────────────────────────────
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['geolocation'],
    geolocation: GEO,
  })
  const page = await ctx.newPage()

  // Landing
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await wait(1500)
  await page.screenshot({ path: path.join(OUT, 'view-01-landing-desktop.png'), fullPage: true })
  console.log('📸 Landing desktop')

  // Login
  await page.locator('a:has-text("Iniciar sesión")').first().click()
  await wait(1000)
  await page.screenshot({ path: path.join(OUT, 'view-02-login.png') })
  console.log('📸 Login')

  // Registro
  await page.locator('a:has-text("Créala gratis")').click()
  await wait(1000)
  await page.screenshot({ path: path.join(OUT, 'view-03-register.png') })
  console.log('📸 Registro')

  // Entrar a la app (login con usuario de prueba existente)
  await page.locator('a:has-text("Iniciar sesión")').click()
  await wait(800)
  await page.locator('input[name="email"]').fill('testmanual@gasonl.dev')
  await page.locator('input[type="password"]').first().fill('TestPass2025!')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/app/, { timeout: 15000 })
  await wait(3000)

  // Mapa completo desktop
  await page.screenshot({ path: path.join(OUT, 'view-04-mapa-desktop.png') })
  console.log('📸 Mapa desktop')

  // Mapa scroll panel lateral
  await page.evaluate(() => {
    document.querySelector('.desktop-panel')?.scrollTo(0, 200)
  })
  await wait(500)
  await page.screenshot({ path: path.join(OUT, 'view-05-panel-lateral.png') })
  console.log('📸 Panel lateral estaciones')

  // Overlay navegación
  await page.locator('.desktop-panel button:has-text("Ir")').first().click()
  await wait(3500)
  await page.screenshot({ path: path.join(OUT, 'view-06-navegacion-overlay.png') })
  console.log('📸 Overlay de navegación')
  await page.locator('.animate-fade-in button').first().click({ force: true })
  await wait(800)

  await ctx.close()

  // ── Mobile ───────────────────────────────────────────────
  const mCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ['geolocation'],
    geolocation: GEO,
  })
  const mp = await mCtx.newPage()

  // Landing mobile
  await mp.goto(BASE_URL, { waitUntil: 'networkidle' })
  await wait(1500)
  await mp.screenshot({ path: path.join(OUT, 'view-07-landing-mobile.png') })
  console.log('📸 Landing mobile')

  // Login mobile → app
  await mp.locator('a:has-text("Iniciar sesión")').first().click()
  await wait(800)
  await mp.locator('input[name="email"]').fill('testmanual@gasonl.dev')
  await mp.locator('input[type="password"]').first().fill('TestPass2025!')
  await mp.locator('button[type="submit"]').click()
  await mp.waitForURL(/\/app/, { timeout: 15000 })
  await wait(3000)
  await mp.screenshot({ path: path.join(OUT, 'view-08-mapa-mobile.png') })
  console.log('📸 Mapa mobile')

  // Bottom sheet abierto
  await mp.locator('.mobile-sheet button').first().click()
  await wait(800)
  await mp.screenshot({ path: path.join(OUT, 'view-09-bottomsheet-mobile.png') })
  console.log('📸 Bottom sheet mobile')

  await mCtx.close()
  await browser.close()

  console.log(`\n✅ 9 screenshots guardados en scripts/test-screenshots/`)
}

show().catch(err => { console.error('❌', err.message); process.exit(1) })
