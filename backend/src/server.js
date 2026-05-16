require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')

const app = express()

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:4173',
  ].filter(Boolean),
  credentials: true,
}))
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/estaciones', require('./routes/estaciones'))
app.use('/api/garaje', require('./routes/garaje'))
app.use('/api/reportes', require('./routes/reportes'))
app.use('/api/alertas', require('./routes/alertas'))
app.use('/api/notificaciones', require('./routes/notificaciones'))
app.use('/api/push', require('./routes/push'))

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date(), env: process.env.NODE_ENV })
)

app.post('/api/admin/geocode', (req, res) => {
  const secret = req.headers['x-admin-secret']
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const limit = Math.min(parseInt(req.query.limit) || 500, 1000)
  const { geocodeAllPending } = require('./utils/geocode')
  geocodeAllPending(limit).catch(err => console.error('[Admin Geocode]', err.message))
  res.json({ message: `Geocodificando hasta ${limit} estaciones en background` })
})


app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' })
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB conectado')
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`))
    const initCrons = require('./crons/syncCRE')
    const sincronizarPrecios = initCrons()

    // Sincronizar al arrancar para garantizar datos frescos desde CRE
    sincronizarPrecios().catch(err => console.error('[Startup Sync]', err.message))
  })
  .catch(err => {
    console.error('❌ Error conectando MongoDB:', err.message)
    process.exit(1)
  })
