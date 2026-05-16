const mongoose = require('mongoose')

const precioHistorialSchema = new mongoose.Schema({
  estacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', required: true },
  fecha: { type: Date, required: true },
  precios: {
    magna:   { type: Number, default: null },
    premium: { type: Number, default: null },
    diesel:  { type: Number, default: null },
  },
}, { timestamps: false })

precioHistorialSchema.index({ estacion_id: 1, fecha: -1 })
precioHistorialSchema.index({ estacion_id: 1, fecha: 1 }, { unique: true })

module.exports = mongoose.model('PrecioHistorial', precioHistorialSchema)
