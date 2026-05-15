const Reporte = require('../models/Reporte')
const Estacion = require('../models/Estacion')

exports.crear = async (req, res, next) => {
  try {
    const { estacion_id, combustible, precio_reportado, tipo, notas } = req.body
    if (!estacion_id || !combustible || !precio_reportado) {
      return res.status(400).json({ error: 'estacion_id, combustible y precio_reportado son requeridos' })
    }
    const est = await Estacion.findById(estacion_id)
    if (!est) return res.status(404).json({ error: 'Estación no encontrada' })

    const r = await Reporte.create({
      usuario: req.user.id, estacion: estacion_id,
      combustible, precio_reportado, tipo: tipo || 'precio_incorrecto', notas: notas || '',
    })
    res.status(201).json({ ok: true, reporte: r._id })
  } catch (err) { next(err) }
}
