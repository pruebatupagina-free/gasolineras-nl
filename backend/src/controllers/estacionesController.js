const Estacion = require('../models/Estacion')

// GET /api/estaciones/nearby?lat=25.65&lng=-100.38&combustible=magna&radio=15
exports.nearby = async (req, res, next) => {
  try {
    const { lat, lng, combustible = 'magna', radio = 15 } = req.query
    if (!lat || !lng) return res.status(400).json({ error: 'lat y lng son requeridos' })

    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    const radioM = Math.min(parseFloat(radio) * 1000, 50000) // máx 50km

    const estaciones = await Estacion.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lngN, latN] },
          $maxDistance: radioM,
        },
      },
      activa: true,
      [`precios.${combustible}`]: { $ne: null, $gte: 15 },
    }).limit(50)

    // Enriquecer con distancia y ordenar por precio
    const conDistancia = estaciones.map(est => {
      const [eLng, eLat] = est.location.coordinates
      const distKm = haversine(latN, lngN, eLat, eLng)
      return {
        ...est.toObject(),
        distancia_km: Math.round(distKm * 10) / 10,
        precio_seleccionado: est.precios[combustible],
      }
    })

    conDistancia.sort((a, b) => (a.precio_seleccionado || 999) - (b.precio_seleccionado || 999))

    res.json({ combustible, total: conDistancia.length, estaciones: conDistancia })
  } catch (err) {
    next(err)
  }
}

// GET /api/estaciones — todas por municipio
exports.list = async (req, res, next) => {
  try {
    const { municipio, combustible = 'magna' } = req.query
    const filter = { activa: true, [`precios.${combustible}`]: { $ne: null, $gte: 15 } }
    if (municipio) filter.municipio = municipio.toUpperCase()

    const estaciones = await Estacion.find(filter).sort({ [`precios.${combustible}`]: 1 }).limit(100)
    res.json({ total: estaciones.length, estaciones })
  } catch (err) {
    next(err)
  }
}

// GET /api/estaciones/:id
exports.getOne = async (req, res, next) => {
  try {
    const est = await Estacion.findById(req.params.id)
    if (!est) return res.status(404).json({ error: 'Estación no encontrada' })
    res.json(est)
  } catch (err) {
    next(err)
  }
}

// GET /api/estaciones/stats — resumen de precios
exports.stats = async (req, res, next) => {
  try {
    const [magna, premium, diesel] = await Promise.all([
      Estacion.aggregate([
        { $match: { activa: true, 'precios.magna': { $ne: null, $gte: 15 } } },
        { $group: { _id: null, min: { $min: '$precios.magna' }, max: { $max: '$precios.magna' }, avg: { $avg: '$precios.magna' } } },
      ]),
      Estacion.aggregate([
        { $match: { activa: true, 'precios.premium': { $ne: null, $gte: 15 } } },
        { $group: { _id: null, min: { $min: '$precios.premium' }, max: { $max: '$precios.premium' }, avg: { $avg: '$precios.premium' } } },
      ]),
      Estacion.aggregate([
        { $match: { activa: true, 'precios.diesel': { $ne: null, $gte: 15 } } },
        { $group: { _id: null, min: { $min: '$precios.diesel' }, max: { $max: '$precios.diesel' }, avg: { $avg: '$precios.diesel' } } },
      ]),
    ])
    res.json({
      magna: magna[0] || null,
      premium: premium[0] || null,
      diesel: diesel[0] || null,
      actualizado: new Date(),
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/estaciones/sync-status
exports.syncStatus = (req, res) => {
  const now = new Date()
  const mty = new Date(now.toLocaleString('en-US', { timeZone: 'America/Monterrey' }))
  const next = new Date(mty)
  next.setHours(18, 30, 0, 0)
  if (mty >= next) next.setDate(next.getDate() + 1)
  const diffMs = next - mty
  const h = Math.floor(diffMs / 3600000)
  const m = Math.floor((diffMs % 3600000) / 60000)
  res.json({ next_sync_mty: next.toISOString(), diff_ms: diffMs, h, m })
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
