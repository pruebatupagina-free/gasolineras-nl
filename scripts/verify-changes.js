const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'https://pruebatupagina-free.github.io/gasolineras-nl'
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots')
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
const GEO = { latitude: 25.648, longitude: -100.384, accuracy: 10 }

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // ── Check 1: Mobile landing — no overflow, correct name ───────────────────
  console.log('\n📱 1. Landing mobile — encuadre y nombre')
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: GEO })
  const mPage = await mobile.newPage()
  await mPage.goto(BASE_URL, { waitUntil: 'networkidle' })
  await wait(2000)
  const bodyW = await mPage.evaluate(() => document.body.scrollWidth)
  const vw = await mPage.evaluate(() => window.innerWidth)
  console.log(`   scrollWidth=${bodyW} viewportWidth=${vw} ${bodyW <= vw ? '✅ Sin overflow horizontal' : '❌ OVERFLOW detectado'}`)
  const navText = await mPage.locator('nav span').first().textContent().catch(() => 'N/A')
  console.log(`   Navbar: "${navText}" ${navText === 'GasMap' ? '✅' : '❌ Nombre incorrecto'}`)
  await mPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-landing-mobile.png') })

  // Scroll down to features section
  await mPage.evaluate(() => window.scrollTo(0, 800))
  await wait(800)
  await mPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-landing-features.png') })
  const featuresW = await mPage.evaluate(() => document.body.scrollWidth)
  console.log(`   Features section scrollWidth=${featuresW} ${featuresW <= vw ? '✅' : '❌ Overflow en features'}`)
  await mobile.close()

  // ── Check 2: Desktop landing ───────────────────────────────────────────────
  console.log('\n🖥  2. Landing desktop')
  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const dPage = await desk.newPage()
  await dPage.goto(BASE_URL, { waitUntil: 'networkidle' })
  await wait(1500)
  await dPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-landing-desktop.png') })
  console.log('   ✅ Screenshot tomado')
  await desk.close()

  // ── Check 3: App tabs ──────────────────────────────────────────────────────
  console.log('\n📱 3. App — tabs y StationSheet')
  const appCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: GEO })
  const app = await appCtx.newPage()
  app.on('pageerror', e => console.log('   🔴 PageError:', e.message.substring(0, 100)))

  // Register via main form
  await app.goto(BASE_URL, { waitUntil: 'networkidle' })
  await wait(1500)
  // Click "Abrir app" from landing → register page
  await app.click('a[href="/gasolineras-nl/register"]').catch(() => app.click('text=Abrir app'))
  await wait(2000)
  const TS = Date.now()
  const email = `v${TS}@gasonl.dev`
  const inputs = await app.locator('input').all()
  console.log(`   Inputs encontrados: ${inputs.length}`)
  if (inputs.length >= 3) {
    await inputs[0].fill('Verify')
    await inputs[1].fill(email)
    await inputs[2].fill('TestPass2025!')
    await app.locator('button[type="submit"]').click()
    await wait(5000)
    await app.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-app-home.png') })

    // Close onboarding
    const skip = app.locator('button', { hasText: 'Omitir' })
    if (await skip.count() > 0) { await skip.click(); await wait(500) }

    // Check "GasMap NL" is gone
    const nlCount = await app.locator('text=GasMap NL').count()
    console.log(`   "GasMap NL" en app: ${nlCount} ${nlCount === 0 ? '✅' : '❌'}`)

    // Go to Estaciones tab
    await app.locator('button').filter({ hasText: /Estaciones/i }).first().click().catch(async () => {
      // try by index
      const btns = await app.locator('nav button').all()
      if (btns.length > 1) await btns[1].click()
    })
    await wait(3500)
    await app.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-estaciones.png') })
    console.log('   EstacionesTab: screenshot')

    // Try clicking a station card
    const cards = await app.locator('div').filter({ hasText: /PEMEX|Oxxo|Shell|Mobil|BP|G500/i }).all()
    console.log(`   Estaciones visibles: ${cards.length}`)
    if (cards.length > 0) {
      await cards[0].click()
      await wait(1500)
      const sheet = await app.locator('text=Todos los precios').count()
      console.log(`   StationSheet overlay: ${sheet > 0 ? '✅ Abierto' : '❌ No apareció'}`)
      await app.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-station-overlay.png') })
    }

    // Check Perfil tab for old name
    await app.locator('button').filter({ hasText: /Perfil/i }).first().click()
    await wait(800)
    const perfilNL = await app.locator('text=GasMap NL').count()
    console.log(`   PerfilTab "GasMap NL": ${perfilNL} ${perfilNL === 0 ? '✅' : '❌'}`)
    await app.screenshot({ path: path.join(SCREENSHOTS_DIR, 'verify-perfil.png') })
  } else {
    console.log('   ❌ No se encontraron inputs de registro')
  }

  await appCtx.close()
  await browser.close()
  console.log('\n✅ Verificación completada — ver scripts/test-screenshots/')
})()
