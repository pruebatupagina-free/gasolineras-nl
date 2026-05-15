const mongoose = require('mongoose')

const reporteSchema = new mongoose.Schema({
  usuario:          { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estacion:         { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', required: true },
  combustible:      { type: String, enum: ['magna', 'premium', 'diesel'], required: true },
  precio_reportado: { type: Number, required: true, min: 1 },
  tipo:             { type: String, enum: ['precio_incorrecto', 'cerrada', 'sin_combustible', 'otro'], default: 'precio_incorrecto' },
  notas:            { type: String, default: '' },
  estado:           { type: String, enum: ['pendiente', 'revisado', 'descartado'], default: 'pendiente' },
}, { timestamps: true })

reporteSchema.index({ estacion: 1, createdAt: -1 })

module.exports = mongoose.model('Reporte', reporteSchema)
