const router = require('express').Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/notificacionController')

router.get('/', auth, ctrl.list)
router.patch('/leidas', auth, ctrl.marcarLeidas)

module.exports = router
