const mongoose = require('mongoose')

const alertaSchema = new mongoose.Schema({
  usuario_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estacion_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', required: true },
  combustible:     { type: String, enum: ['magna', 'premium', 'diesel'], required: true },
  precio_objetivo: { type: Number, required: true },
  activa:          { type: Boolean, default: true },
  ultima_notificacion: { type: Date, default: null },
}, { timestamps: true })

alertaSchema.index({ usuario_id: 1, activa: 1 })
alertaSchema.index({ estacion_id: 1, combustible: 1, activa: 1 })

module.exports = mongoose.model('Alerta', alertaSchema)
