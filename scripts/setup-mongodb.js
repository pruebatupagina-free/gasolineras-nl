/**
 * MongoDB Atlas setup — launches Chrome directly (minimal flags) + Playwright via CDP
 * This avoids Google's automation detection
 */
const { chromium } = require('playwright')
const { spawn, execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const SRC_PROFILE = 'C:\\Users\\Tibs\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 7'
const TEMP_PROFILE = path.join(os.tmpdir(), 'pw-atlas-profile')
const DB_NAME = 'gasonl'
const DB_USER = 'gasonl_user'
const DB_PASS = 'GasoNL2025Secure'
const CLUSTER_NAME = 'GasoNLCluster'
const CDP_PORT = 9222

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    try {
      if (entry.isDirectory()) copyDir(s, d)
      else fs.copyFileSync(s, d)
    } catch {}
  }
}

function waitMs(ms) { return new Promise(r => setTimeout(r, ms)) }

async function waitForCDP(port, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(`http://localhost:${port}/json/version`)
      if (r.ok) return true
    } catch {}
    await waitMs(1000)
  }
  throw new Error(`CDP no disponible en puerto ${port}`)
}

async function setupMongoDB() {
  // Copy profile if needed
  if (!fs.existsSync(TEMP_PROFILE)) {
    console.log('📋 Copiando Profile 7 completo a directorio temporal...')
    console.log('   (Incluye cookies, sesiones guardadas, etc.)')
    copyDir(SRC_PROFILE, TEMP_PROFILE)
    // Copy "Default" structure so Chrome can use it as default profile
    const defaultDir = path.join(path.dirname(TEMP_PROFILE), 'Default-gasonl')
    // Actually we need a full user data dir with this as the Default profile
    console.log('✅ Perfil copiado')
  } else {
    console.log('✅ Usando perfil temporal existente')
  }

  // Create user data dir structure that Chrome understands
  // Chrome expects: UserDataDir/Default (the actual profile)
  const tempUserData = path.join(os.tmpdir(), 'pw-atlas-userdata')
  const defaultProfile = path.join(tempUserData, 'Default')

  if (!fs.existsSync(defaultProfile)) {
    console.log('📋 Preparando estructura de user data...')
    copyDir(SRC_PROFILE, defaultProfile)
    console.log('✅ Estructura lista')
  }

  // Kill any existing Chrome on CDP port
  try { execSync(`netstat -ano | findstr :${CDP_PORT}`, { encoding: 'utf8' }) } catch {}

  // Launch Chrome with minimal flags - no automation flags
  console.log(`🚀 Lanzando Chrome con CDP en puerto ${CDP_PORT}...`)
  const chromeProcess = spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempUserData}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://cloud.mongodb.com',
  ], {
    detached: false,
    stdio: 'ignore',
  })

  chromeProcess.on('error', err => console.error('Chrome error:', err.message))

  // Wait for Chrome to start
  console.log('⏳ Esperando que Chrome inicie...')
  await waitForCDP(CDP_PORT)
  console.log('✅ Chrome CDP activo')

  // Connect Playwright via CDP
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
  console.log('✅ Playwright conectado via CDP')

  const contexts = browser.contexts()
  const context = contexts[0] || await browser.newContext()
  const pages = context.pages()
  const page = pages[0] || await context.newPage()

  try {
    await waitMs(3000)
    const url = page.url()
    console.log('📍 URL:', url)

    const needsLogin = url.includes('login') || url.includes('signin') || url.includes('account.mongodb.com')

    if (needsLogin) {
      console.log('\n⚠️  Por favor inicia sesión en MongoDB Atlas.')
      console.log('   El navegador está abierto. Inicia sesión y espera...')
      console.log('   Esperando hasta 5 minutos...\n')

      for (let i = 0; i < 60; i++) {
        await waitMs(5000)
        const u = page.url()
        if (u.includes('cloud.mongodb.com') && !u.includes('login') && !u.includes('signin') && !u.includes('account.mongodb.com')) {
          console.log('✅ Login detectado')
          break
        }
        if (i % 6 === 0 && i > 0) console.log(`  ⏳ ${i * 5}s esperando login...`)
        if (i === 59) throw new Error('Timeout esperando login de MongoDB Atlas')
      }
    } else {
      console.log('✅ Sesión activa en MongoDB Atlas')
    }

    await waitMs(2000)
    await page.goto('https://cloud.mongodb.com/v2#/clusters', { waitUntil: 'networkidle', timeout: 30000 })
    await waitMs(3000)

    const content = await page.content()
    if (!content.includes(CLUSTER_NAME)) {
      await createCluster(page)
    } else {
      console.log(`✅ Cluster "${CLUSTER_NAME}" ya existe`)
    }

    await setupDBUser(page)
    await setupNetworkAccess(page)
    const connString = await getConnectionString(page)

    await browser.close()
    chromeProcess.kill()
    return connString

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-mongodb.png') }).catch(() => {})
    await browser.close()
    chromeProcess.kill()
    throw err
  }
}

