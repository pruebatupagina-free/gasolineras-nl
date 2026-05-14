/**
 * Updates frontend env with Railway URL and deploys to GitHub Pages
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

async function deployFrontend() {
  const railwayUrlFile = path.join(__dirname, '.railway-url')

  if (!fs.existsSync(railwayUrlFile)) {
    throw new Error('No se encontró .railway-url — ejecuta setup-railway.js primero')
  }

  let railwayUrl = fs.readFileSync(railwayUrlFile, 'utf8').trim()

  if (railwayUrl === 'PENDING' || !railwayUrl.startsWith('http')) {
    console.log('⚠️  URL de Railway pendiente.')
    console.log('Ingresa la URL de Railway manualmente (ej: https://xxx.up.railway.app):')
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout })
    railwayUrl = await new Promise(resolve => readline.question('> ', ans => { readline.close(); resolve(ans.trim()) }))
    fs.writeFileSync(railwayUrlFile, railwayUrl)
  }

  const apiUrl = `${railwayUrl}/api`
  console.log('🔧 API URL:', apiUrl)

  // Update frontend .env
  const frontendDir = path.join(__dirname, '..', 'frontend')
  const envPath = path.join(frontendDir, '.env')
  const envContent = `VITE_API_URL=${apiUrl}\n`
  fs.writeFileSync(envPath, envContent)
  console.log('✅ frontend/.env actualizado:', envContent.trim())

  // Also update .env.example
  fs.writeFileSync(path.join(frontendDir, '.env.example'), envContent)

  // Install frontend deps if needed
  const nodeModulesPath = path.join(frontendDir, 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n📦 Instalando dependencias del frontend...')
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit' })
  }

  // Build frontend
  console.log('\n🏗️  Construyendo frontend...')
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' })

  // Check if gh-pages is in node_modules
  const ghPagesPath = path.join(frontendDir, 'node_modules', '.bin', 'gh-pages')
  if (!fs.existsSync(ghPagesPath)) {
    console.log('📦 Instalando gh-pages...')
    execSync('npm install --save-dev gh-pages', { cwd: frontendDir, stdio: 'inherit' })
  }

  // Configure git for deploy
  console.log('\n📤 Desplegando en GitHub Pages...')
  try {
    execSync('git config user.email "pruebatupagina.free@gmail.com"', { cwd: frontendDir })
    execSync('git config user.name "pruebatupagina-free"', { cwd: frontendDir })
  } catch {}

  // Deploy to GitHub Pages
  execSync('npm run deploy', { cwd: frontendDir, stdio: 'inherit' })

  console.log('\n✅ FRONTEND DESPLEGADO EN GITHUB PAGES:')
  console.log('https://pruebatupagina-free.github.io/gasolineras-nl/')

  // Update backend CORS with Railway env var (if Railway CLI available)
  try {
    const backendDir = path.join(__dirname, '..', 'backend')
    const tokenFile = path.join(__dirname, '.railway-token')
    let env = { ...process.env }
    if (fs.existsSync(tokenFile)) {
      env.RAILWAY_TOKEN = fs.readFileSync(tokenFile, 'utf8').trim()
    }
    execSync(
      `railway variables set FRONTEND_URL="https://pruebatupagina-free.github.io/gasolineras-nl" CLIENT_URL="https://pruebatupagina-free.github.io/gasolineras-nl"`,
      { cwd: backendDir, env, encoding: 'utf8' }
    )
    console.log('✅ CORS del backend actualizado en Railway')
  } catch (e) {
    console.log('⚠️  No se pudo actualizar CORS en Railway:', e.message)
  }
}

deployFrontend().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
