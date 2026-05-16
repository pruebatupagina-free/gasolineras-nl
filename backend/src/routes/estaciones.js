const router = require('express').Router()
const ctrl = require('../controllers/estacionesController')
const auth = require('../middleware/auth')
const optionalAuth = require('../middleware/optionalAuth')
const resenaCtrl = require('../controllers/resenaController')
const precioCtrl = require('../controllers/precioReporteController')

router.get('/nearby', ctrl.nearby)
router.get('/stats', ctrl.stats)
router.get('/sync-status', ctrl.syncStatus)
router.get('/ratings-stats', resenaCtrl.getRatingsStats)
router.get('/', ctrl.list)
router.get('/:id/historial', ctrl.historial)

// Comunidad
router.post('/:id/resenas', auth, resenaCtrl.crearOActualizar)
router.get('/:id/resenas', optionalAuth, resenaCtrl.getResenas)
router.post('/:id/precio-reporte', auth, precioCtrl.reportarPrecio)
router.get('/:id/precio-reporte', precioCtrl.getPreciosReportados)

router.get('/:id', ctrl.getOne)

module.exports = router
