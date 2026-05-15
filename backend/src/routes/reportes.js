const router = require('express').Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/reporteController')

router.post('/', auth, ctrl.crear)

module.exports = router
