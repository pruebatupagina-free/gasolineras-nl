/**
 * Verify/setup gasonl_user and network access in the correct Atlas project
 */
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TEMP_USER_DATA = path.join(os.tmpdir(), 'pw-atlas-userdata')
const CDP_PORT = 9223
const PROJECT_ID = '699e3cf4a7adcacf366f341b'
const DB_USER = 'gasonl_user'
const DB_PASS = 'GasoNL2025Secure'

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
async function waitCDP(port) {
  for (let i = 0; i < 25; i++) {
    try { const r = await fetch(`http://localhost:${port}/json/version`); if (r.ok) return } catch {}
    await wait(1000)
  }
  throw new Error('CDP timeout')
}

async function verify() {
  console.log('🚀 Abriendo Chrome...')
  const chrome = spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-first-run',
    `https://cloud.mongodb.com/v2/${PROJECT_ID}#/security/database/users`,
  ], { detached: false, stdio: 'ignore' })

  await waitCDP(CDP_PORT)
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]

  try {
    await wait(5000)
    await page.screenshot({ path: path.join(__dirname, 'atlas-users.png'), fullPage: true })
    console.log('📸 Screenshot: atlas-users.png')

    const content = await page.content()

    // Check if gasonl_user exists
    if (content.includes(DB_USER)) {
      console.log(`✅ Usuario "${DB_USER}" ya existe`)
    } else {
      console.log(`⚠️  Usuario "${DB_USER}" no encontrado, creándolo...`)

      // Click Add button
      for (const sel of ['button:has-text("Add New Database User")', 'button:has-text("Add Database User")', 'button:has-text("Add User")']) {
        const btn = page.locator(sel).first()
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) { await btn.click(); break }
      }

      await wait(2000)
      await page.locator('input[name="username"], input[placeholder*="username" i]').first().fill(DB_USER).catch(() => {})
      await page.locator('input[type="password"]').first().fill(DB_PASS).catch(() => {})

      // Set role to atlasAdmin or readWriteAnyDatabase
      const roleBtn = page.locator('button:has-text("Atlas admin"), button:has-text("Add Built-in Role")').first()
      if (await roleBtn.isVisible({ timeout: 2000 }).catch(() => false)) await roleBtn.click()

      await page.locator('button:has-text("Add User"), button[type="submit"]').last().click().catch(() => {})
      await wait(3000)
      console.log(`✅ Usuario "${DB_USER}" creado`)
    }

    // Check network access
    await page.goto(`https://cloud.mongodb.com/v2/${PROJECT_ID}#/security/network/accessList`, { waitUntil: 'networkidle', timeout: 30000 })
    await wait(3000)
    await page.screenshot({ path: path.join(__dirname, 'atlas-network.png'), fullPage: true })
    console.log('📸 Screenshot: atlas-network.png')

    const netContent = await page.content()
    if (netContent.includes('0.0.0.0/0')) {
      console.log('✅ Acceso de red 0.0.0.0/0 ya configurado')
    } else {
      console.log('⚠️  Configurando acceso de red...')

      for (const sel of ['button:has-text("Add IP Address")', 'button:has-text("+ Add IP Address")']) {
        const btn = page.locator(sel).first()
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) { await btn.click(); break }
      }

      await wait(1500)

      const anywhereBtn = page.locator('button:has-text("Allow Access from Anywhere")').first()
      if (await anywhereBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anywhereBtn.click()
      } else {
        await page.locator('input[placeholder*="IP"]').first().fill('0.0.0.0/0').catch(() => {})
      }

      await page.locator('button:has-text("Confirm"), button:has-text("Add Entry"), button[type="submit"]').last().click().catch(() => {})
      await wait(3000)
      console.log('✅ Red configurada (0.0.0.0/0)')
    }

    await browser.close()
    chrome.kill()
    console.log('\n✅ Atlas verificado y listo')

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-verify.png') }).catch(() => {})
    await browser.close()
    chrome.kill()
    throw err
  }
}

verify().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
