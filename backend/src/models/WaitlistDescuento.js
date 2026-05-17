const mongoose = require('mongoose')

const WaitlistDescuentoSchema = new mongoose.Schema({
  email:   { type: String, required: true },
  nombre:  { type: String },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  createdAt: { type: Date, default: Date.now },
})

WaitlistDescuentoSchema.index({ email: 1 }, { unique: true })

module.exports = mongoose.model('WaitlistDescuento', WaitlistDescuentoSchema)
