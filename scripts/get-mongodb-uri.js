/**
 * Extracts MongoDB Atlas connection string from existing "Cluster0"
 */
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const SRC_PROFILE = 'C:\\Users\\Tibs\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 7'
const TEMP_USER_DATA = path.join(os.tmpdir(), 'pw-atlas-userdata')
const CDP_PORT = 9223
const DB_USER = 'gasonl_user'
const DB_PASS = 'GasoNL2025Secure'
const DB_NAME = 'gasonl'

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name)
    try { if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d) } catch {}
  }
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function waitCDP(port) {
  for (let i = 0; i < 25; i++) {
    try { const r = await fetch(`http://localhost:${port}/json/version`); if (r.ok) return } catch {}
    await wait(1000)
  }
  throw new Error('CDP timeout')
}

async function getURI() {
  const defaultProfile = path.join(TEMP_USER_DATA, 'Default')
  if (!fs.existsSync(defaultProfile)) {
    console.log('📋 Copiando Profile 7...')
    copyDir(SRC_PROFILE, defaultProfile)
  }

  console.log('🚀 Abriendo Chrome...')
  const chrome = spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-first-run',
    'https://cloud.mongodb.com/v2#/clusters',
  ], { detached: false, stdio: 'ignore' })

  await waitCDP(CDP_PORT)
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]

  try {
    await wait(4000)

    // Handle login if needed
    const url = page.url()
    if (url.includes('login') || url.includes('account.mongodb.com')) {
      console.log('⚠️  Inicia sesión en Atlas...')
      for (let i = 0; i < 60; i++) {
        await wait(5000)
        const u = page.url()
        if (u.includes('cloud.mongodb.com') && !u.includes('login') && !u.includes('account.mongodb.com')) break
        if (i === 59) throw new Error('Timeout login')
      }
    }

    // Navigate to clusters page
    await page.goto('https://cloud.mongodb.com/v2#/clusters', { waitUntil: 'networkidle', timeout: 30000 })
    await wait(3000)

    // Click on "Cluster0" link to go to project's cluster page
    console.log('🔍 Buscando Cluster0...')
    const clusterLink = page.locator('a:has-text("Cluster0"), a[href*="Cluster0"]').first()
    if (await clusterLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await clusterLink.getAttribute('href')
      console.log('✅ Cluster0 encontrado, href:', href)

      if (href) {
        // Navigate to the project that contains this cluster
        const projectMatch = href.match(/\/v2\/([a-f0-9]+)/)
        if (projectMatch) {
          const projectId = projectMatch[1]
          console.log('📍 Project ID:', projectId)
          await page.goto(`https://cloud.mongodb.com/v2/${projectId}#/clusters`, { waitUntil: 'networkidle', timeout: 30000 })
          await wait(4000)
        } else {
          await clusterLink.click()
          await wait(4000)
        }
      }
    }

    await page.screenshot({ path: path.join(__dirname, 'atlas-project.png'), fullPage: true })
    console.log('📸 Screenshot: atlas-project.png')

    // Find Connect button on this page
    let connectFound = false
    const allButtons = await page.$$('button, a')
    for (const btn of allButtons) {
      const text = (await btn.textContent() || '').trim()
      if (text === 'Connect' || text.includes('Connect')) {
        console.log('✅ Botón Connect encontrado:', text)
        await btn.click()
        connectFound = true
        await wait(3000)
        break
      }
    }

    if (!connectFound) {
      // Try navigating to the cluster detail page directly
      const currentUrl = page.url()
      const projectId = currentUrl.match(/\/v2\/([a-f0-9]+)/)?.[1]
      if (projectId) {
        await page.goto(`https://cloud.mongodb.com/v2/${projectId}#/clusters/connect?clusterName=Cluster0`, { waitUntil: 'networkidle', timeout: 30000 })
        await wait(3000)
        await page.screenshot({ path: path.join(__dirname, 'atlas-connect-direct.png') })
      }
    }

    await page.screenshot({ path: path.join(__dirname, 'atlas-after-connect.png') })
    console.log('📸 Screenshot: atlas-after-connect.png')

    // Navigate through wizard - look for "Drivers" option
    const driverOptions = await page.$$('button, [role="button"], a, li')
    for (const el of driverOptions) {
      const text = (await el.textContent() || '').toLowerCase()
      if (text.includes('driver') || text.includes('compass') || text.includes('shell')) {
        await el.click()
        console.log('✅ Click en Drivers/option')
        await wait(2000)
        break
      }
    }

    await page.screenshot({ path: path.join(__dirname, 'atlas-wizard.png') })

    // Extract connection string
    let connString = ''

    // Search all inputs for mongodb+srv
    for (const input of await page.$$('input, textarea')) {
      const val = await input.inputValue().catch(() => '')
      if (val.includes('mongodb+srv://') || val.includes('mongodb://')) {
        connString = val
        break
      }
    }

    // Search code blocks
    if (!connString) {
      for (const el of await page.$$('code, pre, [class*="code"], [class*="connection"]')) {
        const text = await el.textContent().catch(() => '')
        if (text.includes('mongodb+srv://') || text.includes('mongodb://')) {
          connString = text.trim()
          break
        }
      }
    }

    // Search entire page content
    if (!connString) {
      const html = await page.content()
      const match = html.match(/mongodb\+srv:\/\/[^"'\s<>]+/i)
      if (match) connString = match[0]
    }

    if (connString) {
      connString = connString
        .replace('<username>', DB_USER)
        .replace('<password>', DB_PASS)
        .replace(/\/\?/, `/${DB_NAME}?`)
      if (!connString.includes('/' + DB_NAME)) {
        connString = connString.replace('/?', `/${DB_NAME}?`)
      }
      connString = connString.trim()

      console.log('\n✅ CONNECTION STRING:')
      console.log(connString.replace(/:([^@]+)@/, ':****@'))
      fs.writeFileSync(path.join(__dirname, '.mongodb-uri'), connString)
      console.log('💾 Guardado en scripts/.mongodb-uri')
    } else {
      console.log('\n⚠️  No se pudo extraer automáticamente.')
      console.log('Revisa los screenshots en scripts/ para ver el estado actual.')
      console.log('\nPor favor copia el connection string manualmente de Atlas y:')
      console.log(`Escríbelo en: scripts/.mongodb-uri`)
    }

    await browser.close()
    chrome.kill()

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-uri.png') }).catch(() => {})
    await browser.close()
    chrome.kill()
    throw err
  }
}

getURI().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
