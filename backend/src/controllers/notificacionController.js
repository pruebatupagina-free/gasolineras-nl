const Notificacion = require('../models/Notificacion')

// GET /api/notificaciones — últimas 30, no leídas primero
exports.list = async (req, res, next) => {
  try {
    const notifs = await Notificacion.find({ usuario_id: req.user.id })
      .sort({ leida: 1, createdAt: -1 })
      .limit(30)
      .lean()
    const no_leidas = notifs.filter(n => !n.leida).length
    res.json({ notificaciones: notifs, no_leidas })
  } catch (err) { next(err) }
}

// PATCH /api/notificaciones/leidas — marcar todas como leídas
exports.marcarLeidas = async (req, res, next) => {
  try {
    await Notificacion.updateMany({ usuario_id: req.user.id, leida: false }, { $set: { leida: true } })
    res.json({ ok: true })
  } catch (err) { next(err) }
}
