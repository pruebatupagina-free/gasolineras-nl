const mongoose = require('mongoose')

const pushSuscripcionSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
}, { timestamps: true })

// Un endpoint único por usuario (reemplaza si el mismo endpoint se re-registra)
pushSuscripcionSchema.index({ endpoint: 1 }, { unique: true })
pushSuscripcionSchema.index({ usuario_id: 1 })

module.exports = mongoose.model('PushSuscripcion', pushSuscripcionSchema)
