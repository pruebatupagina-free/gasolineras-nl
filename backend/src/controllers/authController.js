const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Usuario = require('../models/Usuario')

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function safeUser(u) {
  const obj = u.toObject ? u.toObject() : u
  const { password, resetToken, resetTokenExpires, __v, ...rest } = obj
  return rest
}

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body
    if (!nombre || !email || !password ||
        typeof email !== 'string' || typeof password !== 'string' || typeof nombre !== 'string')
      return res.status(400).json({ error: 'nombre, email y contraseña son requeridos' })
    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })

    const exists = await Usuario.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })

    const hash = await bcrypt.hash(password, 12)
    const user = await Usuario.create({ nombre: nombre.trim(), email: email.toLowerCase(), password: hash })
    const token = signToken(user)
    res.status(201).json({ token, user: safeUser(user) })
  } catch (err) {
    next(err)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Email y contraseña requeridos' })

    const user = await Usuario.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })

    const token = signToken(user)
    res.json({ token, user: safeUser(user) })
  } catch (err) {
    next(err)
  }
}

exports.me = async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id).select('-password -resetToken -resetTokenExpires')
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}
