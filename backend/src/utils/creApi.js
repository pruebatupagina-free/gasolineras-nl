const axios = require('axios')
const xml2js = require('xml2js')

const PLACES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/places'
const PRICES_URL = 'https://publicacionexterna.azurewebsites.net/publicaciones/prices'

// Smaller/more precise states first to avoid bounding-box overlap mismatches
const ESTADOS_MX = [
  { nombre: 'CIUDAD DE MEXICO',      minLat: 19.05, maxLat: 19.60, minLng: -99.37, maxLng: -98.94 },
  { nombre: 'TLAXCALA',              minLat: 19.02, maxLat: 19.68, minLng: -98.79, maxLng: -97.93 },
  { nombre: 'MORELOS',               minLat: 18.21, maxLat: 19.14, minLng: -99.59, maxLng: -98.59 },
  { nombre: 'COLIMA',                minLat: 18.68, maxLat: 19.56, minLng: -104.74, maxLng: -103.52 },
  { nombre: 'AGUASCALIENTES',        minLat: 21.53, maxLat: 22.40, minLng: -102.52, maxLng: -101.70 },
  { nombre: 'QUERETARO',             minLat: 19.97, maxLat: 21.67, minLng: -100.54, maxLng: -99.06 },
  { nombre: 'HIDALGO',               minLat: 19.59, maxLat: 21.41, minLng: -99.92, maxLng: -97.87 },
  { nombre: 'ESTADO DE MEXICO',      minLat: 18.68, maxLat: 20.22, minLng: -100.60, maxLng: -98.60 },
  { nombre: 'GUANAJUATO',            minLat: 19.93, maxLat: 21.35, minLng: -102.13, maxLng: -99.69 },
  { nombre: 'TABASCO',               minLat: 17.16, maxLat: 18.72, minLng: -93.23, maxLng: -90.02 },
  { nombre: 'CAMPECHE',              minLat: 17.88, maxLat: 20.87, minLng: -91.73, maxLng: -89.09 },
  { nombre: 'QUINTANA ROO',          minLat: 17.88, maxLat: 21.65, minLng: -87.95, maxLng: -86.72 },
  { nombre: 'YUCATAN',               minLat: 19.48, maxLat: 21.65, minLng: -90.51, maxLng: -87.53 },
  { nombre: 'NAYARIT',               minLat: 20.64, maxLat: 23.10, minLng: -105.82, maxLng: -103.72 },
  { nombre: 'BAJA CALIFORNIA SUR',   minLat: 22.87, maxLat: 28.00, minLng: -115.80, maxLng: -109.40 },
  { nombre: 'SINALOA',               minLat: 22.47, maxLat: 26.92, minLng: -109.44, maxLng: -105.02 },
  { nombre: 'ZACATECAS',             minLat: 21.04, maxLat: 24.93, minLng: -104.12, maxLng: -100.69 },
  { nombre: 'SAN LUIS POTOSI',       minLat: 21.16, maxLat: 24.54, minLng: -102.38, maxLng: -98.24 },
  { nombre: 'TAMAULIPAS',            minLat: 22.17, maxLat: 27.83, minLng: -100.62, maxLng: -97.14 },
  { nombre: 'NUEVO LEON',            minLat: 23.12, maxLat: 27.78, minLng: -101.86, maxLng: -98.39 },
  { nombre: 'COAHUILA',              minLat: 24.53, maxLat: 29.88, minLng: -103.26, maxLng: -99.83 },
  { nombre: 'DURANGO',               minLat: 22.86, maxLat: 26.84, minLng: -107.82, maxLng: -102.47 },
  { nombre: 'CHIHUAHUA',             minLat: 25.63, maxLat: 31.79, minLng: -109.07, maxLng: -103.07 },
  { nombre: 'SONORA',                minLat: 26.44, maxLat: 32.72, minLng: -115.05, maxLng: -108.44 },
  { nombre: 'BAJA CALIFORNIA',       minLat: 28.00, maxLat: 32.72, minLng: -117.13, maxLng: -114.50 },
  { nombre: 'JALISCO',               minLat: 18.92, maxLat: 22.74, minLng: -105.81, maxLng: -101.40 },
  { nombre: 'MICHOACAN',             minLat: 17.91, maxLat: 20.38, minLng: -103.92, maxLng: -99.83 },
  { nombre: 'GUERRERO',              minLat: 16.27, maxLat: 18.88, minLng: -102.28, maxLng: -98.02 },
  { nombre: 'OAXACA',                minLat: 15.65, maxLat: 18.69, minLng: -98.54, maxLng: -93.61 },
  { nombre: 'CHIAPAS',               minLat: 14.53, maxLat: 17.99, minLng: -94.24, maxLng: -90.37 },
  { nombre: 'VERACRUZ',              minLat: 14.41, maxLat: 22.14, minLng: -98.36, maxLng: -93.62 },
  { nombre: 'PUEBLA',                minLat: 17.88, maxLat: 20.84, minLng: -99.17, maxLng: -96.72 },
]

function getEstadoFromCoords(lat, lng) {
  for (const e of ESTADOS_MX) {
    if (lat >= e.minLat && lat <= e.maxLat && lng >= e.minLng && lng <= e.maxLng) {
      return e.nombre
    }
  }
  return null
}

// ZMM municipio bounding boxes — returns null for stations outside ZMM
const ZMM_MUNICIPIOS = [
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
  for (const m of ZMM_MUNICIPIOS) {
    if (lat >= m.minLat && lat <= m.maxLat && lng >= m.minLng && lng <= m.maxLng) {
      return m.nombre
    }
  }
  return null
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

  const pricesMap = {}
  for (const place of pricesDoc.places?.place || []) {
    const id = place.$.place_id
    if (!pricesMap[id]) pricesMap[id] = {}
    for (const gp of place.gas_price || []) {
      pricesMap[id][gp.$.type] = parseFloat(gp._) || null
    }
  }

  const results = []
  for (const place of placesDoc.places?.place || []) {
    const id = place.$.place_id
    const lat = parseFloat(place.location?.[0]?.y?.[0] || 0)
    const lng = parseFloat(place.location?.[0]?.x?.[0] || 0)

    if (!lat || !lng) continue

    const prices = pricesMap[id] || {}
    if (!prices.regular && !prices.premium && !prices.diesel) continue

    const estado = getEstadoFromCoords(lat, lng)
    const municipio = getMunicipio(lat, lng)

    results.push({
      cre_id: place.cre_id?.[0] || `place_${id}`,
      nombre: (place.name?.[0] || 'Gasolinera').trim(),
      razon_social: (place.name?.[0] || '').trim(),
      municipio,
      estado,
      location: { type: 'Point', coordinates: [lng, lat] },
      precios: {
        magna: prices.regular || null,
        premium: prices.premium || null,
        diesel: prices.diesel || null,
      },
      ultima_actualizacion: new Date(),
    })
  }

  const conEstado = results.filter(r => r.estado).length
  console.log(`[CRE Azure] ${results.length} estaciones México (${conEstado} con estado detectado)`)
  return results
}

module.exports = { fetchEstacionesCRE }
