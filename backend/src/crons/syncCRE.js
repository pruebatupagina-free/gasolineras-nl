const cron = require('node-cron')
const Estacion = require('../models/Estacion')
const PrecioHistorial = require('../models/PrecioHistorial')
const { fetchEstacionesCRE } = require('../utils/creApi')
const { geocodeAllPending } = require('../utils/geocode')

async function sincronizarPrecios() {
  console.log('[Sync CRE] Iniciando sincronización...')
  try {
    const estaciones = await fetchEstacionesCRE()
    if (!estaciones.length) {
      console.log('[Sync CRE] No se obtuvieron datos de la CRE.')
      return
    }

    // Upsert por cre_id — preserva calle/colonia ya geocodificadas
    const bulk = estaciones.map(e => ({
      updateOne: {
        filter: { cre_id: e.cre_id },
        update: {
          $set: {
            nombre: e.nombre,
            municipio: e.municipio,
            estado: e.estado,
            location: e.location,
            precios: e.precios,
            ultima_actualizacion: e.ultima_actualizacion,
            activa: true,
          },
          $setOnInsert: { calle: null, colonia: null, razon_social: e.razon_social },
        },
        upsert: true,
      },
    }))
    const result = await Estacion.bulkWrite(bulk, { ordered: false })
    const syncedIds = estaciones.map(e => e.cre_id)
    await Estacion.updateMany({ cre_id: { $nin: syncedIds } }, { $set: { activa: false } })

    console.log(`[Sync CRE] ✅ ${result.upsertedCount} nuevas, ${result.modifiedCount} actualizadas`)

    // Snapshot de precios históricos — uno por estación por día
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const activas = await Estacion.find({ activa: true }).select('_id precios').lean()
    const snapBulk = activas.map(est => ({
      updateOne: {
        filter: { estacion_id: est._id, fecha: today },
        update: { $setOnInsert: { precios: est.precios } },
        upsert: true,
      },
    }))
    if (snapBulk.length) {
      await PrecioHistorial.bulkWrite(snapBulk, { ordered: false })
      console.log(`[Sync CRE] 📸 ${snapBulk.length} snapshots de precio guardados`)
    }

    // Geocodificar pendientes en background (no bloquea)
    geocodeAllPending().catch(err => console.error('[Geocode]', err.message))
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
