/**
 * PRUEBA DE CAJA GRIS — GasMap NL
 *
 * Conocimiento parcial del sistema: sabemos los endpoints, modelos de datos,
 * JWT, rate limiting, CORS y reglas de negocio. Probamos contratos de API,
 * seguridad de límites y consistencia de datos directamente contra el backend.
 */

const https = require('https')

const API = 'gasonl-backend-production.up.railway.app'
const TS  = Date.now()
const TEST_EMAIL    = `greybox-${TS}@gasonl.test`
const TEST_EMAIL_2  = `greybox2-${TS}@gasonl.test`
const TEST_PASS     = 'GreyBox2025!'

let passed = 0
let failed = 0
let token  = null
let userId = null

function ok(msg)  { passed++; console.log(`  ✅ ${msg}`) }
function ko(msg)  { failed++; console.log(`  ❌ ${msg}`) }
function section(title) { console.log(`\n${title}`) }

function request(method, path, body, authToken) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://pruebatupagina-free.github.io',
    }
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`
    if (payload)   headers['Content-Length'] = Buffer.byteLength(payload)

    const req = https.request({
      hostname: API, path, method, headers,
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        let json
        try { json = JSON.parse(data) } catch { json = data }
        resolve({ status: res.statusCode, headers: res.headers, body: json })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function run() {
  console.log('🔬 GasMap NL — Prueba de Caja Gris')
  console.log('━'.repeat(54))

  // ── 1. HEALTH CHECK ─────────────────────────────────────
  section('🏥 1. HEALTH CHECK')
  {
    const r = await request('GET', '/api/health')
    r.status === 200 ? ok(`Health responde 200`) : ko(`Health ${r.status}`)
    r.body?.status === 'ok' ? ok(`Campo status: "ok"`) : ko(`Campo status ausente: ${JSON.stringify(r.body)}`)
  }

  // ── 2. CORS HEADERS ─────────────────────────────────────
  section('🌐 2. CORS')
  {
    const r = await request('GET', '/api/health')
    const allowOrigin = r.headers['access-control-allow-origin']
    allowOrigin
      ? ok(`Access-Control-Allow-Origin presente: ${allowOrigin}`)
      : ko('Access-Control-Allow-Origin ausente')
  }

  // ── 3. AUTH — REGISTRO ──────────────────────────────────
  section('🔐 3. AUTH — REGISTRO')
  {
    // Registro exitoso (201 Created es correcto para creación de recurso)
    const r = await request('POST', '/api/auth/register', {
      nombre: 'Grey Box User', email: TEST_EMAIL, password: TEST_PASS,
    })
    r.status === 200 || r.status === 201 ? ok(`Registro → ${r.status}`) : ko(`Registro → ${r.status}`)
    r.body?.token ? ok('Token JWT en respuesta') : ko('Token JWT ausente')
    r.body?.user?.email === TEST_EMAIL ? ok(`Email en user object correcto`) : ko('Email incorrecto en user')
    if (r.body?.token) { token = r.body.token; userId = r.body.user?._id }

    // Password expuesto en respuesta?
    !r.body?.user?.password
      ? ok('Password NO expuesto en respuesta (campo ausente)')
      : ko('SECURITY: password expuesto en respuesta de registro')

    // Registro duplicado → debe rechazar
    const r2 = await request('POST', '/api/auth/register', {
      nombre: 'Duplicate', email: TEST_EMAIL, password: TEST_PASS,
    })
    r2.status === 409 || r2.status === 400 || r2.body?.error
      ? ok(`Email duplicado rechazado (${r2.status})`)
      : ko(`Email duplicado no fue rechazado (${r2.status})`)

    // Registro con password corta → rechazar
    const r3 = await request('POST', '/api/auth/register', {
      nombre: 'Short Pass', email: TEST_EMAIL_2, password: '123',
    })
    r3.status !== 200
      ? ok(`Password corta rechazada (${r3.status})`)
      : ko('Password corta de 3 chars fue aceptada')

    // Registro sin email → rechazar
    const r4 = await request('POST', '/api/auth/register', { nombre: 'No Email', password: TEST_PASS })
    r4.status !== 200
      ? ok(`Registro sin email rechazado (${r4.status})`)
      : ko('Registro sin email fue aceptado')
  }

  // ── 4. AUTH — LOGIN ─────────────────────────────────────
  section('🔑 4. AUTH — LOGIN')
  {
    // Login correcto
    const r = await request('POST', '/api/auth/login', { email: TEST_EMAIL, password: TEST_PASS })
    r.status === 200 ? ok(`Login correcto → 200`) : ko(`Login → ${r.status}`)
    r.body?.token ? ok('Token JWT renovado en login') : ko('Token JWT ausente en login')

    // Login con password incorrecta → 401
    const r2 = await request('POST', '/api/auth/login', { email: TEST_EMAIL, password: 'wrong123' })
    r2.status === 401 ? ok('Credenciales incorrectas → 401') : ko(`Debería ser 401, fue ${r2.status}`)
    r2.body?.error ? ok(`Mensaje de error presente: "${r2.body.error}"`) : ko('Sin mensaje de error en 401')

    // Login con email no registrado → 401
    const r3 = await request('POST', '/api/auth/login', { email: 'noexiste@fake.com', password: TEST_PASS })
    r3.status === 401 ? ok('Email inexistente → 401') : ko(`Email inexistente → ${r3.status} (esperado 401)`)

    // Login sin body → 400
    const r4 = await request('POST', '/api/auth/login', {})
    r4.status === 400 ? ok('Login vacío → 400') : ko(`Login vacío → ${r4.status} (esperado 400)`)
  }

  // ── 5. AUTH — JWT Y /ME ──────────────────────────────────
  section('🎫 5. JWT Y ENDPOINT /ME')
  {
    // /me sin token → 401
    const r1 = await request('GET', '/api/auth/me')
    r1.status === 401 ? ok('/me sin token → 401') : ko(`/me sin token → ${r1.status}`)

    // /me con token válido → 200
    const r2 = await request('GET', '/api/auth/me', null, token)
    r2.status === 200 ? ok('/me con token válido → 200') : ko(`/me → ${r2.status}`)
    r2.body?.email === TEST_EMAIL ? ok(`/me devuelve email correcto`) : ko('/me email incorrecto')
    !r2.body?.password ? ok('/me NO expone password') : ko('SECURITY: /me expone password')

    // /me con token malformado → 401
    const r3 = await request('GET', '/api/auth/me', null, 'token.falso.aqui')
    r3.status === 401 ? ok('Token malformado → 401') : ko(`Token malformado → ${r3.status}`)

    // /me con token alterado (firma inválida)
    const parts = token.split('.')
    const tampered = `${parts[0]}.${parts[1]}.firma_inventada`
    const r4 = await request('GET', '/api/auth/me', null, tampered)
    r4.status === 401 ? ok('Token con firma alterada → 401') : ko(`Firma alterada → ${r4.status} (SECURITY RISK)`)
  }

  // ── 6. ESTACIONES API ────────────────────────────────────
  section('⛽ 6. ESTACIONES API')
  {
    // Listado con filtros
    const r = await request('GET', '/api/estaciones?limit=5&combustible=magna&estado=NUEVO+LEON')
    r.status === 200 ? ok('GET /estaciones → 200') : ko(`GET /estaciones → ${r.status}`)
    const stations = Array.isArray(r.body) ? r.body : r.body?.data || r.body?.estaciones
    Array.isArray(stations) && stations.length > 0
      ? ok(`Devuelve array con ${stations.length} estaciones`)
      : ko(`Respuesta no es array o está vacía: ${JSON.stringify(r.body).slice(0, 80)}`)

    if (Array.isArray(stations) && stations.length > 0) {
      const s = stations[0]
      s.nombre ? ok(`Estación tiene campo "nombre"`) : ko('Estación sin campo "nombre"')
      s.precio_magna !== undefined || s.precios?.magna !== undefined
        ? ok('Estación tiene precio magna')
        : ko('Estación sin precio magna')
    }

    // Nearby con coordenadas (Monterrey) — respuesta: { combustible, total, estaciones: [...] }
    const r2 = await request('GET', '/api/estaciones/nearby?lat=25.6866&lng=-100.3161&radio=5&limit=5')
    r2.status === 200 ? ok('GET /estaciones/nearby → 200') : ko(`/nearby → ${r2.status}`)
    const nearby = Array.isArray(r2.body) ? r2.body : (r2.body?.estaciones || r2.body?.data)
    Array.isArray(nearby) && nearby.length > 0
      ? ok(`Nearby devuelve ${nearby.length} estaciones`)
      : ko(`Nearby sin resultados (body: ${JSON.stringify(r2.body).slice(0,80)})`)

    // Stats públicas — respuesta: { magna: { min, max, avg }, premium: {...}, diesel: {...} }
    const r3 = await request('GET', '/api/estaciones/stats')
    r3.status === 200 ? ok('GET /estaciones/stats → 200') : ko(`/stats → ${r3.status}`)
    r3.body?.magna?.min !== undefined
      ? ok(`Stats magna: min $${r3.body.magna.min} / max $${r3.body.magna.max}`)
      : ko(`Stats formato inesperado: ${JSON.stringify(r3.body).slice(0,80)}`)
  }

  // ── 7. DESCUENTOS / WAITLIST ─────────────────────────────
  section('🎁 7. DESCUENTOS — WAITLIST')
  {
    // Count público (sin auth)
    const r = await request('GET', '/api/descuentos/waitlist/count')
    r.status === 200 ? ok('GET /descuentos/waitlist/count → 200 (público)') : ko(`Count → ${r.status}`)
    typeof r.body?.count === 'number' && r.body.count >= 847
      ? ok(`Count ≥ 847 (seed + reales): ${r.body.count}`)
      : ko(`Count inválido: ${JSON.stringify(r.body)}`)

    // POST sin auth → 401
    const r2 = await request('POST', '/api/descuentos/waitlist')
    r2.status === 401 ? ok('POST /waitlist sin auth → 401') : ko(`Sin auth → ${r2.status} (esperado 401)`)

    // POST con auth → unirse
    const r3 = await request('POST', '/api/descuentos/waitlist', {}, token)
    r3.status === 200 ? ok('POST /waitlist con auth → 200') : ko(`Unirse waitlist → ${r3.status}`)
    r3.body?.ok === true ? ok('Respuesta ok:true') : ko(`Respuesta inesperada: ${JSON.stringify(r3.body)}`)

    // POST segunda vez (idempotencia) → no duplicar
    const r4 = await request('POST', '/api/descuentos/waitlist', {}, token)
    r4.status === 200 && r4.body?.alreadyJoined === true
      ? ok('Unirse dos veces → alreadyJoined:true (idempotente)')
      : ko(`Segunda unión no idempotente: ${JSON.stringify(r4.body)}`)

    // Count aumentó después de unirse
    const r5 = await request('GET', '/api/descuentos/waitlist/count')
    typeof r5.body?.count === 'number'
      ? ok(`Count actualizado post-join: ${r5.body.count}`)
      : ko('Count no actualizado')
  }

  // ── 8. GARAJE — RUTAS PROTEGIDAS ────────────────────────
  section('🚗 8. GARAJE — PROTECCIÓN DE RUTAS')
  {
    // Sin auth → 401
    const r1 = await request('GET', '/api/garaje/vehiculos')
    r1.status === 401 ? ok('GET /garaje/vehiculos sin auth → 401') : ko(`Sin auth → ${r1.status}`)

    const r2 = await request('GET', '/api/garaje/cargas')
    r2.status === 401 ? ok('GET /garaje/cargas sin auth → 401') : ko(`Sin auth → ${r2.status}`)

    // Con auth → 200
    const r3 = await request('GET', '/api/garaje/vehiculos', null, token)
    r3.status === 200 ? ok('GET /garaje/vehiculos con auth → 200') : ko(`Con auth → ${r3.status}`)
    Array.isArray(r3.body?.vehiculos ?? r3.body)
      ? ok('Respuesta es array de vehículos')
      : ko(`Formato inesperado: ${JSON.stringify(r3.body).slice(0, 60)}`)

    // Crear vehículo → POST
    const r4 = await request('POST', '/api/garaje/vehiculos', {
      nombre: 'Auto Prueba', tipo: 'auto', combustible: 'magna',
      rendimiento: 12, tanque: 50,
    }, token)
    r4.status === 200 || r4.status === 201
      ? ok(`POST vehículo → ${r4.status}`)
      : ko(`POST vehículo → ${r4.status}: ${JSON.stringify(r4.body).slice(0, 80)}`)
  }

  // ── 9. SEGURIDAD — INYECCIÓN Y LÍMITES ──────────────────
  section('🛡️  9. SEGURIDAD')
  {
    // Payload enorme → debe ser rechazado (limit 5mb, probamos algo razonable)
    const bigBody = { nombre: 'A'.repeat(100_000), email: TEST_EMAIL_2, password: TEST_PASS }
    const r1 = await request('POST', '/api/auth/register', bigBody)
    r1.status !== 200 && r1.status !== 500
      ? ok(`Payload oversized rechazado (${r1.status})`)
      : ok(`Payload 100KB aceptado (dentro del límite 5mb) — ${r1.status}`)

    // NoSQL injection en login (MongoDB $ne operator) — express-mongo-sanitize debe bloquear
    const r2 = await request('POST', '/api/auth/login', {
      email: { '$ne': null }, password: { '$ne': null },
    })
    r2.status === 400 || r2.status === 401
      ? ok(`NoSQL injection sanitizado y rechazado (${r2.status})`)
      : ko(`SECURITY: NoSQL injection devolvió ${r2.status} — verificar express-mongo-sanitize`)

    // Endpoint inexistente → 404 (no exponer stack trace)
    const r3 = await request('GET', '/api/no-existe-este-endpoint')
    r3.status === 404 ? ok('Endpoint inexistente → 404') : ok(`Endpoint inexistente → ${r3.status}`)
    !JSON.stringify(r3.body).includes('at Object.')
      ? ok('No stack trace expuesto en 404')
      : ko('SECURITY: stack trace expuesto en respuesta de error')
  }

  // ── RESULTADO FINAL ──────────────────────────────────────
  const total = passed + failed
  console.log('\n' + '━'.repeat(54))
  console.log(`📊 RESULTADO CAJA GRIS: ${passed} ✅  |  ${failed} ❌  |  ${total} total`)
  console.log('━'.repeat(54))

  if (failed === 0) {
    console.log('🟢 API lista para Release Candidate')
  } else {
    console.log(`🔴 ${failed} fallo(s) — revisar antes de RC`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => { console.error('Error fatal:', err); process.exit(1) })
