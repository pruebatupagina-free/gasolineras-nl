const Vehiculo = require('../models/Vehiculo')
const Carga = require('../models/Carga')

// ─── Vehiculos ────────────────────────────────────────────────────────────────

exports.listVehiculos = async (req, res, next) => {
  try {
    const vehiculos = await Vehiculo.find({ usuario: req.user.id }).sort({ createdAt: -1 })
    res.json({ vehiculos })
  } catch (err) { next(err) }
}

exports.createVehiculo = async (req, res, next) => {
  try {
    const { nombre, marca, modelo, año, combustible, tanque, color, emoji } = req.body
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' })
    const v = await Vehiculo.create({ usuario: req.user.id, nombre, marca, modelo, año, combustible, tanque, color, emoji })
    res.status(201).json({ vehiculo: v })
  } catch (err) { next(err) }
}

exports.updateVehiculo = async (req, res, next) => {
  try {
    const v = await Vehiculo.findOneAndUpdate(
      { _id: req.params.id, usuario: req.user.id },
      req.body, { new: true, runValidators: true }
    )
    if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' })
    res.json({ vehiculo: v })
  } catch (err) { next(err) }
}

exports.deleteVehiculo = async (req, res, next) => {
  try {
    const v = await Vehiculo.findOneAndDelete({ _id: req.params.id, usuario: req.user.id })
    if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// ─── Cargas ───────────────────────────────────────────────────────────────────

exports.listCargas = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const cargas = await Carga.find({ usuario: req.user.id })
      .sort({ fecha: -1 }).skip(Number(offset)).limit(Number(limit))
      .populate('vehiculo', 'nombre emoji color')
    res.json({ cargas })
  } catch (err) { next(err) }
}

exports.createCarga = async (req, res, next) => {
  try {
    const { vehiculo, estacion, estacion_nombre, combustible, litros, precio_litro, km_actual, notas, fecha } = req.body
    if (!combustible || !litros || !precio_litro) return res.status(400).json({ error: 'combustible, litros y precio_litro son requeridos' })
    const c = await Carga.create({
      usuario: req.user.id, vehiculo, estacion, estacion_nombre, combustible,
      litros, precio_litro, km_actual, notas, fecha,
    })
    res.status(201).json({ carga: c })
  } catch (err) { next(err) }
}

exports.deleteCarga = async (req, res, next) => {
  try {
    const c = await Carga.findOneAndDelete({ _id: req.params.id, usuario: req.user.id })
    if (!c) return res.status(404).json({ error: 'Carga no encontrada' })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

exports.statsCargas = async (req, res, next) => {
  try {
    const uid = req.user.id
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [mes, total, porMes] = await Promise.all([
      Carga.aggregate([
        { $match: { usuario: require('mongoose').Types.ObjectId.createFromHexString(uid), fecha: { $gte: startOfMonth } } },
        { $group: { _id: null, total_mxn: { $sum: '$total' }, total_litros: { $sum: '$litros' }, cargas: { $sum: 1 }, precio_prom: { $avg: '$precio_litro' } } },
      ]),
      Carga.aggregate([
        { $match: { usuario: require('mongoose').Types.ObjectId.createFromHexString(uid) } },
        { $group: { _id: null, total_mxn: { $sum: '$total' }, total_litros: { $sum: '$litros' }, cargas: { $sum: 1 } } },
      ]),
      Carga.aggregate([
        { $match: { usuario: require('mongoose').Types.ObjectId.createFromHexString(uid) } },
        { $group: { _id: { año: { $year: '$fecha' }, mes: { $month: '$fecha' } }, total_mxn: { $sum: '$total' }, litros: { $sum: '$litros' }, cargas: { $sum: 1 } } },
        { $sort: { '_id.año': -1, '_id.mes': -1 } },
        { $limit: 6 },
      ]),
    ])

    res.json({
      mes: mes[0] || { total_mxn: 0, total_litros: 0, cargas: 0, precio_prom: 0 },
      total: total[0] || { total_mxn: 0, total_litros: 0, cargas: 0 },
      por_mes: porMes,
    })
  } catch (err) { next(err) }
}
