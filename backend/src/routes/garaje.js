const router = require('express').Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/garajeController')

router.use(auth)

router.get('/vehiculos', ctrl.listVehiculos)
router.post('/vehiculos', ctrl.createVehiculo)
router.put('/vehiculos/:id', ctrl.updateVehiculo)
router.delete('/vehiculos/:id', ctrl.deleteVehiculo)

router.get('/cargas', ctrl.listCargas)
router.post('/cargas', ctrl.createCarga)
router.delete('/cargas/:id', ctrl.deleteCarga)
router.get('/cargas/stats', ctrl.statsCargas)

module.exports = router
