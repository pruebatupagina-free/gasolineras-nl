const cron = require('node-cron')
const Estacion = require('../models/Estacion')
const { fetchEstacionesCRE } = require('../utils/creApi')

async function sincronizarPrecios() {
  console.log('[Sync CRE] Iniciando sincronización...')
  try {
    const estaciones = await fetchEstacionesCRE()
    if (!estaciones.length) {
      console.log('[Sync CRE] No se obtuvieron datos de la CRE.')
      return
    }

    // Limpiar colección y reemplazar con datos frescos
    await Estacion.deleteMany({})

    const docs = await Estacion.insertMany(estaciones, { ordered: false })
    console.log(`[Sync CRE] ✅ ${docs.length} estaciones actualizadas desde CRE Azure`)
  } catch (err) {
    console.error('[Sync CRE] Error:', err.message)
  }
}

module.exports = function initCrons() {
  cron.schedule('30 18 * * *', sincronizarPrecios, { timezone: 'America/Monterrey' })
  console.log('[Sync CRE] Cron programado: diario 18:30 Monterrey')
  return sincronizarPrecios
}

module.exports.sincronizarPrecios = sincronizarPrecios
