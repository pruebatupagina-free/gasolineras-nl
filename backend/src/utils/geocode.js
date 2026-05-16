const axios = require('axios')
const Estacion = require('../models/Estacion')

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'GasMap-NL/1.0 (gasolineras precio tiempo real Mexico)' },
    timeout: 12000,
  })
  const a = data.address || {}
  const calle = [a.road, a.house_number].filter(Boolean).join(' ') || null
  const colonia = a.suburb || a.neighbourhood || a.quarter || null
  // Nominatim municipality for Mexico: city > municipality > town > county
  const municipioRaw = a.city || a.municipality || a.town || a.county || null
  const municipio = municipioRaw
    ? municipioRaw.toUpperCase().replace(/^MUNICIPIO\s+(DE\s+)?/i, '').trim()
    : null
  return { calle, colonia, municipio }
}

async function geocodeAllPending() {
  // Process stations missing street address or municipio, max 100 per run
  const pending = await Estacion.find({
    $or: [{ calle: null }, { municipio: null }],
    activa: true,
  }).select('_id location').limit(100).lean()

  if (!pending.length) {
    console.log('[Geocode] No hay estaciones pendientes de geocodificar')
    return 0
  }
  console.log(`[Geocode] Geocodificando ${pending.length} estaciones...`)
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
