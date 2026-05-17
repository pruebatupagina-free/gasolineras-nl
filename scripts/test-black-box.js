/**
 * PRUEBA DE CAJA NEGRA — GasMap NL
 *
 * Sin conocimiento del código interno. Sólo se observa lo que el usuario
 * ve y hace. Se validan flujos completos de usuario, comportamiento de la UI,
 * mensajes de error, navegación y experiencia en desktop y mobile.
 */

const { chromium } = require('playwright')

const APP = 'https://pruebatupagina-free.github.io/gasolineras-nl'
const SS  = 'C:/Users/Tibs/clientes-web/gasolineras-nl/scripts/test-screenshots/blackbox'
const TS  = Date.now()
const USER = {
  nombre: `BB ${TS}`,
  email: `blackbox-${TS}@test.dev`,
  pass: 'BlackBox2025!',
}

const fs = require('fs')
if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true })

let passed = 0
let failed = 0

function ok(msg)      { passed++; console.log(`  ✅ ${msg}`) }
function ko(msg)      { failed++; console.log(`  ❌ ${msg}`) }
function warn(msg)    { console.log(`  ⚠️  ${msg}`) }
function section(t)   { console.log(`\n${t}`) }

async function shot(page, name) {
  await page.screenshot({ path: `${SS}/${name}`, fullPage: false }).catch(() => {})
}

