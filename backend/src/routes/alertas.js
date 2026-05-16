const router = require('express').Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/alertaController')

router.get('/', auth, ctrl.list)
router.post('/', auth, ctrl.crear)
router.delete('/:id', auth, ctrl.eliminar)

module.exports = router
