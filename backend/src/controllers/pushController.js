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

exports.testPush = async (req, res, next) => {
  try {
    const subs = await PushSuscripcion.find({ usuario_id: req.usuario.id }).lean()
    if (!subs.length) return res.status(404).json({ error: 'Sin suscripciones activas' })
    const { enviarPush } = require('../utils/webpush')
    const payload = {
      title: 'GasMap — Prueba de notificación',
      body: '🎉 Las notificaciones push están funcionando correctamente.',
      url: '/gasolineras-nl/',
    }
    const result = await enviarPush(subs, payload)
    res.json({ ok: true, ...result })
  } catch (err) { next(err) }
}