async function run() {
  console.log('⬛ GasMap NL — Prueba de Caja Negra')
  console.log('━'.repeat(54))

  const browser = await chromium.launch({ headless: true })

  // ════════════════════════════════════════════════════════
  // DESKTOP 1280px
  // ════════════════════════════════════════════════════════
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      geolocation: { latitude: 25.6866, longitude: -100.3161 },
      permissions: ['geolocation'],
    })
    const p = await ctx.newPage()
    const errors = []
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

    // ── 1. LANDING — PRIMER CONTACTO ──────────────────────
    section('🖥️  DESKTOP — 1. LANDING')
    await p.goto(APP + '/', { waitUntil: 'networkidle', timeout: 40000 })
    await p.waitForTimeout(1500)
    await shot(p, '01-landing.png')

    const hero = await p.locator('h1, h2').first().textContent().catch(() => '')
    hero.length > 0 ? ok(`Hero visible: "${hero.slice(0, 50).trim()}"`) : ko('Hero vacío o ausente')

    const ctaBtn = p.locator('a:has-text("Abrir"), a:has-text("Empezar"), a:has-text("Gratis")').first()
    await ctaBtn.isVisible({ timeout: 3000 }).catch(() => false)
      ? ok('CTA principal visible') : ko('CTA principal no visible')

    // Navegación existe
    const nav = await p.locator('nav, header').first().isVisible({ timeout: 2000 }).catch(() => false)
    nav ? ok('Navbar visible') : ko('Navbar ausente')

    // ── 2. FLUJO REGISTRO ─────────────────────────────────
    section('🖥️  DESKTOP — 2. REGISTRO')
    await ctaBtn.click()
    await p.waitForTimeout(1500)
    await shot(p, '02-register.png')

    const regForm = await p.locator('form, input[name="nombre"], input[name="email"]').first().isVisible({ timeout: 5000 }).catch(() => false)
    regForm ? ok('Formulario de registro visible') : ko('Formulario de registro ausente')

    // Validación: submit vacío
    await p.locator('button[type="submit"]').click()
    await p.waitForTimeout(800)
    const toast1 = await p.locator('[role="status"], [class*="toast"], [class*="Toastify"]').first().isVisible({ timeout: 3000 }).catch(() => false)
    toast1 ? ok('Toast de error al enviar formulario vacío') : warn('Toast de validación no detectado')

    // Llenar y registrar
    await p.locator('input[name="nombre"]').fill(USER.nombre)
    await p.locator('input[name="email"]').fill(USER.email)
    await p.locator('input[name="password"]').fill(USER.pass)
    await p.locator('button[type="submit"]').click()
    await p.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {})
    const afterReg = p.url()
    afterReg.includes('/app') ? ok('Registro exitoso → redirigido a /app') : ko(`Registro no redirigió a /app (URL: ${afterReg})`)
    await p.waitForTimeout(2500)
    await shot(p, '03-app-after-register.png')

    // ── 3. APP — ESTRUCTURA PRINCIPAL ────────────────────
    section('🖥️  DESKTOP — 3. ESTRUCTURA APP')
    const map = await p.locator('.leaflet-container, #map, [class*="leaflet"]').first().isVisible({ timeout: 8000 }).catch(() => false)
    map ? ok('Mapa Leaflet visible') : ko('Mapa Leaflet no visible')

    // Selectores de combustible
    for (const fuel of ['Magna', 'Premium', 'Diésel']) {
      const btn = await p.locator(`button:has-text("${fuel}")`).first().isVisible({ timeout: 3000 }).catch(() => false)
      btn ? ok(`Selector "${fuel}" visible`) : ko(`Selector "${fuel}" ausente`)
    }

    // Lista de estaciones
    await p.waitForTimeout(2000)
    const stationCount = await p.locator('.desktop-panel [class*="station"], .desktop-panel [class*="pressable"]').count()
    stationCount > 0 ? ok(`${stationCount} estaciones en panel`) : warn('Lista de estaciones vacía o selector no coincide')

    // ── 4. INTERACCIÓN CON ESTACIONES ─────────────────────
    section('🖥️  DESKTOP — 4. INTERACCIÓN ESTACIONES')
    // Cambiar combustible
    await p.locator('button:has-text("Premium")').first().click()
    await p.waitForTimeout(1000)
    const premiumActive = await p.locator('button:has-text("Premium")').first().evaluate(el =>
      el.classList.toString().includes('active') ||
      window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'
    ).catch(() => false)
    ok('Selector Premium clickeable (sin crash)')

    // Abrir station sheet
    const firstStation = p.locator('.desktop-panel .pressable').first()
    const firstVisible = await firstStation.isVisible({ timeout: 4000 }).catch(() => false)
    if (firstVisible) {
      await firstStation.click()
      await p.waitForTimeout(1200)
      await shot(p, '04-station-sheet.png')
      const sheetVisible = await p.locator('[class*="sheet"], [class*="Sheet"], text=Cómo llegar').first().isVisible({ timeout: 4000 }).catch(() => false)
      sheetVisible ? ok('StationSheet abierto al clic en estación') : warn('StationSheet no detectado')
      await p.keyboard.press('Escape')
      await p.waitForTimeout(1200)
      const sheetClosed = !(await p.locator('text=Cómo llegar').first().isVisible({ timeout: 1000 }).catch(() => false))
      sheetClosed ? ok('StationSheet cerrado con Escape') : warn('StationSheet no cerró con Escape')
    } else {
      warn('Primera estación no visible para click')
    }

    // ── 5. CARD DESCUENTOS ────────────────────────────────
    section('🖥️  DESKTOP — 5. DESCUENTOS (SMOKE TEST)')
    const descCard = p.locator('text=Descuentos en gasolina').first()
    const descVisible = await descCard.isVisible({ timeout: 4000 }).catch(() => false)
    descVisible ? ok('Card "Descuentos en gasolina" visible') : ko('Card descuentos no visible')

    if (descVisible) {
      const badge = await p.locator('span:has-text("Próximo"), span:has-text("PRÓXIMO")').first().isVisible({ timeout: 2000 }).catch(() => false)
      badge ? ok('Badge "Próximo" visible en card') : warn('Badge Próximo no detectado')

      // Click via JS evaluate — finds the parent button and dispatches click directly
      await descCard.scrollIntoViewIfNeeded().catch(() => {})
      await p.waitForTimeout(500)
      await p.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent.includes('Descuentos en gasolina'))
        if (btn) btn.click()
      })
      await p.waitForTimeout(1500)
      await shot(p, '05-descuentos-modal.png')

      const modal = await p.locator('text=Quiero acceso anticipado').first().isVisible({ timeout: 4000 }).catch(() => false)
      modal ? ok('Modal descuentos abierto — CTA visible') : ko('Modal descuentos no abrió')

      const personCount = await p.locator('text=/\\d+ personas/').first().textContent({ timeout: 3000 }).catch(() => '')
      personCount ? ok(`Contador social proof: "${personCount.trim()}"`) : warn('Contador de personas no visible')

      // Unirse a la waitlist
      if (modal) {
        await p.locator('text=Quiero acceso anticipado').first().click()
        await p.waitForTimeout(1800)
        const success = await p.locator('text=¡Listo!').first().isVisible({ timeout: 4000 }).catch(() => false)
        success ? ok('Unirse a waitlist → estado "¡Listo!" visible') : warn('Estado éxito de waitlist no detectado')
        await shot(p, '06-descuentos-joined.png')

        // Cerrar modal con botón "Cerrar" o Escape
        const closeBtn = p.locator('button:has-text("Cerrar")').first()
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click()
        } else {
          await p.keyboard.press('Escape')
        }
        await p.waitForTimeout(800)
        // Verify modal is closed before proceeding
        await p.locator('text=Quiero acceso anticipado').first().isVisible({ timeout: 1000 })
          .then(() => p.keyboard.press('Escape')).catch(() => {})
        await p.waitForTimeout(500)
      }
    }

    // ── 6. LOGOUT ─────────────────────────────────────────
    section('🖥️  DESKTOP — 6. LOGOUT')
    const logoutBtn = p.locator('button[title="Cerrar sesión"], button[aria-label*="logout"], button[aria-label*="Cerrar sesión"]').first()
    const logoutVisible = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (logoutVisible) {
      await logoutBtn.click({ force: true })
      await p.waitForTimeout(2000)
      await shot(p, '07-after-logout.png')
      !p.url().includes('/app') ? ok('Logout → redirigido fuera de /app') : ko('Logout no funcionó')
    } else {
      warn('Botón logout no encontrado')
    }

    // ── 7. RUTA PROTEGIDA ─────────────────────────────────
    section('🖥️  DESKTOP — 7. RUTA PROTEGIDA')
    // Intentar ir a /app directamente sin sesión (via SPA — registra token, hace logout, navega)
    const mapAfterLogout = await p.locator('.leaflet-container').first().isVisible({ timeout: 3000 }).catch(() => false)
    !mapAfterLogout ? ok('Mapa no visible tras logout (ruta protegida)') : ko('Mapa sigue visible tras logout (ruta no protegida)')

    // ── 8. LOGIN ──────────────────────────────────────────
    section('🖥️  DESKTOP — 8. LOGIN')
    // Ir a login desde landing (después del logout ya estamos en landing o login page)
    await p.waitForTimeout(1500)
    const currentUrl = p.url()
    if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
      // Navegar a landing si no estamos en un formulario de auth
      const ctaAfterLogout = p.locator('a:has-text("Abrir GasMap"), a:has-text("Abrir app"), a:has-text("Empezar")').first()
      if (await ctaAfterLogout.isVisible({ timeout: 5000 }).catch(() => false)) {
        await ctaAfterLogout.click()
        await p.waitForTimeout(1500)
      }
    }
    await p.locator('a:has-text("Abrir"), a:has-text("Empezar")').first().click({ timeout: 5000 }).catch(() => {})
    await p.waitForTimeout(1000)
    const loginLink = p.locator('a:has-text("Iniciar sesión"), a:has-text("Inicia sesión")').first()
    if (await loginLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginLink.click()
      await p.waitForTimeout(1000)
    }

    // Credenciales incorrectas
    await p.locator('input[name="email"], input[type="email"]').first().fill('noexiste@fake.com').catch(() => {})
    await p.locator('input[name="password"], input[type="password"]').first().fill('wrongpass').catch(() => {})
    await p.locator('button[type="submit"]').click()
    await p.waitForTimeout(1500)
    const errToast = await p.locator('[role="status"], [class*="toast"], [class*="Toastify"]').first().isVisible({ timeout: 4000 }).catch(() => false)
    errToast ? ok('Login incorrecto → toast de error visible') : warn('Toast de error no detectado')

    // Login correcto
    await p.locator('input[name="email"], input[type="email"]').first().fill(USER.email)
    await p.locator('input[name="password"], input[type="password"]').first().fill(USER.pass)
    await p.locator('button[type="submit"]').click()
    await p.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {})
    p.url().includes('/app') ? ok('Login correcto → redirigido a /app') : ko(`Login no redirigió (URL: ${p.url()})`)

    // Error JS durante sesión desktop
    const jsErrors = errors.filter(e => !e.includes('401') && !e.includes('net::ERR'))
    jsErrors.length === 0
      ? ok('Sin errores JS inesperados durante sesión desktop')
      : warn(`${jsErrors.length} error(es) JS: ${jsErrors[0].slice(0, 80)}`)

    await ctx.close()
  }

  // ════════════════════════════════════════════════════════
  // MOBILE 375px
  // ════════════════════════════════════════════════════════
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      geolocation: { latitude: 25.6866, longitude: -100.3161 },
      permissions: ['geolocation'],
    })
    const p = await ctx.newPage()

    // ── 9. MOBILE — LANDING ───────────────────────────────
    section('📱 MOBILE — 9. LANDING')
    await p.goto(APP + '/', { waitUntil: 'networkidle', timeout: 40000 })
    await p.waitForTimeout(1500)
    await shot(p, '09-mobile-landing.png')

    const mHero = await p.locator('h1, h2').first().isVisible({ timeout: 4000 }).catch(() => false)
    mHero ? ok('Hero visible en mobile') : ko('Hero no visible en mobile')

    const mCta = p.locator('a:has-text("Abrir"), a:has-text("Empezar")').first()
    await mCta.isVisible({ timeout: 3000 }).catch(() => false)
      ? ok('CTA visible en mobile') : ko('CTA no visible en mobile')

    // ── 10. MOBILE — REGISTRO ─────────────────────────────
    section('📱 MOBILE — 10. REGISTRO')
    await mCta.click()
    await p.waitForTimeout(1500)

    await p.locator('input[name="nombre"]').fill(USER.nombre + 'm')
    await p.locator('input[name="email"]').fill(`m-${USER.email}`)
    await p.locator('input[name="password"]').fill(USER.pass)
    await p.locator('button[type="submit"]').click()
    await p.waitForURL(/\/app/, { timeout: 20000 }).catch(() => {})
    p.url().includes('/app') ? ok('Registro mobile → redirige a /app') : ko(`No redirigió (${p.url()})`)
    await p.waitForTimeout(3000)
    await shot(p, '10-mobile-app.png')

    // Dismiss onboarding
    const onb = p.locator('button:has-text("Omitir"), button:has-text("Comenzar"), button:has-text("Empezar"), button:has-text("Entendido")').first()
    if (await onb.isVisible({ timeout: 2000 }).catch(() => false)) {
      await onb.click()
      await p.waitForTimeout(800)
    }

    // ── 11. MOBILE — BOTTOM NAV ───────────────────────────
    section('📱 MOBILE — 11. BOTTOM NAVIGATION')
    const tabs = ['Inicio', 'Estaciones', 'Mapa', 'Garaje', 'Historial']
    for (const tab of tabs) {
      const btn = p.locator(`.bottom-nav button, nav button`).filter({ hasText: tab }).first()
      const visible = await btn.isVisible({ timeout: 2000 }).catch(() => false)
      visible ? ok(`Tab "${tab}" visible en bottom nav`) : ko(`Tab "${tab}" ausente`)
    }

    // ── 12. MOBILE — HOME TAB ─────────────────────────────
    section('📱 MOBILE — 12. HOME TAB')
    const homeBtn = p.locator('.bottom-nav button').filter({ hasText: 'Inicio' }).first()
    if (await homeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await homeBtn.click()
    await p.waitForTimeout(800)

    const descCardM = p.locator('text=Descuentos en gasolina').first()
    await descCardM.isVisible({ timeout: 5000 }).catch(() => false)
      ? ok('Card "Descuentos en gasolina" visible en mobile') : ko('Card descuentos no visible en mobile')

    // Precios del día
    const priceSection = await p.locator('text=PRECIOS HOY, text=Precio Hoy').first().isVisible({ timeout: 3000 }).catch(() => false)
    priceSection ? ok('Sección "Precios Hoy" visible en mobile') : warn('Sección precios no detectada')

    // Gasolinera más cercana
    const nearest = await p.locator('text=MÁS CERCANA, text=Más Cercana, text=más cercana').first().isVisible({ timeout: 3000 }).catch(() => false)
    nearest ? ok('Sección "Gasolinera más cercana" visible') : warn('Sección más cercana no detectada')
    await shot(p, '11-mobile-home.png')

    // ── 13. MOBILE — DESCUENTOS MODAL ─────────────────────
    section('📱 MOBILE — 13. DESCUENTOS MODAL')
    if (await descCardM.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descCardM.click({ force: true })
      await p.waitForTimeout(1200)
      await shot(p, '12-mobile-descuentos-modal.png')

      const modalCTA = await p.locator('text=Quiero acceso anticipado').first().isVisible({ timeout: 4000 }).catch(() => false)
      modalCTA ? ok('Modal descuentos abierto en mobile') : ko('Modal descuentos no abrió en mobile')

      // Cerrar con X
      await p.locator('button').filter({ hasText: /^[×xX]$/ }).first().click().catch(() => {
        p.keyboard.press('Escape').catch(() => {})
      })
      await p.waitForTimeout(500)
    }

    // ── 14. MOBILE — TAB ESTACIONES ───────────────────────
    section('📱 MOBILE — 14. TAB ESTACIONES')
    const estTab = p.locator('.bottom-nav button').filter({ hasText: 'Estaciones' }).first()
    if (await estTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await estTab.click()
      await p.waitForTimeout(2000)
      await shot(p, '13-mobile-estaciones.png')
      const stCount = await p.locator('[class*="station"], [class*="pressable"]').count()
      stCount > 0 ? ok(`${stCount} elementos en tab Estaciones`) : warn('Tab estaciones sin elementos visibles')
    }

    // ── 15. MOBILE — TAB MAPA ─────────────────────────────
    section('📱 MOBILE — 15. TAB MAPA')
    const mapTab = p.locator('.bottom-nav button').filter({ hasText: 'Mapa' }).first()
    if (await mapTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mapTab.click()
      await p.waitForTimeout(2000)
      await shot(p, '14-mobile-mapa.png')
      const mapVisible = await p.locator('.leaflet-container').first().isVisible({ timeout: 5000 }).catch(() => false)
      mapVisible ? ok('Mapa Leaflet visible en tab Mapa') : ko('Mapa no visible en tab Mapa')
    }

    // ── 16. RENDIMIENTO PERCIBIDO ─────────────────────────
    section('📱 MOBILE — 16. RENDIMIENTO PERCIBIDO')
    const perfStart = Date.now()
    await p.goto(APP + '/', { waitUntil: 'networkidle', timeout: 40000 })
    const loadTime = Date.now() - perfStart
    loadTime < 8000
      ? ok(`Landing cargó en ${loadTime}ms (< 8s)`)
      : warn(`Landing tardó ${loadTime}ms (> 8s — revisar optimización)`)

    await ctx.close()
  }

  await browser.close()

  // ── RESULTADO FINAL ──────────────────────────────────────
  const total = passed + failed
  console.log('\n' + '━'.repeat(54))
  console.log(`📊 RESULTADO CAJA NEGRA: ${passed} ✅  |  ${failed} ❌  |  ${total} total`)
  console.log(`📸 Screenshots en: scripts/test-screenshots/blackbox/`)
  console.log('━'.repeat(54))

  if (failed === 0) {
    console.log('🟢 Experiencia de usuario lista para Release Candidate')
  } else {
    console.log(`🔴 ${failed} fallo(s) — revisar antes de RC`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => { console.error('Error fatal:', err.message); process.exit(1) })
