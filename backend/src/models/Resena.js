const mongoose = require('mongoose')

const ResenaSchema = new mongoose.Schema({
  estacion_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Estacion', required: true },
  usuario_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',  required: true },
  nombre_usuario:{ type: String, required: true },
  estrellas:     { type: Number, required: true, min: 1, max: 5 },
  texto:         { type: String, maxlength: 280, default: '' },
}, { timestamps: true })

ResenaSchema.index({ estacion_id: 1, usuario_id: 1 }, { unique: true })
ResenaSchema.index({ estacion_id: 1, createdAt: -1 })

module.exports = mongoose.model('Resena', ResenaSchema)
