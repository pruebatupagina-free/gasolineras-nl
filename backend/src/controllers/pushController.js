const PushSuscripcion = require('../models/PushSuscripcion')

exports.subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Suscripción inválida' })
    }
    await PushSuscripcion.findOneAndUpdate(
      { endpoint },
      { usuario_id: req.usuario.id, endpoint, keys },
      { upsert: true, new: true },
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body
    await PushSuscripcion.deleteOne({ endpoint, usuario_id: req.usuario.id })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.vapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' })
}
