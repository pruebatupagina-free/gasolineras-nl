/**
 * Add gasonl_user - handles "Add Built In Role" button and role selection
 */
const { chromium } = require('playwright')
const { spawn, execSync } = require('child_process')
const path = require('path')
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

async function addUser() {
  try {
    const out = execSync(`netstat -ano 2>nul | findstr :${CDP_PORT}`, { encoding: 'utf8', shell: 'cmd' }).trim()
    const match = out.match(/LISTENING\s+(\d+)/)
    if (match) execSync(`taskkill /PID ${match[1]} /F 2>nul`, { shell: 'cmd' })
    await wait(500)
  } catch {}

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

    // Check if user already exists
    const content = await page.content()
    if (content.includes(DB_USER)) {
      console.log(`✅ Usuario "${DB_USER}" ya existe`)
      await browser.close(); chrome.kill(); return
    }

    // Open Add User form
    const addBtn = page.locator('button:has-text("ADD NEW DATABASE USER")').first()
    await addBtn.click()
    console.log('✅ Abriendo formulario')
    await wait(3000)

    // Fill username
    await page.locator('input[name="db-user-identifier"]').fill(DB_USER)
    console.log(`✅ Username: ${DB_USER}`)

    // Fill password
    await page.locator('input[type="password"]').first().fill(DB_PASS)
    console.log('✅ Password llenado')

    await wait(1000)

    // Expand Built-in Role section (it shows the expand arrow)
    const builtInSection = page.locator('text=Built-in Role').first()
    await builtInSection.click()
    await wait(1500)

    // Click "Add Built In Role" button
    const addRoleBtn = page.locator('button:has-text("Add Built In Role")').first()
    if (await addRoleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addRoleBtn.click()
      console.log('✅ Click en Add Built In Role')
      await wait(2000)
    }

    await page.screenshot({ path: path.join(__dirname, 'atlas-role-menu.png') })
    console.log('📸 Screenshot: atlas-role-menu.png')

    // Select Atlas admin role — LeafyGreen custom select component
    let roleSelected = false

    // Click the LeafyGreen select trigger to open dropdown
    const lgSelect = page.locator('[class*="lg-ui-select-menu"], [class*="leafygreen-ui"][class*="select"]').first()
    if (await lgSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lgSelect.click()
      console.log('✅ Click en LeafyGreen select trigger')
      await wait(1500)

      // Try clicking "Atlas admin" option
      for (const sel of [
        '[role="option"]:has-text("Atlas admin")',
        '[role="option"]:has-text("atlasAdmin")',
        'li:has-text("Atlas admin")',
        '[class*="option"]:has-text("Atlas admin")',
        '[class*="menu"]:has-text("Atlas admin")',
      ]) {
        const opt = page.locator(sel).first()
        if (await opt.isVisible({ timeout: 1500 }).catch(() => false)) {
          await opt.click()
          roleSelected = true
          console.log('✅ Atlas admin seleccionado via:', sel)
          break
        }
      }

      // Fallback: find any text "Atlas admin" on page
      if (!roleSelected) {
        const atlasEl = page.locator('text="Atlas admin"').first()
        if (await atlasEl.isVisible({ timeout: 2000 }).catch(() => false)) {
          await atlasEl.click()
          roleSelected = true
          console.log('✅ Atlas admin seleccionado via text locator')
        }
      }
    }

    if (!roleSelected) {
      console.log('⚠️  No se pudo seleccionar rol automáticamente')
      await page.screenshot({ path: path.join(__dirname, 'atlas-role-debug.png') })
    }

    await wait(1000)
    await page.screenshot({ path: path.join(__dirname, 'atlas-before-submit.png') })

    // Submit - "Add User" button at bottom of modal
    const submitBtn = page.locator('button:has-text("Add User")').last()
    const isEnabled = await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)
    console.log(`\n📋 Estado del botón Add User: ${isEnabled ? 'habilitado' : 'deshabilitado'}`)

    if (isEnabled) {
      await submitBtn.click()
      console.log('✅ Click en Add User (submit)')
      await wait(5000)
    } else {
      console.log('⚠️  Botón deshabilitado. Revisa atlas-before-submit.png')
    }

    await page.screenshot({ path: path.join(__dirname, 'atlas-submitted.png') })
    console.log('📸 Screenshot: atlas-submitted.png')

    const finalContent = await page.content()
    if (finalContent.includes(DB_USER) && !finalContent.includes('Enter username')) {
      console.log(`\n✅ Usuario "${DB_USER}" creado en Atlas`)
    } else {
      console.log('\n⚠️  Verifica atlas-submitted.png')
    }

    await browser.close(); chrome.kill()

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-add-user.png') }).catch(() => {})
    await browser.close(); chrome.kill()
    throw err
  }
}

addUser().catch(err => { console.error('❌', err.message); process.exit(1) })
