const mongoose = require('mongoose')

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    municipio_preferido: {
      type: String,
      enum: ['SAN PEDRO GARZA GARCIA', 'SANTA CATARINA', 'TODOS'],
      default: 'TODOS',
    },
    favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Estacion' }],
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
)

usuarioSchema.index({ email: 1 })

module.exports = mongoose.model('Usuario', usuarioSchema)
