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

    let actualizadas = 0
    let nuevas = 0

    for (const est of estaciones) {
      if (!est.location.coordinates[0] || !est.location.coordinates[1]) continue

      const result = await Estacion.findOneAndUpdate(
        { cre_id: est.cre_id },
        { $set: est },
        { upsert: true, new: true }
      )
      if (result.createdAt?.getTime() === result.updatedAt?.getTime()) nuevas++
      else actualizadas++
    }

    console.log(`[Sync CRE] ✅ ${nuevas} nuevas, ${actualizadas} actualizadas`)
  } catch (err) {
    console.error('[Sync CRE] Error:', err.message)
  }
}

module.exports = function initCrons() {
  // Ejecutar diariamente a las 18:30 (después de que CRE actualiza a las 18:00)
  cron.schedule('30 18 * * *', sincronizarPrecios, { timezone: 'America/Monterrey' })
  console.log('[Sync CRE] Cron programado: diario 18:30 Monterrey')
  return sincronizarPrecios
}

module.exports.sincronizarPrecios = sincronizarPrecios
