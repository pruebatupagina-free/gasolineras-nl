const mongoose = require('mongoose')
const PrecioReporte = require('../models/PrecioReporteUsuario')

exports.reportarPrecio = async (req, res, next) => {
  try {
    const { combustible, precio } = req.body
    const estacion_id = req.params.id
    if (!['magna', 'premium', 'diesel'].includes(combustible))
      return res.status(400).json({ error: 'Combustible inválido' })
    const p = Number(precio)
    if (!p || p < 10 || p > 50)
      return res.status(400).json({ error: 'Precio inválido (entre $10 y $50)' })

    await PrecioReporte.create({ estacion_id, usuario_id: req.usuario.id, combustible, precio: p })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.getPreciosReportados = async (req, res, next) => {
  try {
    const estacion_id = req.params.id
    const hace3h = new Date(Date.now() - 3 * 60 * 60 * 1000)

    const reportes = await PrecioReporte.aggregate([
      { $match: { estacion_id: new mongoose.Types.ObjectId(estacion_id), createdAt: { $gte: hace3h } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$combustible', precio: { $first: '$precio' }, fecha: { $first: '$createdAt' }, count: { $sum: 1 } } },
    ])

    const result = {}
    reportes.forEach(r => { result[r._id] = { precio: r.precio, fecha: r.fecha, count: r.count } })
    res.json(result)
  } catch (err) { next(err) }
}
