const mongoose = require('mongoose')

const notificacionSchema = new mongoose.Schema({
  usuario_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo:         { type: String, default: 'alerta_precio' },
  mensaje:      { type: String, required: true },
  estacion_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', default: null },
  combustible:  { type: String, default: null },
  precio_actual: { type: Number, default: null },
  leida:        { type: Boolean, default: false },
}, { timestamps: true })

notificacionSchema.index({ usuario_id: 1, leida: 1, createdAt: -1 })

module.exports = mongoose.model('Notificacion', notificacionSchema)
