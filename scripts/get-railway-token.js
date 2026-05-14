/**
 * Extract Railway API token from the tokens page
 * Creates a new token and captures the full value from the DOM
 */
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TEMP_USER_DATA = path.join(os.tmpdir(), 'pw-atlas-userdata')
const CDP_PORT = 9223

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
async function waitCDP(port) {
  for (let i = 0; i < 25; i++) {
    try { const r = await fetch(`http://localhost:${port}/json/version`); if (r.ok) return } catch {}
    await wait(1000)
  }
  throw new Error('CDP timeout')
}

async function getToken() {
  // Kill any existing Chrome on port
  try {
    const { execSync } = require('child_process')
    const out = execSync(`netstat -ano 2>nul | findstr :${CDP_PORT}`, { encoding: 'utf8', shell: 'cmd' }).trim()
    const match = out.match(/LISTENING\s+(\d+)/)
    if (match) execSync(`taskkill /PID ${match[1]} /F 2>nul`, { shell: 'cmd' })
    await wait(1000)
  } catch {}

  console.log('🚀 Abriendo Railway tokens page...')
  const chrome = spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-first-run',
    'https://railway.com/account/tokens',
  ], { detached: false, stdio: 'ignore' })

  await waitCDP(CDP_PORT)
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]

  try {
    await wait(4000)

    // Fill token name
    const nameInput = page.locator('input[placeholder*="Token" i], input[placeholder*="Name" i], input[placeholder*="API" i]').first()
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('gasonl-api-' + Date.now())
      await wait(500)
    }

    // Click Create
    const createBtn = page.locator('button:has-text("Create")').first()
    await createBtn.click({ timeout: 10000 })
    await wait(3000)

    // Extract token from page - try ALL possible ways
    let token = ''

    // 1. Try inputs
    for (const input of await page.$$('input')) {
      const val = await input.inputValue().catch(() => '')
      const type = await input.getAttribute('type').catch(() => 'text')
      // Railway token is a UUID (36 chars) or longer
      if (val.length >= 36 && val.includes('-')) { token = val.trim(); break }
    }

    // 2. Try code/pre/span with token pattern
    if (!token) {
      const allText = await page.evaluate(() => {
        const candidates = []
        // Get all text nodes
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
        let node
        while (node = walker.nextNode()) {
          const text = node.textContent.trim()
          // Railway tokens are UUID format (36 chars with dashes) or hex strings
          if ((text.length === 36 && text.match(/^[a-f0-9-]+$/i)) ||
              (text.length > 32 && text.match(/^[a-zA-Z0-9_\-]+$/) && !text.includes(' '))) {
            candidates.push(text)
          }
        }
        return candidates
      })
      if (allText.length > 0) token = allText[0]
    }

    // 3. Try to find visible token display
    if (!token) {
      // Look for elements that show the "We will only show this token once" context
      const tokenContainer = await page.evaluate(() => {
        const els = document.querySelectorAll('*')
        for (const el of els) {
          const text = el.textContent || ''
          if (text.includes('only show this token once') || text.includes('Got it')) {
            // Find nearby code-like elements
            const codes = el.querySelectorAll('code, pre, [class*="mono"], [style*="mono"], input')
            for (const code of codes) {
              const val = code.value || code.textContent || ''
              if (val.trim().length >= 30) return val.trim()
            }
          }
        }
        return null
      })
      if (tokenContainer) token = tokenContainer
    }

    // 4. Extract from page HTML using regex
    if (!token) {
      const html = await page.content()
      // Look for UUID pattern in HTML context of "token"
      const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi
      const matches = html.match(uuidPattern) || []
      // Filter out known non-tokens (page IDs, etc.)
      for (const m of matches) {
        if (!m.startsWith('000') && !m.includes('00000000')) {
          token = m
          break
        }
      }
    }

    // Take screenshot
    await page.screenshot({ path: path.join(__dirname, 'railway-token-capture.png'), fullPage: false })
    console.log('📸 Screenshot guardado')

    await browser.close()
    chrome.kill()

    if (token) {
      console.log('\n✅ TOKEN CAPTURADO:')
      console.log(token)
      fs.writeFileSync(path.join(__dirname, '.railway-token'), token.trim())
      console.log('💾 Guardado en scripts/.railway-token')

      // Test the token
      const { execSync } = require('child_process')
      try {
        const whoami = execSync('railway whoami', {
          env: { ...process.env, RAILWAY_TOKEN: token.trim() },
          encoding: 'utf8'
        })
        console.log('✅ Token válido:', whoami.trim())
      } catch (e) {
        console.log('⚠️  Token guardado pero whoami falló:', e.message.split('\n')[0])
      }
    } else {
      console.log('\n⚠️  No se pudo capturar el token automáticamente.')
      console.log('Revisa la captura de pantalla en scripts/railway-token-capture.png')
      console.log('Copia el token manualmente y guárdalo en scripts/.railway-token')
    }

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-token.png') }).catch(() => {})
    await browser.close()
    chrome.kill()
    throw err
  }
}

getToken().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
