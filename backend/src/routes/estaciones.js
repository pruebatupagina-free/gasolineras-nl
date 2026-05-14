const router = require('express').Router()
const ctrl = require('../controllers/estacionesController')

router.get('/nearby', ctrl.nearby)
router.get('/stats', ctrl.stats)
router.get('/', ctrl.list)
router.get('/:id', ctrl.getOne)

module.exports = router
