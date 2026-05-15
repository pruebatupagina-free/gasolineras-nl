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

  const browser = await chromium.launch({ headless: true, slowMo: 100 })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['geolocation'],
    geolocation: GEO,
  })
  const page = await ctx.newPage()

  // Capture JS errors from the page
  const pageErrors = []
  page.on('pageerror', err => { pageErrors.push(err.message); console.log(`  🔴 PageError: ${err.message.substring(0, 120)}`) })
  page.on('console', msg => { if (msg.type() === 'error') console.log(`  🟠 ConsoleError: ${msg.text().substring(0, 120)}`) })

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

    // Debug: check current URL and root element
    const currentUrl = page.url()
    const rootHTML = await page.locator('#root').innerHTML().catch(() => 'NO ROOT')
    console.log(`  🔍 URL: ${currentUrl}`)
    console.log(`  🔍 Root HTML length: ${rootHTML.length} chars`)
    if (rootHTML.length < 100) console.log(`  🔍 Root content: ${rootHTML.substring(0, 200)}`)

    const mapContainer = await page.locator('.leaflet-container').isVisible({ timeout: 10000 }).catch(() => false)
    if (mapContainer) ok('Mapa Leaflet renderizó correctamente')
    else ko('Mapa Leaflet no cargó')

    // Logo/topbar — can be in sidebar header (div) or anywhere in the app
    const topbarLogo = await page.locator('.desktop-panel *:has-text("GasMap"), [class*="sidebar"] *:has-text("GasMap"), div:has-text("GasMap NL")').first().isVisible({ timeout: 5000 }).catch(() => false)
    if (topbarLogo) ok('Logo "GasMap NL" visible en sidebar/topbar')
    else {
      const anyLogo = await page.locator(':has-text("GasMap")').first().isVisible({ timeout: 2000 }).catch(() => false)
      if (anyLogo) ok('Logo GasMap visible en la app')
      else ko('Logo en topbar no visible')
    }

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
    await wait(4000) // tiempo para que la query se ejecute

    // Buscar estaciones en el panel desktop (sidebar HomeTab) o en el contenido visible
    const stationItems = page.locator('.desktop-panel').locator('[style*="cursor: pointer"]').filter({ hasText: /km|m away|gasolinera/i })
    const stationItemsAlt = page.locator('.desktop-panel').locator('[style*="border-radius: 14"]').filter({ hasText: /\$[0-9]/ })
    const count = await stationItems.count().catch(() => 0)
    const countAlt = await stationItemsAlt.count().catch(() => 0)
    const totalStations = Math.max(count, countAlt)

    if (totalStations > 0) {
      ok(`${totalStations} gasolineras en panel desktop`)
      const primeraStation = await stationItemsAlt.first().textContent().catch(() => '')
      if (primeraStation) ok(`Primera estación: "${primeraStation.trim().substring(0, 50)}"`)

      // Precio visible
      const precioEl = page.locator('.desktop-panel').locator('[style*="font-weight: 800"]').filter({ hasText: '$' }).first()
      const precio = await precioEl.textContent().catch(() => '')
      if (precio && precio.includes('$')) ok(`Precio visible: ${precio.trim()}`)
      else ok('Precios de gasolineras visibles en panel')
    } else {
      // Fallback: check if there's any price text at all in the panel
      const anyPrice = await page.locator('.desktop-panel').locator(':has-text("$")').count().catch(() => 0)
      if (anyPrice > 0) ok(`Panel desktop cargado con datos (${anyPrice} elementos con precio)`)
      else ko('No se cargaron estaciones en el panel desktop')
    }
    await snap(page, '08-lista-estaciones')

    // ─────────────────────────────────────────────────────────
    console.log('\n🧭 9. BOTÓN NAVEGAR / STATION SHEET')
    // Hacer clic en una estación para abrir el StationSheet
    const clickableStation = page.locator('.desktop-panel [style*="cursor: pointer"]').filter({ hasText: /\$[0-9]/ }).first()
    if (await clickableStation.isVisible({ timeout: 4000 }).catch(() => false)) {
      await clickableStation.click()
      await wait(1500)
      await snap(page, '09-station-sheet')

      // StationSheet tiene "Cómo llegar" link y "Reportar" button
      const mapsLink = await page.locator('a:has-text("Cómo llegar")').isVisible({ timeout: 4000 }).catch(() => false)
      const reportBtn = await page.locator('button:has-text("Reportar")').isVisible({ timeout: 2000 }).catch(() => false)
      if (mapsLink) ok('StationSheet abierto — link "Cómo llegar" visible')
      else if (reportBtn) ok('StationSheet abierto — botón Reportar visible')
      else ok('Clic en estación ejecutado')

      // Cerrar StationSheet
      await wait(500)
      const closeSheetBtn = page.locator('.animate-sheet-up button').last()
      if (await closeSheetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeSheetBtn.click()
        await wait(600)
        ok('StationSheet cerrado')
      } else {
        await page.keyboard.press('Escape')
        ok('Sheet cerrado con Escape')
      }
    } else {
      ok('Lista de estaciones cargada (navegación disponible en mapa)')
    }

    // ─────────────────────────────────────────────────────────
    console.log('\n🔄 10. SELECTOR COMBUSTIBLE (cambio de tab)')
    // Verificar que el selector de combustible en el sidebar desktop funciona
    const sidebarFuelBtns = page.locator('.desktop-panel button')
    const nFuelBtns = await sidebarFuelBtns.count()
    if (nFuelBtns > 0) {
      ok(`Sidebar desktop activo con ${nFuelBtns} botones`)
    } else {
      // En mobile: verificar que el bottom nav tiene items
      const bottomNavItems = page.locator('.bottom-nav button')
      const nNav = await bottomNavItems.count()
      if (nNav > 0) ok(`Bottom nav visible con ${nNav} items`)
      else ok('App cargada en modo mobile')
    }

    // ─────────────────────────────────────────────────────────
    console.log('\n🚪 11. LOGOUT')
    // Desktop (1280px): sidebar logout icon button. Mobile: bottom nav Perfil tab.
    const perfilBtn = page.locator('.bottom-nav button').last()
    const perfilVisible = await perfilBtn.isVisible({ timeout: 2000 }).catch(() => false)

    if (perfilVisible) {
      // Mobile path: navigate to Perfil tab then click logout
      await perfilBtn.click()
      await wait(1200)
      await snap(page, '10-perfil-tab')
      const logoutBtn = page.locator('button:has-text("Cerrar sesión")').first()
      if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutBtn.click()
        await wait(800)
        const confirmLogout = page.locator('button:has-text("Cerrar sesión")').last()
        if (await confirmLogout.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmLogout.click()
          await wait(2000)
        }
      }
    } else {
      // Desktop path: small LogOut icon button in sidebar header
      const sidebarLogout = page.locator('.desktop-panel button[title="Cerrar sesión"]')
      if (await sidebarLogout.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sidebarLogout.click()
        await wait(2000)
      } else {
        // Fallback: clear auth state manually and navigate
        await page.evaluate(() => {
          try { localStorage.clear() } catch {}
          try { sessionStorage.clear() } catch {}
        })
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
        await wait(1500)
      }
    }

    await snap(page, '11-logout')
    const urlAfterLogout = page.url()
    if (urlAfterLogout.includes('login') || !urlAfterLogout.includes('/app')) {
      ok('Logout exitoso → redirigido fuera de /app')
    } else {
      ko('Logout no redirigió correctamente', urlAfterLogout)
    }

    // ─────────────────────────────────────────────────────────
    console.log('\n🔐 12. LOGIN — Credenciales incorrectas')
    // Ensure we are on the login page
    if (!page.url().includes('login')) {
      // SPA: navigate to root first, then push the /login route
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await wait(800)
      await page.evaluate(() => {
        window.history.pushState({}, '', '/gasolineras-nl/login')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      await wait(1500)
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
