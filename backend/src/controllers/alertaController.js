const Alerta = require('../models/Alerta')
const Estacion = require('../models/Estacion')

// GET /api/alertas — alertas del usuario autenticado
exports.list = async (req, res, next) => {
  try {
    const alertas = await Alerta.find({ usuario_id: req.user.id })
      .populate('estacion_id', 'nombre municipio precios')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ alertas })
  } catch (err) { next(err) }
}

// POST /api/alertas
exports.crear = async (req, res, next) => {
  try {
    const { estacion_id, combustible, precio_objetivo } = req.body
    if (!estacion_id || !combustible || precio_objetivo == null)
      return res.status(400).json({ error: 'estacion_id, combustible y precio_objetivo son requeridos' })
    if (!['magna', 'premium', 'diesel'].includes(combustible))
      return res.status(400).json({ error: 'combustible inválido' })
    if (precio_objetivo < 10 || precio_objetivo > 50)
      return res.status(400).json({ error: 'precio_objetivo fuera de rango (10–50)' })

    const est = await Estacion.findById(estacion_id).select('nombre')
    if (!est) return res.status(404).json({ error: 'Estación no encontrada' })

    // Upsert: si ya existe alerta activa para este usuario+estacion+combustible, actualiza el precio
    const alerta = await Alerta.findOneAndUpdate(
      { usuario_id: req.user.id, estacion_id, combustible, activa: true },
      { precio_objetivo, ultima_notificacion: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.status(201).json({ alerta })
  } catch (err) { next(err) }
}

// DELETE /api/alertas/:id
exports.eliminar = async (req, res, next) => {
  try {
    const alerta = await Alerta.findOneAndDelete({ _id: req.params.id, usuario_id: req.user.id })
    if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}
