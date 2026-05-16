const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()
  try {
    req.usuario = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
  } catch {}
  next()
}
