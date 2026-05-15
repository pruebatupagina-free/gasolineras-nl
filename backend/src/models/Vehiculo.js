const mongoose = require('mongoose')

const vehiculoSchema = new mongoose.Schema({
  usuario:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  nombre:     { type: String, required: true, trim: true },
  marca:      { type: String, trim: true, default: '' },
  modelo:     { type: String, trim: true, default: '' },
  año:        { type: Number, default: null },
  combustible:{ type: String, enum: ['magna', 'premium', 'diesel'], default: 'magna' },
  tanque:     { type: Number, default: 50 },
  color:      { type: String, default: '#5E6AD2' },
  emoji:      { type: String, default: '🚗' },
}, { timestamps: true })

module.exports = mongoose.model('Vehiculo', vehiculoSchema)
