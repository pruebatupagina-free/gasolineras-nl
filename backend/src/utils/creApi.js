const axios = require('axios')

const MUNICIPIOS_NL = ['SAN PEDRO GARZA GARCIA', 'SANTA CATARINA']
const ESTADO = 'NUEVO LEON'

// CRE datos.gob.mx API — paginated JSON
async function fetchEstacionesCRE() {
  const results = []
  let page = 1
  const perPage = 1000

  try {
    while (true) {
      const { data } = await axios.get('https://api.datos.gob.mx/v2/precio.gasolina.publico', {
        params: { pageSize: perPage, page },
        timeout: 30000,
      })

      const items = data.results || data.data || []
      if (!items.length) break

      for (const item of items) {
        const estado = (item.estado || item.state || '').toUpperCase()
        const municipio = (item.municipio || item.municipality || '').toUpperCase()
        if (estado.includes('NUEVO') && MUNICIPIOS_NL.some(m => municipio.includes(m.split(' ')[0]))) {
          results.push(normalizeEstacion(item))
        }
      }

      if (items.length < perPage) break
      page++
    }
  } catch (err) {
    console.error('[CRE API] Error fetching:', err.message)
  }

  return results
}

function normalizeEstacion(raw) {
  const lat = parseFloat(raw.lat || raw.latitude || raw.latitud || 0)
  const lng = parseFloat(raw.lng || raw.longitude || raw.longitud || 0)
  const municipio = (raw.municipio || raw.municipality || '').toUpperCase()

  const municipioNorm = MUNICIPIOS_NL.find(m => municipio.includes(m.split(' ')[0])) || municipio

  return {
    cre_id: raw.place_id || raw.cre_station_id || raw.id_cre || raw.id || String(Date.now()),
    nombre: raw.name || raw.nombre || raw.razon_social || 'Gasolinera',
    razon_social: raw.razon_social || raw.name || null,
    calle: raw.calle || raw.street || raw.address || null,
    numero_exterior: raw.numero_exterior || raw.number || null,
    colonia: raw.colonia || raw.neighborhood || null,
    municipio: municipioNorm,
    estado: ESTADO,
    codigo_postal: raw.cp || raw.codigo_postal || null,
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    precios: {
      magna: parseFloat(raw.regular_price || raw.magna || raw.precio_magna || 0) || null,
      premium: parseFloat(raw.premium_price || raw.premium || raw.precio_premium || 0) || null,
      diesel: parseFloat(raw.diesel_price || raw.diesel || raw.precio_diesel || 0) || null,
    },
    ultima_actualizacion: new Date(raw.date || raw.fecha || Date.now()),
  }
}

module.exports = { fetchEstacionesCRE }
