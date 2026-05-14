const mongoose = require('mongoose')

const estacionSchema = new mongoose.Schema(
  {
    cre_id: { type: String, required: true, unique: true },
    nombre: { type: String, required: true, trim: true },
    razon_social: { type: String, default: null },
    calle: { type: String, default: null },
    numero_exterior: { type: String, default: null },
    colonia: { type: String, default: null },
    municipio: { type: String, required: true },
    estado: { type: String, default: 'NUEVO LEON' },
    codigo_postal: { type: String, default: null },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    precios: {
      magna: { type: Number, default: null },
      premium: { type: Number, default: null },
      diesel: { type: Number, default: null },
    },
    ultima_actualizacion: { type: Date, default: null },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
)

estacionSchema.index({ location: '2dsphere' })
estacionSchema.index({ municipio: 1 })
estacionSchema.index({ 'precios.magna': 1 })

module.exports = mongoose.model('Estacion', estacionSchema)