async function createCluster(page) {
  console.log('🆕 Creando cluster M0 gratuito...')

  for (const sel of ['button:has-text("Create")', 'a:has-text("Build a Database")', 'button:has-text("+ Create")']) {
    const btn = page.locator(sel).first()
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) { await btn.click(); break }
  }

  await waitMs(3000)

  for (const sel of ['text=M0', '[data-tier="M0"]', 'h2:has-text("M0")', 'h3:has-text("M0")']) {
    const el = page.locator(sel).first()
    if (await el.isVisible({ timeout: 1500 }).catch(() => false)) { await el.click(); console.log('✅ M0 Free'); break }
  }

  await waitMs(1000)

  const nameInput = page.locator('input[placeholder*="Cluster" i]').first()
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.selectText()
    await nameInput.fill(CLUSTER_NAME)
    console.log(`✅ Nombre: ${CLUSTER_NAME}`)
  }

  for (const sel of ['button:has-text("Create Cluster")', 'button:has-text("Create Deployment")', 'button:has-text("Create")']) {
    const btn = page.locator(sel).last()
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) { await btn.click(); break }
  }

  console.log('⏳ Esperando cluster (1-3 min)...')
  for (let i = 0; i < 24; i++) {
    await waitMs(15000)
    const c = await page.content()
    if (!c.includes('Creating') && !c.includes('Provisioning') && !c.includes('Deploying')) { console.log('✅ Cluster listo'); break }
    process.stdout.write(`  ${(i + 1) * 15}s `)
  }
  console.log('')
}

async function setupDBUser(page) {
  console.log('👤 Configurando usuario de BD...')
  await page.goto('https://cloud.mongodb.com/v2#/security/database/users', { waitUntil: 'networkidle', timeout: 30000 })
  await waitMs(2000)

  if (await page.$(`text=${DB_USER}`)) { console.log(`✅ Usuario ya existe`); return }

  for (const sel of ['button:has-text("Add New Database User")', 'button:has-text("Add Database User")']) {
    const btn = page.locator(sel).first()
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) { await btn.click(); break }
  }

  await waitMs(2000)
  await page.locator('input[name="username"], input[placeholder*="username" i]').first().fill(DB_USER).catch(() => {})
  await page.locator('input[type="password"]').first().fill(DB_PASS).catch(() => {})
  await page.locator('button:has-text("Add User"), button[type="submit"]').last().click().catch(() => {})
  await waitMs(2000)
  console.log(`✅ Usuario creado: ${DB_USER}`)
}

async function setupNetworkAccess(page) {
  console.log('🌐 Configurando acceso de red...')
  await page.goto('https://cloud.mongodb.com/v2#/security/network/accessList', { waitUntil: 'networkidle', timeout: 30000 })
  await waitMs(2000)

  if (await page.$('text=0.0.0.0/0')) { console.log('✅ Ya configurado (0.0.0.0/0)'); return }

  for (const sel of ['button:has-text("Add IP Address")', 'button:has-text("+ Add IP Address")']) {
    const btn = page.locator(sel).first()
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) { await btn.click(); break }
  }

  await waitMs(1500)

  const anywhereBtn = page.locator('button:has-text("Allow Access from Anywhere")').first()
  if (await anywhereBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await anywhereBtn.click()
  } else {
    await page.locator('input[placeholder*="IP"]').first().fill('0.0.0.0/0').catch(() => {})
  }

  await page.locator('button:has-text("Confirm"), button:has-text("Add Entry"), button[type="submit"]').last().click().catch(() => {})
  await waitMs(2000)
  console.log('✅ Red configurada')
}

async function getConnectionString(page) {
  console.log('🔗 Obteniendo connection string...')
  await page.goto('https://cloud.mongodb.com/v2#/clusters', { waitUntil: 'networkidle', timeout: 30000 })
  await waitMs(3000)

  const connectBtn = page.locator('button:has-text("Connect")').first()
  if (await connectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await connectBtn.click()
    await waitMs(2000)

    const driversBtn = page.locator('text=Drivers, button:has-text("Drivers")').first()
    if (await driversBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await driversBtn.click()
      await waitMs(2000)
    }

    const codeEl = page.locator('code, pre, input[value*="mongodb+srv"]').first()
    if (await codeEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      let raw = await codeEl.inputValue().catch(() => '') || await codeEl.textContent() || ''
      raw = raw.trim()
      if (raw.includes('mongodb+srv://')) {
        const connString = raw.replace('<username>', DB_USER).replace('<password>', DB_PASS).replace(/\/\?/, `/${DB_NAME}?`).replace(/\/$/, `/${DB_NAME}`)
        saveConnectionString(connString)
        return connString
      }
    }
  }

  // Fallback
  const slug = CLUSTER_NAME.toLowerCase().replace(/[^a-z0-9]/g, '')
  const cs = `mongodb+srv://${DB_USER}:${DB_PASS}@${slug}.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
  console.log('⚠️  Connection string construido (verifica el hostname en Atlas)')
  saveConnectionString(cs)
  return cs
}

function saveConnectionString(cs) {
  console.log('\n✅ CONNECTION STRING:\n' + cs.replace(/:([^@]+)@/, ':****@'))
  fs.writeFileSync(path.join(__dirname, '.mongodb-uri'), cs.trim())
  console.log('💾 Guardado en scripts/.mongodb-uri')
}

setupMongoDB().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
