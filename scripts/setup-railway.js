/**
 * Railway token extraction via Chrome CDP + deploy via Railway CLI
 */
const { chromium } = require('playwright')
const { execSync, spawnSync } = require('child_process')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const SRC_PROFILE = 'C:\\Users\\Tibs\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 7'
const TEMP_USER_DATA = path.join(os.tmpdir(), 'pw-atlas-userdata') // reuse same temp dir
const CDP_PORT = 9223
const PROJECT_NAME = 'gasonl-backend'

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name)
    try { if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d) } catch {}
  }
}

function generateSecret(len = 48) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  return Array.from({ length: len }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
async function waitCDP(port) {
  for (let i = 0; i < 25; i++) {
    try { const r = await fetch(`http://localhost:${port}/json/version`); if (r.ok) return } catch {}
    await wait(1000)
  }
  throw new Error('CDP timeout')
}

async function setupRailway() {
  const mongoUriFile = path.join(__dirname, '.mongodb-uri')
  if (!fs.existsSync(mongoUriFile)) throw new Error('Ejecuta setup-mongodb.js primero')
  const MONGODB_URI = fs.readFileSync(mongoUriFile, 'utf8').trim()
  console.log('✅ MongoDB URI:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'))

  const token = await getRailwayToken()
  const JWT_SECRET = generateSecret()
  await deployBackend(token, MONGODB_URI, JWT_SECRET)
}

async function getRailwayToken() {
  console.log('\n🔑 Obteniendo token de Railway...')

  // Ensure profile exists
  const defaultProfile = path.join(TEMP_USER_DATA, 'Default')
  if (!fs.existsSync(defaultProfile)) {
    console.log('📋 Copiando Profile 7...')
    copyDir(SRC_PROFILE, defaultProfile)
  }

  // Kill any existing Chrome on CDP port
  try {
    const procs = execSync(`netstat -ano 2>nul | findstr :${CDP_PORT}`, { encoding: 'utf8', shell: 'cmd' })
    const match = procs.match(/LISTENING\s+(\d+)/)
    if (match) execSync(`taskkill /PID ${match[1]} /F`, { shell: 'cmd' })
  } catch {}

  await wait(1000)

  const chrome = spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-first-run',
    'https://railway.app/account/tokens',
  ], { detached: false, stdio: 'ignore' })

  await waitCDP(CDP_PORT)
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]

  try {
    await wait(4000)
    await page.screenshot({ path: path.join(__dirname, 'railway-start.png') })
    const url = page.url()
    console.log('📍 URL actual:', url)

    const onRailway = url.includes('railway.app') || url.includes('railway.com')
    const loggedIn = onRailway && !url.includes('/login') && !url.includes('/signin')

    // Handle login if needed
    if (!loggedIn) {
      if (!url.includes('/login')) {
        await page.goto('https://railway.app/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
        await wait(2000)
      }

      const githubBtn = page.locator('button:has-text("GitHub"), a:has-text("Continue with GitHub"), a:has-text("GitHub")').first()
      if (await githubBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await githubBtn.click()
        console.log('⏳ Esperando auth con GitHub (hasta 5 min)...')
      } else {
        console.log('⚠️  Por favor inicia sesión en Railway en la ventana abierta...')
      }

      for (let i = 0; i < 60; i++) {
        await wait(5000)
        const u = page.url()
        const done = (u.includes('railway.app') || u.includes('railway.com')) &&
                     (u.includes('dashboard') || u.includes('project') || u.includes('account') || u.includes('tokens'))
        if (done) break
        if (i % 6 === 0 && i > 0) console.log(`  ⏳ ${i * 5}s...`)
        if (i === 59) throw new Error('Timeout Railway login')
      }
      console.log('✅ Login Railway exitoso')
    } else {
      console.log('✅ Ya autenticado en Railway')
    }

    // Navigate to tokens page
    await page.goto('https://railway.app/account/tokens', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await wait(3000)
    await page.screenshot({ path: path.join(__dirname, 'railway-tokens.png') })
    console.log('📸 Screenshot: railway-tokens.png')

    // Fill name FIRST, then Create button becomes enabled
    console.log('✏️  Llenando nombre del token...')
    const nameInput = page.locator('input[placeholder*="Token" i], input[placeholder*="Name" i], input[placeholder*="API" i]').first()
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('gasonl-deploy')
      await wait(500)
      console.log('✅ Nombre del token llenado')
    } else {
      // Fallback: fill first visible text input
      const allInputs = await page.$$('input[type="text"], input:not([type])')
      for (const inp of allInputs) {
        if (await inp.isVisible()) { await inp.fill('gasonl-deploy'); break }
      }
    }

    // Now click Create (should be enabled)
    await wait(500)
    const createBtn = page.locator('button:has-text("Create")').first()
    if (await createBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()
      console.log('✅ Token creado')
      await wait(2000)
    } else {
      // Force click even if disabled (sometimes the state is wrong)
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button')
        for (const btn of btns) {
          if (btn.textContent.trim() === 'Create') { btn.disabled = false; btn.click(); break }
        }
      })
      await wait(2000)
    }

    await page.screenshot({ path: path.join(__dirname, 'railway-new-token.png') })

    // Extract token
    let token = ''
    for (const input of await page.$$('input')) {
      const val = await input.inputValue().catch(() => '')
      if (val.length > 20) { token = val.trim(); break }
    }

    if (!token) {
      // Try to find token in code/pre elements
      for (const el of await page.$$('code, pre, [class*="token"]')) {
        const text = (await el.textContent() || '').trim()
        if (text.length > 20 && !text.includes(' ')) { token = text; break }
      }
    }

    // Try clipboard button
    if (!token) {
      for (const btn of await page.$$('button')) {
        const text = (await btn.textContent() || '').toLowerCase()
        const ariaLabel = (await btn.getAttribute('aria-label') || '').toLowerCase()
        if (text.includes('copy') || ariaLabel.includes('copy')) {
          await btn.click()
          await wait(500)
          token = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')
          if (token) break
        }
      }
    }

    await browser.close()
    chrome.kill()

    if (token && token.length > 20) {
      fs.writeFileSync(path.join(__dirname, '.railway-token'), token.trim())
      console.log('✅ Token de Railway obtenido y guardado')
      return token.trim()
    }

    // Check env variable
    if (process.env.RAILWAY_TOKEN) {
      console.log('✅ Usando RAILWAY_TOKEN del entorno')
      return process.env.RAILWAY_TOKEN
    }

    console.log('\n⚠️  Token no extraído automáticamente.')
    console.log('Revisa railway-tokens.png y railway-new-token.png')
    console.log('Copia el token manualmente y ejecuta:')
    console.log('  set RAILWAY_TOKEN=<tu_token>')
    console.log('  npm run setup:railway')
    process.exit(1)

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-railway.png') }).catch(() => {})
    await browser.close()
    chrome.kill()
    throw err
  }
}

