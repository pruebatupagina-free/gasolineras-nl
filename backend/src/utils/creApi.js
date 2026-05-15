const axios = require('axios')
const xml2js = require('xml2js')

const PLACES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/places'
const PRICES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/prices'

// Bounding box del estado de Nuevo León
const NL = { minLat: 23.1, maxLat: 27.9, minLng: -101.9, maxLng: -98.3 }

// Municipios de la ZMM con bounding boxes aproximados
const MUNICIPIOS = [
  { nombre: 'SAN PEDRO GARZA GARCIA', minLat: 25.59, maxLat: 25.71, minLng: -100.48, maxLng: -100.33 },
  { nombre: 'SANTA CATARINA',         minLat: 25.62, maxLat: 25.74, minLng: -100.65, maxLng: -100.40 },
  { nombre: 'GARCIA',                 minLat: 25.76, maxLat: 25.92, minLng: -100.70, maxLng: -100.55 },
  { nombre: 'GENERAL ESCOBEDO',       minLat: 25.77, maxLat: 25.89, minLng: -100.42, maxLng: -100.29 },
  { nombre: 'SAN NICOLAS DE LOS GARZA', minLat: 25.72, maxLat: 25.82, minLng: -100.35, maxLng: -100.21 },
  { nombre: 'APODACA',                minLat: 25.75, maxLat: 25.87, minLng: -100.27, maxLng: -100.10 },
  { nombre: 'JUAREZ',                 minLat: 25.63, maxLat: 25.75, minLng: -100.19, maxLng: -100.00 },
  { nombre: 'GUADALUPE',              minLat: 25.64, maxLat: 25.76, minLng: -100.30, maxLng: -100.14 },
  { nombre: 'MONTERREY',              minLat: 25.60, maxLat: 25.80, minLng: -100.43, maxLng: -100.19 },
]

function getMunicipio(lat, lng) {
  for (const m of MUNICIPIOS) {
    if (lat >= m.minLat && lat <= m.maxLat && lng >= m.minLng && lng <= m.maxLng) {
      return m.nombre
    }
  }
  return 'NUEVO LEON'
}

async function parseXML(xmlStr) {
  const parser = new xml2js.Parser({ explicitArray: true })
  return parser.parseStringPromise(xmlStr)
}

async function fetchEstacionesCRE() {
  console.log('[CRE Azure] Descargando places y prices...')

  const [placesRes, pricesRes] = await Promise.all([
    axios.get(PLACES_URL, { timeout: 45000, responseType: 'text' }),
    axios.get(PRICES_URL, { timeout: 45000, responseType: 'text' }),
  ])

  console.log('[CRE Azure] XMLs descargados, parseando...')

  const [placesDoc, pricesDoc] = await Promise.all([
    parseXML(placesRes.data),
    parseXML(pricesRes.data),
  ])

  // Construir mapa de precios por place_id (puede haber duplicados por combustible)
  const pricesMap = {}
  for (const place of pricesDoc.places?.place || []) {
    const id = place.$.place_id
    if (!pricesMap[id]) pricesMap[id] = {}
    for (const gp of place.gas_price || []) {
      pricesMap[id][gp.$.type] = parseFloat(gp._) || null
    }
  }

  // Filtrar estaciones de NL y construir documentos
  const results = []
  for (const place of placesDoc.places?.place || []) {
    const id = place.$.place_id
    const lat = parseFloat(place.location?.[0]?.y?.[0] || 0)
    const lng = parseFloat(place.location?.[0]?.x?.[0] || 0)

    if (!lat || !lng) continue
    if (lat < NL.minLat || lat > NL.maxLat || lng < NL.minLng || lng > NL.maxLng) continue

    const prices = pricesMap[id] || {}
    if (!prices.regular && !prices.premium && !prices.diesel) continue

    const municipio = getMunicipio(lat, lng)

    results.push({
      cre_id: place.cre_id?.[0] || `place_${id}`,
      nombre: (place.name?.[0] || 'Gasolinera').trim(),
      razon_social: (place.name?.[0] || '').trim(),
      municipio,
      estado: 'NUEVO LEON',
      location: { type: 'Point', coordinates: [lng, lat] },
      precios: {
        magna: prices.regular || null,
        premium: prices.premium || null,
        diesel: prices.diesel || null,
      },
      ultima_actualizacion: new Date(),
    })
  }

  console.log(`[CRE Azure] ${results.length} estaciones en NL encontradas`)
  return results
}

module.exports = { fetchEstacionesCRE }
