const webpush = require('web-push')

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@gasmap.mx'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

/**
 * Envía una Web Push a un array de suscripciones.
 * Ignora errores por suscripción expirada/inválida.
 */
async function enviarPush(suscripciones, payload) {
  const PushSuscripcion = require('../models/PushSuscripcion')
  const results = await Promise.allSettled(
    suscripciones.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys },
        JSON.stringify(payload),
      ).catch(async err => {
        // 410 Gone = suscripción expirada → borrar
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSuscripcion.deleteOne({ _id: s._id }).catch(() => {})
        }
        throw err
      })
    )
  )
  const ok = results.filter(r => r.status === 'fulfilled').length
  const fail = results.filter(r => r.status === 'rejected').length
  return { ok, fail }
}

module.exports = { enviarPush }
