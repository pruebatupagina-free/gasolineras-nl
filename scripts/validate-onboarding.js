const { chromium } = require('playwright')
const path = require('path')
const SD = path.join(__dirname, 'test-screenshots')
const GEO = { latitude: 25.648, longitude: -100.384, accuracy: 10 }
const w = ms => new Promise(r => setTimeout(r, ms))
const BASE = 'https://pruebatupagina-free.github.io/gasolineras-nl'

let pass = 0, fail = 0
const ok = msg => { console.log('  ✅', msg); pass++ }
const ko = msg => { console.log('  ❌', msg); fail++ }
const snap = (p, n) => p.screenshot({ path: path.join(SD, n + '.png') }).catch(() => {})

async function register(page, nombre, email) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await w(1500)
  await page.locator('a').filter({ hasText: 'Abrir app' }).first().click()
  await w(2000)
  const ins = await page.locator('input').all()
  await ins[0].fill(nombre)
  await ins[1].fill(email)
  await ins[2].fill('TestPass2025!')
  await page.locator('button[type=submit]').click()
  await w(5000)
}

;(async () => {
  const b = await chromium.launch({ headless: true })

  // ── TEST 1: Nuevo usuario → onboarding visible ─────────────────────────────
  console.log('\n🧪 TEST 1: Usuario nuevo → onboarding debe aparecer')
  const ctx1 = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: GEO })
  const p1 = await ctx1.newPage()
  p1.on('pageerror', e => console.log('   🔴', e.message.slice(0, 80)))
  const email1 = 'val1_' + Date.now() + '@g.dev'
  await register(p1, 'ValTest1', email1)
  await snap(p1, 'val1-after-register')
  const ob1 = await p1.locator('text=Precios en tiempo real').count()
  ob1 > 0 ? ok('Onboarding aparece al registrar usuario nuevo') : ko('Onboarding NO apareció')

  // ── TEST 2: Navegar slides y completar ─────────────────────────────────────
  console.log('\n🧪 TEST 2: Navegar todos los slides y completar')
  for (let i = 0; i < 3; i++) {
    const sig = p1.locator('button', { hasText: /Siguiente/i })
    if (await sig.count() > 0) { await sig.click(); await w(500) }
  }
  await snap(p1, 'val2-slide4')
  const slide4 = await p1.locator('text=Instala la app').count()
  slide4 > 0 ? ok('Slide 4 visible') : ko('Slide 4 no apareció')

  const comenzar = p1.locator('button', { hasText: /Comenzar/i })
  if (await comenzar.count() > 0) {
    await comenzar.click()
    await w(1000)
    const obGone = await p1.locator('text=Precios en tiempo real').count()
    obGone === 0 ? ok('Onboarding cerrado al hacer clic en Comenzar') : ko('Onboarding sigue visible tras Comenzar')
  } else {
    ko('Botón Comenzar no encontrado')
  }

  // Verificar flag en localStorage
  const lsKeys = await p1.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('onboarding')))
  lsKeys.length > 0 ? ok('Flag guardado: ' + lsKeys[0]) : ko('Flag onboarding NO se guardó en localStorage')
  await snap(p1, 'val2-app-after-onboarding')

  // ── TEST 3: Mismo usuario hace logout y re-login → sin onboarding ──────────
  console.log('\n🧪 TEST 3: Re-login del mismo usuario → onboarding NO debe aparecer')
  // Ir a PerfilTab usando texto del nav
  await p1.locator('nav').getByText('Perfil').click()
  await w(1000)
  await snap(p1, 'val3-perfil')

  // Primer clic en Cerrar sesión (abre confirmación)
  await p1.locator('button').filter({ hasText: /Cerrar sesión/i }).first().click()
  await w(600)
  await snap(p1, 'val3-logout-confirm')

  // Segundo clic en Cerrar sesión (confirma)
  await p1.locator('button').filter({ hasText: /Cerrar sesión/i }).last().click()
  await w(3000)
  await snap(p1, 'val3-after-logout')

  // Verificar que estamos en login
  const url = p1.url()
  url.includes('login') ? ok('Redirigió a /login tras logout') : ko('No redirigió a /login: ' + url)

  // Login de nuevo con el mismo usuario
  const ins3 = await p1.locator('input').all()
  if (ins3.length >= 2) {
    await ins3[0].fill(email1)
    await ins3[1].fill('TestPass2025!')
    await p1.locator('button[type=submit]').click()
    await w(5000)
    await snap(p1, 'val3-after-relogin')
    const ob3 = await p1.locator('text=Precios en tiempo real').count()
    ob3 === 0 ? ok('Re-login: onboarding NO aparece (correcto — ya completado)') : ko('Re-login: onboarding aparece de nuevo (incorrecto)')
  } else {
    ko('Formulario de login no encontrado tras logout (URL: ' + p1.url() + ')')
  }
  await ctx1.close()

  // ── TEST 4: Usuario diferente en mismo dispositivo → onboarding aparece ────
  console.log('\n🧪 TEST 4: Usuario diferente → onboarding debe aparecer')
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: GEO })
  const p2 = await ctx2.newPage()
  p2.on('pageerror', e => console.log('   🔴', e.message.slice(0, 80)))
  const email2 = 'val2_' + Date.now() + '@g.dev'
  await register(p2, 'ValTest2', email2)
  await snap(p2, 'val4-new-user')
  const ob4 = await p2.locator('text=Precios en tiempo real').count()
  ob4 > 0 ? ok('Usuario diferente: onboarding aparece (correcto)') : ko('Usuario diferente: onboarding NO apareció')
  await ctx2.close()

  await b.close()
  console.log('\n' + '─'.repeat(44))
  console.log('Resultado final: ' + pass + ' ✅  ' + fail + ' ❌')
})()
