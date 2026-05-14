/**
 * Master script — runs all 3 steps in sequence
 * 1. MongoDB Atlas setup
 * 2. Railway backend deploy
 * 3. Frontend build + GitHub Pages deploy
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const scriptsDir = __dirname

async function run() {
  console.log('=' .repeat(60))
  console.log('🚀 GasoNL — Despliegue Completo')
  console.log('=' .repeat(60))

  // STEP 1: MongoDB Atlas
  console.log('\n📌 PASO 1: MongoDB Atlas\n')
  try {
    execSync(`node "${path.join(scriptsDir, 'setup-mongodb.js')}"`, {
      cwd: path.join(scriptsDir, '..'),
      stdio: 'inherit',
      timeout: 300000, // 5 min
    })
    console.log('\n✅ PASO 1 completado\n')
  } catch (err) {
    console.error('❌ PASO 1 falló:', err.message)
    process.exit(1)
  }

  // STEP 2: Railway
  console.log('\n📌 PASO 2: Railway Backend Deploy\n')
  try {
    execSync(`node "${path.join(scriptsDir, 'setup-railway.js')}"`, {
      cwd: path.join(scriptsDir, '..'),
      stdio: 'inherit',
      timeout: 300000, // 5 min
    })
    console.log('\n✅ PASO 2 completado\n')
  } catch (err) {
    console.error('❌ PASO 2 falló:', err.message)
    process.exit(1)
  }

  // STEP 3: Frontend deploy
  console.log('\n📌 PASO 3: Frontend → GitHub Pages\n')
  try {
    execSync(`node "${path.join(scriptsDir, 'deploy-frontend.js')}"`, {
      cwd: path.join(scriptsDir, '..'),
      stdio: 'inherit',
      timeout: 300000, // 5 min
    })
    console.log('\n✅ PASO 3 completado\n')
  } catch (err) {
    console.error('❌ PASO 3 falló:', err.message)
    process.exit(1)
  }

  console.log('=' .repeat(60))
  console.log('🎉 ¡DESPLIEGUE COMPLETO!')
  console.log('=' .repeat(60))

  const railwayUrl = fs.readFileSync(path.join(scriptsDir, '.railway-url'), 'utf8').trim()
  console.log('\n📊 RESUMEN:')
  console.log(`  🗄️  MongoDB Atlas: cluster GasoNLCluster`)
  console.log(`  🚂 Backend API:   ${railwayUrl}/api`)
  console.log(`  🌐 Frontend:      https://pruebatupagina-free.github.io/gasolineras-nl/`)
  console.log(`  ❤️  Health check:  ${railwayUrl}/api/health`)
}

run().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
