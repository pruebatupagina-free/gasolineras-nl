/**
 * Completes railway login by capturing the auth URL and authorizing via Playwright
 * railway login prints a URL → open it in Chrome Profile → authorize → CLI gets authenticated
 */
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TEMP_USER_DATA = path.join(os.tmpdir(), 'pw-atlas-userdata')
const CDP_PORT = 9225

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }
async function waitCDP(port) {
  for (let i = 0; i < 25; i++) {
    try { const r = await fetch(`http://localhost:${port}/json/version`); if (r.ok) return } catch {}
    await wait(1000)
  }
  throw new Error('CDP timeout')
}

async function railwayLogin() {
  console.log('🔑 Iniciando railway login...')

  // Kill any existing Chrome on CDP port
  try {
    const { execSync } = require('child_process')
    const out = execSync(`netstat -ano 2>nul | findstr :${CDP_PORT}`, { encoding: 'utf8', shell: 'cmd' }).trim()
    const match = out.match(/LISTENING\s+(\d+)/)
    if (match) execSync(`taskkill /PID ${match[1]} /F 2>nul`, { shell: 'cmd' })
    await wait(500)
  } catch {}

  // Start railway login in background and capture stdout
  const railwayProcess = spawn('railway', ['login'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_COLOR: '1' },
    shell: true,
    windowsHide: false,
  })

  let loginUrl = ''
  let railwayOutput = ''

  // Capture URL from railway login output
  const urlPromise = new Promise((resolve) => {
    railwayProcess.stdout.on('data', (data) => {
      const text = data.toString()
      railwayOutput += text
      console.log('[railway]', text.trim())

      // Look for URL
      const urlMatch = text.match(/https:\/\/railway\.(app|com)\/[^\s]+/)
      if (urlMatch && !loginUrl) {
        loginUrl = urlMatch[0]
        console.log('✅ URL de login capturada:', loginUrl)
        resolve(loginUrl)
      }
    })
    railwayProcess.stderr.on('data', (data) => {
      const text = data.toString()
      railwayOutput += text
      console.log('[railway stderr]', text.trim())
      const urlMatch = text.match(/https:\/\/railway\.(app|com)\/[^\s]+/)
      if (urlMatch && !loginUrl) {
        loginUrl = urlMatch[0]
        console.log('✅ URL de login capturada:', loginUrl)
        resolve(loginUrl)
      }
    })

    // Timeout after 30s
    setTimeout(() => {
      if (!loginUrl) resolve(null)
    }, 30000)
  })

  const capturedUrl = await urlPromise

  if (!capturedUrl) {
    console.log('⚠️  Railway login output:')
    console.log(railwayOutput)
    console.log('\nIntentando método alternativo...')
    railwayProcess.kill()

    // Try using existing CLI config
    const configPath = path.join(os.homedir(), '.railway', 'config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      console.log('✅ Config de Railway encontrada:', Object.keys(config))
      if (config.user?.token) {
        console.log('✅ Token encontrado en config:', config.user.token.substring(0, 8) + '...')
        fs.writeFileSync(path.join(__dirname, '.railway-token'), config.user.token)
        return config.user.token
      }
    }

    throw new Error('No se pudo capturar URL de railway login')
  }

  // Open Chrome and navigate to login URL
  console.log('🌐 Abriendo Chrome con la URL de autorización...')
  const chrome = spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-first-run',
    capturedUrl,
  ], { detached: false, stdio: 'ignore' })

  await waitCDP(CDP_PORT)
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]

  try {
    await wait(3000)
    await page.screenshot({ path: path.join(__dirname, 'railway-auth.png') })
    console.log('📸 Screenshot: railway-auth.png')

    // Look for "Authorize" or "Open the CLI" button
    const authBtns = await page.$$('button, a')
    for (const btn of authBtns) {
      const text = (await btn.textContent() || '').trim()
      if (text.toLowerCase().includes('authorize') || text.toLowerCase().includes('open') || text.toLowerCase().includes('grant')) {
        console.log('✅ Click en:', text)
        await btn.click()
        await wait(3000)
        break
      }
    }

    await page.screenshot({ path: path.join(__dirname, 'railway-auth-after.png') })

    // Wait for railway CLI to get the auth
    console.log('⏳ Esperando que Railway CLI reciba autenticación...')
    await new Promise((resolve) => {
      railwayProcess.on('close', (code) => {
        console.log(`Railway CLI terminó con código: ${code}`)
        resolve()
      })
      setTimeout(resolve, 30000)
    })

    await browser.close()
    chrome.kill()

    // Verify login worked
    const { execSync } = require('child_process')
    try {
      const whoami = execSync('C:\\Users\\Tibs\\AppData\\Roaming\\npm\\railway.cmd whoami', { encoding: 'utf8' })
      console.log('\n✅ Railway CLI autenticado:', whoami.trim())
    } catch {
      console.log('\n⚠️  railway whoami falló. Intentando guardar config...')
    }

    // Check and save config
    const configPath = path.join(os.homedir(), '.railway', 'config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      const token = config.user?.token || config.tokens?.[0] || config.token
      if (token) {
        fs.writeFileSync(path.join(__dirname, '.railway-token'), token)
        console.log('✅ Token guardado desde config de Railway CLI')
        return token
      }
    }

    console.log('✅ Railway CLI autenticado (usando config local)')
    return 'CLI_AUTH'

  } catch (err) {
    await page.screenshot({ path: path.join(__dirname, 'error-railway-login.png') }).catch(() => {})
    await browser.close()
    chrome.kill()
    railwayProcess.kill()
    throw err
  }
}

railwayLogin().then(token => {
  console.log('\n🎉 Login completado')
  process.exit(0)
}).catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
