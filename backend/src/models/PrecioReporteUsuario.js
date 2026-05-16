const mongoose = require('mongoose')

const PrecioReporteSchema = new mongoose.Schema({
  estacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', required: true },
  usuario_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',  required: true },
  combustible: { type: String, enum: ['magna', 'premium', 'diesel'], required: true },
  precio:      { type: Number, required: true, min: 10, max: 50 },
  createdAt:   { type: Date, default: Date.now, expires: 86400 }, // TTL 24h
})

PrecioReporteSchema.index({ estacion_id: 1, combustible: 1, createdAt: -1 })

module.exports = mongoose.model('PrecioReporteUsuario', PrecioReporteSchema)
