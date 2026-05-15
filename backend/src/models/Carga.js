const mongoose = require('mongoose')

const cargaSchema = new mongoose.Schema({
  usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  vehiculo:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vehiculo', default: null },
  estacion:     { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', default: null },
  estacion_nombre: { type: String, default: '' },
  combustible:  { type: String, enum: ['magna', 'premium', 'diesel'], required: true },
  litros:       { type: Number, required: true, min: 0.1 },
  precio_litro: { type: Number, required: true, min: 1 },
  total:        { type: Number },
  km_actual:    { type: Number, default: null },
  notas:        { type: String, default: '' },
  fecha:        { type: Date, default: Date.now },
}, { timestamps: true })

cargaSchema.pre('save', function (next) {
  this.total = Math.round(this.litros * this.precio_litro * 100) / 100
  next()
})

cargaSchema.index({ usuario: 1, fecha: -1 })

module.exports = mongoose.model('Carga', cargaSchema)
