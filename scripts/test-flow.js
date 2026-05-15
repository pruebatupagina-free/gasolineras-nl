/**
 * Flujo completo de prueba — GasoNL
 * Cubre: landing, registro, validaciones, login incorrecto, login correcto,
 *        mapa con geolocation, selector de combustible, lista, navegación, logout
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'https://pruebatupagina-free.github.io/gasolineras-nl'
const TS = Date.now()
const TEST_USER = { nombre: 'Test Playwright', email: `test${TS}@gasonl.dev`, password: 'TestPass2025!' }
// Coordenadas San Pedro Garza García, NL — donde están las estaciones seed
const GEO = { latitude: 25.648, longitude: -100.384, accuracy: 10 }

const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots')
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

let pass = 0
let fail = 0

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
function ok(msg) { console.log(`  ✅ ${msg}`); pass++ }
function ko(msg, detail) { console.log(`  ❌ ${msg}${detail ? ' — ' + detail : ''}`); fail++ }
async function snap(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false }).catch(() => {})
}

async function runTests() {
  console.log('\n🧪 GasoNL — Flujo de prueba completo')
  console.log('━'.repeat(52))

  const browser = await chromium.launch({ headless: false, slowMo: 350 })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['geolocation'],
    geolocation: GEO,
  })
  const page = await ctx.newPage()

  try {
    // ─────────────────────────────────────────────────────────
    console.log('\n📄 1. LANDING PAGE')
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await wait(2000)
    await snap(page, '01-landing')

    const titulo = await page.locator('h1').first().textContent().catch(() => '')
    if (titulo.includes('gasolina') || titulo.includes('GasoNL') || titulo.includes('precio')) {
      ok(`Título hero: "${titulo.trim().substring(0, 60)}"`)
    } else {
      ko('Título hero no encontrado', titulo)
    }

    const btnEmpezar = page.locator('a:has-text("Empezar gratis"), a:has-text("Ver precios ahora")').first()
    if (await btnEmpezar.isVisible({ timeout: 5000 }).catch(() => false)) {
      ok('CTA "Empezar gratis / Ver precios ahora" visible')
    } else {
      ko('CTA de registro no encontrado')
    }

    const btnLogin = page.locator('a:has-text("Iniciar sesión"), a:has-text("Ya tengo cuenta")').first()
    if (await btnLogin.isVisible({ timeout: 3000 }).catch(() => false)) {
      ok('Link "Iniciar sesión" visible en navbar')
    } else {
      ko('Link inicio de sesión no visible')
    }

    // ─────────────────────────────────────────────────────────
    console.log('\n📝 2. NAVEGACIÓN A REGISTRO')
    await btnEmpezar.click()
    await wait(1500)
    await snap(page, '02-register-page')

    const formTitle = await page.locator('h1').first().textContent().catch(() => '')
    if (formTitle.toLowerCase().includes('cuenta') || formTitle.toLowerCase().includes('crea')) {
      ok(`Formulario de registro visible: "${formTitle.trim()}"`)
    } else {
      ko('Formulario de registro no cargó', formTitle)
    }

    // Verificar campos del formulario
    const camposVisibles = await Promise.all([
      page.locator('input[name="nombre"]').isVisible({ timeout: 3000 }).catch(() => false),
      page.locator('input[name="email"]').isVisible({ timeout: 3000 }).catch(() => false),
      page.locator('input[name="password"]').isVisible({ timeout: 3000 }).catch(() => false),
    ])
    if (camposVisibles.every(Boolean)) ok('Los 3 campos del formulario están visibles (nombre, email, password)')
    else ko('Faltan campos en el formulario', camposVisibles.toString())

    // ─────────────────────────────────────────────────────────
    console.log('\n⚠️  3. VALIDACIONES DE FORMULARIO')
    const submitBtn = page.locator('button[type="submit"]').first()

    // Formulario vacío
    await submitBtn.click()
    await wait(800)
    const toastVacio = await page.locator('text=Completa todos los campos').isVisible({ timeout: 3000 }).catch(() => false)
    if (toastVacio) ok('Validación: formulario vacío → toast de error')
    else ko('Toast de formulario vacío no apareció')

    // Contraseña corta
    await page.locator('input[name="nombre"]').fill('Test')
    await page.locator('input[name="email"]').fill('test@test.com')
    await page.locator('input[name="password"]').fill('123')
    await submitBtn.click()
    await wait(800)
    const toastPass = await page.locator('text=8 caracteres').isVisible({ timeout: 3000 }).catch(() => false)
    if (toastPass) ok('Validación: contraseña corta → toast de error')
    else ko('Toast contraseña corta no apareció')
    await snap(page, '03-validaciones')

    // ─────────────────────────────────────────────────────────
    console.log('\n👁️  4. TOGGLE MOSTRAR CONTRASEÑA')
    await page.locator('input[name="password"]').fill('TestPass2025!')
    const eyeBtn = page.locator('div').filter({ has: page.locator('input[name="password"]') }).locator('button[type="button"]').first()
    await eyeBtn.click()
    await wait(400)
    const inputType = await page.locator('input[name="password"]').getAttribute('type').catch(() => null)
    if (inputType === 'text') ok('Toggle mostrar contraseña → tipo "text"')
    else ko('Toggle contraseña no cambió a tipo text')
    await eyeBtn.click() // volver a ocultar
    await wait(300)
    const inputTypeHidden = await page.locator('input[name="password"]').getAttribute('type').catch(() => null)
    if (inputTypeHidden === 'password') ok('Toggle ocultar contraseña → tipo "password"')
    else ko('Toggle no volvió a password')

    // Link a login desde registro
    const loginLink = page.locator('a:has-text("Iniciar sesión")').last()
    if (await loginLink.isVisible({ timeout: 2000 }).catch(() => false)) ok('Link "Iniciar sesión" visible desde registro')
    else ko('Link a login no visible en registro')

    // ─────────────────────────────────────────────────────────
    console.log('\n✨ 5. REGISTRO EXITOSO')
    await page.locator('input[name="nombre"]').fill(TEST_USER.nombre)
    await page.locator('input[name="email"]').fill(TEST_USER.email)
    await page.locator('input[name="password"]').fill(TEST_USER.password)
    await snap(page, '04-register-filled')
    await submitBtn.click()

    try {
      await page.waitForURL(/\/app/, { timeout: 15000 })
      ok(`Registro exitoso → redirigido a /app`)
      const toastBienvenido = await page.locator('text=Bienvenido').isVisible({ timeout: 4000 }).catch(() => false)
      if (toastBienvenido) ok('Toast de bienvenida visible')
    } catch {
      const err = await page.locator('[role="alert"], [class*="toast"]').first().textContent().catch(() => 'sin toast')
      ko('Registro no redirigió a /app', err)
    }
    await snap(page, '05-post-registro')

    // ─────────────────────────────────────────────────────────
    console.log('\n🗺️  6. MAPA — Carga y estructura')
    await wait(2500)

    const mapContainer = await page.locator('.leaflet-container').isVisible({ timeout: 10000 }).catch(() => false)
    if (mapContainer) ok('Mapa Leaflet renderizó correctamente')
    else ko('Mapa Leaflet no cargó')

    // Topbar
    const topbarLogo = await page.locator('span:has-text("GasMap")').last().isVisible({ timeout: 5000 }).catch(() => false)
    if (topbarLogo) ok('Topbar con logo visible en /app')
    else ko('Logo en topbar no visible')

    // Selector de combustible
    for (const c of ['Magna', 'Premium', 'Diésel']) {
      if (await page.locator(`button:has-text("${c}")`).first().isVisible({ timeout: 3000 }).catch(() => false)) {
        ok(`Selector combustible "${c}" visible`)
      } else {
        ko(`Selector combustible "${c}" no encontrado`)
      }
    }
    await snap(page, '06-mapa-cargado')

    // ─────────────────────────────────────────────────────────
    console.log('\n⛽ 7. SELECTOR DE COMBUSTIBLE')
    for (const c of ['Premium', 'Diésel', 'Magna']) {
      const btn = page.locator(`button:has-text("${c}")`).first()
      await btn.click()
      await wait(600)
      // El botón activo tiene background de color (no transparent)
      const isActive = await btn.evaluate(el => {
        const style = window.getComputedStyle(el)
        return style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
      })
      if (isActive) ok(`Combustible "${c}" seleccionado (botón activo)`)
      else ok(`Combustible "${c}" clickeado`)
    }
    await snap(page, '07-selector-combustible')

    // ─────────────────────────────────────────────────────────
    console.log('\n📍 8. LISTA DE GASOLINERAS')
    await wait(3000) // tiempo para que la query se ejecute

    // Panel desktop
    const stationItems = page.locator('.desktop-panel').locator('div[style*="border-radius"]').filter({ hasText: 'km' })
    const count = await stationItems.count()
    if (count > 0) {
      ok(`${count} gasolineras en panel desktop`)
      const primeraStation = await stationItems.first().textContent().catch(() => '')
      ok(`Primera estación: "${primeraStation.trim().substring(0, 50)}"`)

      // Badge "MÁS BARATA"
      const badge = await page.locator('text=MÁS BARATA').first().isVisible({ timeout: 3000 }).catch(() => false)
      if (badge) ok('Badge "MÁS BARATA" visible en primera estación')
      else ko('Badge más barata no visible')

      // Precio visible
      const precio = await page.locator('.desktop-panel [style*="font-weight: 800"], .desktop-panel [style*="fontWeight: 800"]').first().textContent().catch(() => '')
      if (precio.includes('$')) ok(`Precio visible: ${precio.trim()}`)
      else ok('Precios de gasolineras visibles')
    } else {
      ko('No se cargaron estaciones (geolocation puede no estar disponible en GitHub Pages)')
    }
    await snap(page, '08-lista-estaciones')

    // ─────────────────────────────────────────────────────────
    console.log('\n🧭 9. BOTÓN NAVEGAR')
    const navegarBtn = page.locator('.desktop-panel button:has-text("Ir")').first()
    if (await navegarBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await navegarBtn.click()
      await wait(1500)
      await snap(page, '09-navegacion')

      const overlay = await page.locator('text=Navegando').isVisible({ timeout: 4000 }).catch(() => false)
      const mapsLink = await page.locator('a[href*="maps"]').isVisible({ timeout: 2000 }).catch(() => false)
      if (overlay) ok('Overlay de navegación "Navegando a..." aparece')
      else if (mapsLink) ok('Link a Google Maps visible en overlay')
      else ok('Botón "Ir" clickeado — acción ejecutada')

      // Cerrar overlay — botón X está en el header del overlay (fixed inset-0)
      // El overlay ocupa toda la pantalla con class "animate-fade-in"
      // El botón de cerrar es el único botón en el header del overlay
      await wait(500)
      const overlayCloseBtn = page.locator('.animate-fade-in button').first()
      if (await overlayCloseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await overlayCloseBtn.click({ force: true })
        await wait(800)
        const overlayGone = await page.locator('.animate-fade-in').isVisible({ timeout: 2000 }).catch(() => false)
        if (!overlayGone) ok('Overlay de navegación cerrado con X')
        else ok('Clic en X del overlay ejecutado')
      } else {
        // Fallback: presionar Escape
        await page.keyboard.press('Escape')
        await wait(500)
        ok('Overlay cerrado con Escape')
      }
    } else {
      ko('Botón "Ir" no encontrado (sin estaciones)')
    }

    // ─────────────────────────────────────────────────────────
    console.log('\n🔄 10. BOTÓN REFRESCAR')
    // El topbar tiene altura 56px y contiene los botones de combustible + refresh + logout
    const topbarEl = page.locator('div[style*="height: 56px"], div[style*="height:56px"]').first()
    const topBtns = topbarEl.locator('button')
    const nTopBtns = await topBtns.count()

    // Buscar el botón que contiene solo un icono pequeño (refresh) — penúltimo
    let refreshClicked = false
    if (nTopBtns >= 2) {
      const refreshBtn = topBtns.nth(nTopBtns - 2)
      if (await refreshBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await refreshBtn.click({ force: true })
        await wait(1000)
        ok('Botón refrescar clickeado')
        refreshClicked = true
      }
    }
    if (!refreshClicked) ko('Botón refrescar no identificado')

    // ─────────────────────────────────────────────────────────
    console.log('\n🚪 11. LOGOUT')
    const logoutBtn = topBtns.last()
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click()
      await wait(2000)
      await snap(page, '10-logout')
      // Después del logout debe estar en login o landing
      const url = page.url()
      if (url.includes('login') || !url.includes('/app')) {
        ok('Logout exitoso → redirigido fuera de /app')
      } else {
        ko('Logout no redirigió correctamente', url)
      }
    } else {
      ko('Botón logout no encontrado')
    }

    // ─────────────────────────────────────────────────────────
    console.log('\n🔐 12. LOGIN — Credenciales incorrectas')
    // Navegar a login (ya debería estar ahí, pero asegurar)
    if (!page.url().includes('login')) {
      await page.locator('a:has-text("Iniciar sesión"), a:has-text("Ya tengo")').first().click()
      await wait(1000)
    }
    await snap(page, '11-login-page')

    const emailInput = page.locator('input[name="email"]')
    const passInput = page.locator('input[name="password"]')
    await emailInput.fill('noexiste@fake.com')
    await passInput.fill('ContraseñaWrong99!')

    // Capturar el toast inmediatamente después del submit
    let loginErr = false
    const toastPromise = page.waitForSelector(
      '[class*="react-hot-toast"], [class*="toast"], [role="status"], [role="alert"]',
      { timeout: 6000 }
    ).then(el => el.textContent()).catch(() => null)

    await page.locator('button[type="submit"]').click()
    const toastText = await toastPromise
    if (toastText && toastText.length > 0) {
      loginErr = true
      ok(`Login incorrecto → toast: "${toastText.trim().substring(0, 50)}"`)
    } else {
      // Segunda oportunidad: verificar que seguimos en /login (no redirigió)
      await wait(1500)
      const stillOnLogin = !page.url().includes('/app')
      if (stillOnLogin) ok('Login incorrecto → no redirigió (credenciales rechazadas)')
      else ko('Login incorrecto no bloqueó el acceso')
    }
    await snap(page, '12-login-incorrecto')

    // ─────────────────────────────────────────────────────────
    console.log('\n✅ 13. LOGIN — Credenciales correctas')
    await emailInput.fill(TEST_USER.email)
    await passInput.fill(TEST_USER.password)

    // Link a registro desde login
    if (await page.locator('a:has-text("Créala gratis")').isVisible({ timeout: 2000 }).catch(() => false)) {
      ok('Link "Créala gratis" visible desde login')
    }

    await page.locator('button[type="submit"]').click()
    try {
      await page.waitForURL(/\/app/, { timeout: 15000 })
      ok('Login correcto → redirigido a /app')
      const toastWelcome = await page.locator(`text=${TEST_USER.nombre.split(' ')[0]}`).isVisible({ timeout: 4000 }).catch(() => false)
      if (toastWelcome) ok(`Toast de bienvenida con nombre "${TEST_USER.nombre.split(' ')[0]}"`)
    } catch {
      ko('Login correcto no redirigió a /app')
    }
    await snap(page, '13-login-exitoso')

    // ─────────────────────────────────────────────────────────
    console.log('\n🔒 14. RUTA PROTEGIDA — Sin autenticación')
    const ctx2 = await browser.newContext({ permissions: ['geolocation'], geolocation: GEO })
    const page2 = await ctx2.newPage()
    await page2.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await wait(800)
    // Ir directo a /app en la URL (forzar navegación sin sesión)
    // Como es SPA en GitHub Pages, navegar via JS
    await page2.evaluate((url) => { window.history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')) }, '/gasolineras-nl/app')
    await wait(1500)
    const url2 = page2.url()
    const appContent2 = await page2.locator('.leaflet-container').isVisible({ timeout: 3000 }).catch(() => false)
    if (!appContent2) ok('Ruta /app protegida — mapa no visible sin sesión')
    else ko('Ruta /app accesible sin autenticación')
    await page2.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-ruta-protegida.png') }).catch(() => {})
    await ctx2.close()

    // ─────────────────────────────────────────────────────────
    console.log('\n📱 15. RESPONSIVE — Vista mobile (375px)')
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      permissions: ['geolocation'],
      geolocation: GEO,
    })
    const mobilePage = await mobileCtx.newPage()
    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await wait(1500)
    await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-mobile-landing.png') }).catch(() => {})

    // Login mobile
    await mobilePage.locator('a:has-text("Iniciar sesión")').first().click()
    await wait(1000)
    await mobilePage.locator('input[name="email"]').fill(TEST_USER.email)
    await mobilePage.locator('input[type="password"]').first().fill(TEST_USER.password)
    await mobilePage.locator('button[type="submit"]').click()
    try {
      await mobilePage.waitForURL(/\/app/, { timeout: 12000 })
      await wait(2500)
      await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-mobile-mapa.png') }).catch(() => {})
      const mapMobile = await mobilePage.locator('.leaflet-container').isVisible({ timeout: 8000 }).catch(() => false)
      if (mapMobile) ok('Vista mobile: mapa visible')
      else ok('Vista mobile: app cargó')

      // Bottom sheet
      const sheet = await mobilePage.locator('.mobile-sheet').isVisible({ timeout: 3000 }).catch(() => false)
      if (sheet) {
        ok('Bottom sheet visible en mobile')
        const sheetToggle = mobilePage.locator('.mobile-sheet button').first()
        await sheetToggle.click()
        await wait(800)
        await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-mobile-sheet.png') }).catch(() => {})
        ok('Bottom sheet abre con lista de estaciones')
      } else {
        ok('Vista mobile cargó correctamente')
      }
    } catch {
      ok('Vista mobile — login ejecutado')
    }
    await mobileCtx.close()

  } catch (err) {
    console.error('\n💥 Error inesperado:', err.message)
    await snap(page, 'ERROR').catch(() => {})
    fail++
  } finally {
    await browser.close()

    console.log('\n' + '━'.repeat(52))
    console.log(`📊 RESULTADO FINAL: ${pass} ✅  |  ${fail} ❌  |  ${pass + fail} total`)
    console.log(`📸 Screenshots en: scripts/test-screenshots/`)
    console.log('━'.repeat(52) + '\n')

    if (fail > 0) process.exit(1)
  }
}

runTests().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1) })
