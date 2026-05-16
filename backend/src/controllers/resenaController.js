const mongoose = require('mongoose')
const Resena = require('../models/Resena')

exports.crearOActualizar = async (req, res, next) => {
  try {
    const { estrellas, texto } = req.body
    const estacion_id = req.params.id
    if (!estrellas || estrellas < 1 || estrellas > 5)
      return res.status(400).json({ error: 'Estrellas inválidas (1-5)' })

    const Usuario = require('../models/Usuario')
    const user = await Usuario.findById(req.usuario.id).select('nombre').lean()

    await Resena.findOneAndUpdate(
      { estacion_id, usuario_id: req.usuario.id },
      { estacion_id, usuario_id: req.usuario.id, nombre_usuario: user?.nombre || 'Usuario', estrellas: Number(estrellas), texto: (texto || '').slice(0, 280) },
      { upsert: true, new: true },
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.getResenas = async (req, res, next) => {
  try {
    const estacion_id = req.params.id
    const oid = new mongoose.Types.ObjectId(estacion_id)

    const [resenas, agg] = await Promise.all([
      Resena.find({ estacion_id }).sort({ createdAt: -1 }).limit(10).lean(),
      Resena.aggregate([
        { $match: { estacion_id: oid } },
        { $group: { _id: null, avg: { $avg: '$estrellas' }, count: { $sum: 1 } } },
      ]),
    ])

    const miResena = req.usuario
      ? await Resena.findOne({ estacion_id, usuario_id: req.usuario.id }).lean()
      : null

    res.json({
      resenas,
      avgRating: agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : null,
      totalRatings: agg[0]?.count || 0,
      miResena,
    })
  } catch (err) { next(err) }
}

exports.getRatingsStats = async (req, res, next) => {
  try {
    const stats = await Resena.aggregate([
      { $group: { _id: '$estacion_id', avg: { $avg: '$estrellas' }, count: { $sum: 1 } } },
    ])
    const result = {}
    stats.forEach(s => { result[s._id.toString()] = { avg: Math.round(s.avg * 10) / 10, count: s.count } })
    res.json(result)
  } catch (err) { next(err) }
}
