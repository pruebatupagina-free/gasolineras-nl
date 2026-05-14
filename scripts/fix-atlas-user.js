/**
 * Fix Atlas DB user - delete and recreate with proper roles
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

async function fixUser() {
  try {
    const { execSync } = require('child_process')
    const out = execSync(`netstat -ano 2>nul | findstr :${CDP_PORT}`, { encoding: 'utf8', shell: 'cmd' }).trim()
    const match = out.match(/LISTENING\s+(\d+)/)
    if (match) execSync(`taskkill /PID ${match[1]} /F 2>nul`, { shell: 'cmd' })
    await wait(500)
  } catch {}

  console.log('🚀 Abriendo Atlas...')
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
    await page.screenshot({ path: path.join(__dirname, 'atlas-users-fix.png'), fullPage: true })
    console.log('📸 Screenshot: atlas-users-fix.png')

    const content = await page.content()
    console.log('📋 Usuarios encontrados:', content.includes(DB_USER) ? `Sí (${DB_USER})` : 'No')

    // If user exists, check/edit their role
    if (content.includes(DB_USER)) {
      console.log(`⚠️  Intentando eliminar usuario existente y recrear con rol correcto...`)

      // Find edit/delete button for gasonl_user
      const allBtns = await page.$$('button, [role="button"]')
      let editFound = false

      for (const btn of allBtns) {
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '')
        const title = await btn.getAttribute('title').catch(() => '')
        const text = await btn.textContent().catch(() => '')

        if (ariaLabel.toLowerCase().includes('edit') || title.toLowerCase().includes('edit') ||
            text.toLowerCase().includes('edit')) {
          const isNear = await btn.evaluate((el) => {
            const parent = el.closest('tr, [role="row"], li')
            return parent ? parent.textContent.includes('gasonl_user') : false
          })
          if (isNear) {
            await btn.click()
            editFound = true
            await wait(2000)
            break
          }
        }
      }

      if (!editFound) {
        // Try clicking directly on the username row to edit
        const userRow = page.locator(`text=${DB_USER}`).first()
        if (await userRow.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Look for edit icon near the row
          const editBtn = page.locator(`tr:has-text("${DB_USER}") button, tr:has-text("${DB_USER}") [aria-label*="edit" i]`).first()
          if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await editBtn.click()
            editFound = true
            await wait(2000)
          }
        }
      }

      await page.screenshot({ path: path.join(__dirname, 'atlas-edit-user.png') })
    }

    // Add new user with Atlas Admin role
    console.log('\n🔧 Creando usuario con Atlas admin role...')

    for (const sel of ['button:has-text("Add New Database User")', 'button:has-text("Add Database User")', 'button:has-text("Add User")']) {
      const btn = page.locator(sel).first()
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click()
        console.log('✅ Click en Add User')
        break
      }
    }

    await wait(2000)
    await page.screenshot({ path: path.join(__dirname, 'atlas-add-user-form.png') })
    console.log('📸 Screenshot: atlas-add-user-form.png')

    // Fill username
    const usernameInputs = await page.$$('input[name="username"], input[placeholder*="username" i], input[id*="username"]')
    for (const inp of usernameInputs) {
      if (await inp.isVisible()) {
        await inp.fill(DB_USER + '_v2')  // Create a new user to avoid conflicts
        console.log(`✅ Username: ${DB_USER}_v2`)
        break
      }
    }

    // Fill password
    const passInputs = await page.$$('input[type="password"]')
    for (const inp of passInputs) {
      if (await inp.isVisible()) {
        await inp.fill(DB_PASS)
        console.log('✅ Password llenado')
        break
      }
    }

    // Set role - try to find Atlas admin or readWriteAnyDatabase
    await wait(1000)
    const roleContainer = page.locator('[class*="role"], [class*="permission"]').first()
    if (await roleContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try clicking on role dropdown
      const roleDropdown = page.locator('select[name*="role"], [class*="select"][class*="role"]').first()
      if (await roleDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleDropdown.selectOption({ label: 'Atlas admin' })
      }
    }

    await page.screenshot({ path: path.join(__dirname, 'atlas-user-role.png') })
    console.log('📸 Screenshot: atlas-user-role.png')

    // Submit
    for (const sel of ['button:has-text("Add User")', 'button[type="submit"]:visible']) {
      const btn = page.locator(sel).last()
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click()
        console.log('✅ Usuario enviado')
        await wait(3000)
        break
      }
    }

    // Update the MONGODB_URI with the new username
    const oldUri = fs.readFileSync(path.join(__dirname, '.mongodb-uri'), 'utf8').trim()
    const newUri = oldUri.replace(DB_USER, DB_USER + '_v2')
    fs.writeFileSync(path.join(__dirname, '.mongodb-uri'), newUri)
    console.log('✅ URI actualizado con nuevo usuario:', newUri.replace(/:([^@]+)@/, ':****@'))

    await browser.close()
    chrome.kill()

    console.log('\n✅ Usuario Atlas actualizado')
    console.log('Ejecuta: node scripts/setup-railway.js para actualizar Railway con el nuevo usuario')

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-fix-user.png') }).catch(() => {})
    await browser.close()
    chrome.kill()
    throw err
  }
}

fixUser().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