async function deployBackend(token, mongodbUri, jwtSecret) {
  console.log('\n🚀 Desplegando backend en Railway...')
  const backendDir = path.join(__dirname, '..', 'backend')
  const env = { ...process.env, RAILWAY_TOKEN: token }

  // Check if already linked
  let isLinked = false
  try {
    const status = execSync('railway status', { cwd: backendDir, env, encoding: 'utf8' })
    console.log('📊 Status:', status.trim())
    isLinked = true
  } catch {}

  if (!isLinked) {
    console.log('📦 Iniciando proyecto Railway...')
    const r = spawnSync('railway', ['init', '--name', PROJECT_NAME], {
      cwd: backendDir, env, encoding: 'utf8', stdio: 'inherit'
    })
    if (r.status !== 0) throw new Error('railway init falló')
  }

  // Set environment variables
  console.log('🔧 Configurando variables de entorno...')
  const vars = {
    MONGODB_URI: mongodbUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: '7d',
    NODE_ENV: 'production',
    FRONTEND_URL: 'https://pruebatupagina-free.github.io/gasolineras-nl',
    CLIENT_URL: 'https://pruebatupagina-free.github.io/gasolineras-nl',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX: '100',
  }

  for (const [k, v] of Object.entries(vars)) {
    try {
      execSync(`railway variables set ${k}="${v}"`, { cwd: backendDir, env, encoding: 'utf8' })
      console.log(`  ✅ ${k}`)
    } catch (e) {
      console.warn(`  ⚠️  ${k}: ${e.message.split('\n')[0]}`)
    }
  }

  // Deploy
  console.log('\n📤 Subiendo código a Railway...')
  spawnSync('railway', ['up', '--detach'], { cwd: backendDir, env, stdio: 'inherit' })

  // Wait for deployment
  console.log('⏳ Esperando URL (hasta 30s)...')
  await wait(20000)

  let railwayUrl = ''

  // Try to get domain
  try {
    const out = execSync('railway domain', { cwd: backendDir, env, encoding: 'utf8' }).trim()
    railwayUrl = out.startsWith('http') ? out : `https://${out}`
  } catch {}

  // Try to create domain if doesn't exist
  if (!railwayUrl) {
    try {
      execSync('railway domain', { cwd: backendDir, env, encoding: 'utf8', input: '\n' })
      await wait(5000)
      const out = execSync('railway domain', { cwd: backendDir, env, encoding: 'utf8' }).trim()
      railwayUrl = out.startsWith('http') ? out : `https://${out}`
    } catch {}
  }

  // Try service info
  if (!railwayUrl) {
    try {
      const info = execSync('railway service', { cwd: backendDir, env, encoding: 'utf8' })
      const urlMatch = info.match(/https:\/\/[a-z0-9\-]+\.up\.railway\.app/)
      if (urlMatch) railwayUrl = urlMatch[0]
    } catch {}
  }

  if (railwayUrl) {
    console.log('\n✅ BACKEND DESPLEGADO:')
    console.log('  URL:', railwayUrl)
    console.log('  Health:', railwayUrl + '/api/health')
    fs.writeFileSync(path.join(__dirname, '.railway-url'), railwayUrl)
    fs.writeFileSync(path.join(__dirname, '.jwt-secret'), jwtSecret)
    console.log('💾 URL guardada en scripts/.railway-url')
  } else {
    console.log('\n⚠️  URL no detectada automáticamente.')
    console.log('Busca la URL en railway.app/dashboard y guárdala en scripts/.railway-url')
    fs.writeFileSync(path.join(__dirname, '.railway-url'), 'PENDING')
    fs.writeFileSync(path.join(__dirname, '.jwt-secret'), jwtSecret)
  }
}

setupRailway().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
