const router = require('express').Router()
const auth = require('../middleware/auth')
const WaitlistDescuento = require('../models/WaitlistDescuento')
const Usuario = require('../models/Usuario')

const SEED = 847

// GET /api/descuentos/waitlist/count — público
router.get('/waitlist/count', async (req, res) => {
  try {
    const count = await WaitlistDescuento.countDocuments()
    res.json({ count: count + SEED })
  } catch (e) {
    res.json({ count: SEED })
  }
})

// POST /api/descuentos/waitlist — requiere auth
router.post('/waitlist', auth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select('email nombre')
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const existing = await WaitlistDescuento.findOne({ email: user.email })
    if (existing) return res.json({ ok: true, alreadyJoined: true })

    await WaitlistDescuento.create({
      email:  user.email,
      nombre: user.nombre,
      userId: user._id,
    })

    const count = await WaitlistDescuento.countDocuments()
    res.json({ ok: true, count: count + SEED })
  } catch (e) {
    res.status(500).json({ error: 'Error al unirse a la lista' })
  }
})

module.exports = router
