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

  // Register
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await w(1500)
  await p.locator('a').filter({ hasText: 'Abrir app' }).first().click()
  await w(2000)
  const ins = await p.locator('input').all()
  console.log('inputs encontrados:', ins.length)
  const email = 'dbg_' + Date.now() + '@g.dev'
  await ins[0].fill('Debug')
  await ins[1].fill(email)
  await ins[2].fill('TestPass2025!')
  await p.locator('button[type=submit]').click()
  await w(5000)

  // Leer localStorage antes de cerrar onboarding
  const lsBefore = await p.evaluate(() => {
    const r = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      r[k] = localStorage.getItem(k)
    }
    return r
  })
  console.log('\n📦 localStorage ANTES de cerrar onboarding:')
  Object.entries(lsBefore).forEach(([k, v]) => {
    const val = k === 'gasmap_user' ? JSON.parse(v) : v
    if (k === 'gasmap_user') {
      console.log('  gasmap_user._id =', val._id)
      console.log('  gasmap_user.id  =', val.id)
    } else {
      console.log(' ', k, '=', v?.slice(0, 60))
    }
  })

  // Cerrar onboarding con Omitir
  const skip = p.locator('button', { hasText: 'Omitir' })
  if (await skip.count() > 0) {
    await skip.click()
    await w(500)
  } else {
    console.log('Omitir no encontrado, buscando Comenzar...')
    // Navigate to last slide and click Comenzar
    for (let i = 0; i < 3; i++) {
      const sig = p.locator('button', { hasText: /Siguiente/i })
      if (await sig.count() > 0) { await sig.click(); await w(400) }
    }
    const com = p.locator('button', { hasText: /Comenzar/i })
    if (await com.count() > 0) { await com.click(); await w(500) }
  }

  // Leer localStorage después de cerrar onboarding
  const lsAfter = await p.evaluate(() => {
    const r = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      r[k] = localStorage.getItem(k)
    }
    return r
  })
  console.log('\n📦 localStorage DESPUÉS de cerrar onboarding:')
  Object.entries(lsAfter).forEach(([k, v]) => {
    console.log(' ', k, '=', v?.slice(0, 80))
  })

  const onboardingKeys = Object.keys(lsAfter).filter(k => k.startsWith('onboardingCompleted'))
  console.log('\n🔑 Keys de onboarding guardadas:', onboardingKeys)

  await b.close()
})()
