const { chromium } = require('playwright')

const BASE  = 'https://pruebatupagina-free.github.io/gasolineras-nl'
const SS    = 'C:/Users/Tibs/clientes-web/gasolineras-nl/scripts/test-screenshots'
const EMAIL = 'visual-test@gasonl.dev'
const PASS  = 'VisualTest2025!'

// Login via UI: landing → register page → click "Iniciar sesión" → login form → submit → /app
async function doLogin(page) {
  // Click main CTA (goes to /register)
  await page.locator('a:has-text("Abrir GasMap"), a:has-text("Abrir app"), a:has-text("Empezar gratis")').first().click()
  await page.waitForTimeout(1500)

  // Click "Iniciar sesión" link on register page → /login
  const loginLink = page.locator('a:has-text("Iniciar sesión"), a:has-text("Inicia sesión")').first()
  if (await loginLink.isVisible({ timeout: 4000 }).catch(() => false)) {
    await loginLink.click()
    await page.waitForTimeout(1000)
  }

  // Fill login form
  const emailInput = page.locator('input[name="email"], input[type="email"]').first()
  await emailInput.waitFor({ timeout: 10000 })
  await emailInput.fill(EMAIL)
  await page.locator('input[name="password"], input[type="password"]').first().fill(PASS)
  await page.locator('button[type="submit"]').click()

  // Wait for redirect to /app
  await page.waitForURL(/\/app/, { timeout: 25000 })
  await page.waitForTimeout(3500)

  // Dismiss onboarding if it appears
  const onb = page.locator('button:has-text("Comenzar"), button:has-text("Empezar"), button:has-text("Entendido"), button:has-text("Omitir")').first()
  if (await onb.isVisible({ timeout: 3000 }).catch(() => false)) {
    await onb.click()
    await page.waitForTimeout(1000)
  }
}

async function openDescuentosCard(page) {
  // On mobile, ensure Home tab is active before trying to click the card
  const homeTab = page.locator('.bottom-nav button[aria-label="Inicio"], .bottom-nav button:has(span:text("Inicio"))').first()
  if (await homeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await homeTab.click()
    await page.waitForTimeout(800)
  }

  await page.evaluate(() => window.scrollTo(0, 150))
  await page.waitForTimeout(500)
  const card = page.locator('text=Descuentos en gasolina').first()
  if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
    // force:true bypasses SVG/overlay interception from Leaflet map
    await card.click({ force: true })
    await page.waitForTimeout(1200)
    return true
  }
  return false
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // ── DESKTOP 1280px ──────────────────────────────────────
  console.log('\n🖥️  Desktop 1280px')
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      geolocation: { latitude: 25.648, longitude: -100.384 },
      permissions: ['geolocation'],
    })
    const p = await ctx.newPage()

    // Landing
    await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 40000 })
    await p.waitForTimeout(2000)
    await p.screenshot({ path: `${SS}/vis-01-desktop-landing.png`, fullPage: true })
    console.log('✅ vis-01-desktop-landing.png')

    // Login via UI
    await doLogin(p)
    await p.screenshot({ path: `${SS}/vis-02-desktop-home.png`, fullPage: false })
    console.log('✅ vis-02-desktop-home.png')

    // Descuentos modal
    const opened = await openDescuentosCard(p)
    await p.screenshot({ path: `${SS}/vis-03-desktop-descuentos.png`, fullPage: false })
    console.log(opened ? '✅ vis-03-desktop-descuentos.png' : '⚠️  vis-03 (card no visible, screenshot taken)')

    await ctx.close()
  }

  // ── MOBILE 375px ────────────────────────────────────────
  console.log('\n📱 Mobile 375px')
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      geolocation: { latitude: 25.648, longitude: -100.384 },
      permissions: ['geolocation'],
    })
    const p = await ctx.newPage()

    // Landing mobile
    await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 40000 })
    await p.waitForTimeout(2000)
    await p.screenshot({ path: `${SS}/vis-04-mobile-landing.png`, fullPage: false })
    console.log('✅ vis-04-mobile-landing.png')

    // Login via UI
    await doLogin(p)
    await p.screenshot({ path: `${SS}/vis-05-mobile-home.png`, fullPage: false })
    console.log('✅ vis-05-mobile-home.png')

    // Descuentos modal mobile
    const opened = await openDescuentosCard(p)
    await p.screenshot({ path: `${SS}/vis-06-mobile-descuentos.png`, fullPage: false })
    console.log(opened ? '✅ vis-06-mobile-descuentos.png' : '⚠️  vis-06 (card no visible, screenshot taken)')

    await ctx.close()
  }

  await browser.close()
  console.log('\n✅ Visuales completos — 6 screenshots en test-screenshots/')
})()
