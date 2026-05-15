const axios = require('axios')
const Estacion = require('../models/Estacion')

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'GasMap-NL/1.0 (gasolineras precio tiempo real NL)' },
    timeout: 12000,
  })
  const a = data.address || {}
  const calle = [a.road, a.house_number].filter(Boolean).join(' ') || null
  const colonia = a.suburb || a.neighbourhood || a.quarter || a.village || null
  return { calle, colonia }
}

async function geocodeAllPending() {
  const pending = await Estacion.find({ calle: null, activa: true }).select('_id location').lean()
  if (!pending.length) {
    console.log('[Geocode] No hay estaciones pendientes de geocodificar')
    return 0
  }
  console.log(`[Geocode] Iniciando geocodificación de ${pending.length} estaciones...`)
  let done = 0
  for (const est of pending) {
    try {
      const [lng, lat] = est.location.coordinates
      const addr = await reverseGeocode(lat, lng)
      await Estacion.updateOne({ _id: est._id }, { $set: addr })
      done++
      if (done % 50 === 0) console.log(`[Geocode] ${done}/${pending.length} procesadas`)
    } catch (err) {
      console.error(`[Geocode] Error ${est._id}:`, err.message)
    }
    await new Promise(r => setTimeout(r, 1100))
  }
  console.log(`[Geocode] ✅ ${done} estaciones geocodificadas`)
  return done
}

module.exports = { geocodeAllPending }
