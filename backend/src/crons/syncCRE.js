const cron = require('node-cron')
const Estacion = require('../models/Estacion')
const PrecioHistorial = require('../models/PrecioHistorial')
const Alerta = require('../models/Alerta')
const Notificacion = require('../models/Notificacion')
const PushSuscripcion = require('../models/PushSuscripcion')
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
            location: e.location,
            precios: e.precios,
            ultima_actualizacion: e.ultima_actualizacion,
            activa: true,
          },
          $setOnInsert: {
            calle: null, colonia: null, razon_social: e.razon_social,
            estado: e.estado, municipio: e.municipio,
          },
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

    // Verificar alertas de precio activas
    verificarAlertas().catch(err => console.error('[Alertas]', err.message))

    // Geocodificar pendientes en background (no bloquea)
    geocodeAllPending().catch(err => console.error('[Geocode]', err.message))
  } catch (err) {
    console.error('[Sync CRE] Error:', err.message)
  }
}

async function verificarAlertas() {
  const alertas = await Alerta.find({ activa: true })
    .populate('estacion_id', 'nombre precios')
    .lean()
  if (!alertas.length) return

  const ahora = new Date()
  const hace24h = new Date(ahora - 24 * 60 * 60 * 1000)

  const disparadas = alertas.filter(a => {
    if (!a.estacion_id) return false
    const precio = a.estacion_id.precios?.[a.combustible]
    if (!precio || precio < 15) return false
    if (precio > a.precio_objetivo) return false
    // No re-notificar si ya se disparó en las últimas 24h
    if (a.ultima_notificacion && a.ultima_notificacion > hace24h) return false
    return true
  })

  if (!disparadas.length) {
    console.log('[Alertas] 0 alertas disparadas')
    return
  }

  const notifs = disparadas.map(a => ({
    usuario_id: a.usuario_id,
    tipo: 'alerta_precio',
    mensaje: `${a.estacion_id.nombre}: ${a.combustible} a $${a.estacion_id.precios[a.combustible].toFixed(2)} — por debajo de tu alerta de $${a.precio_objetivo.toFixed(2)}`,
    estacion_id: a.estacion_id._id,
    combustible: a.combustible,
    precio_actual: a.estacion_id.precios[a.combustible],
  }))

  await Notificacion.insertMany(notifs)

  // Actualizar ultima_notificacion en las alertas disparadas
  const ids = disparadas.map(a => a._id)
  await Alerta.updateMany({ _id: { $in: ids } }, { $set: { ultima_notificacion: ahora } })

  console.log(`[Alertas] 🔔 ${disparadas.length} alertas disparadas`)

  // Enviar Web Push a usuarios suscritos
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const { enviarPush } = require('../utils/webpush')
    for (const notif of notifs) {
      const subs = await PushSuscripcion.find({ usuario_id: notif.usuario_id }).lean()
      if (!subs.length) continue
      const payload = {
        title: 'GasMap — Alerta de precio',
        body: notif.mensaje,
        url: 'https://pruebatupagina-free.github.io/gasolineras-nl/',
      }
      const { ok, fail } = await enviarPush(subs, payload)
      console.log(`[Push] usuario ${notif.usuario_id}: ${ok} ok, ${fail} fail`)
    }
  }
}

module.exports = function initCrons() {
  cron.schedule('30 18 * * *', sincronizarPrecios, { timezone: 'America/Monterrey' })
  console.log('[Sync CRE] Cron programado: diario 18:30 Monterrey')
  return sincronizarPrecios
}

module.exports.sincronizarPrecios = sincronizarPrecios
