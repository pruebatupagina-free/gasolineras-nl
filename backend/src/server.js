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

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', ts: new Date(), env: process.env.NODE_ENV })
)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' })
})

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado')
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`))
    const initCrons = require('./crons/syncCRE')
    initCrons()
  })
  .catch(err => {
    console.error('❌ Error conectando MongoDB:', err.message)
    process.exit(1)
  })
