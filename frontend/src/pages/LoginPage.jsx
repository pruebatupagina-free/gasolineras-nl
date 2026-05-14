import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Fuel, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const ACCENT = '#5E6AD2'
const ACCENT_HOVER = '#4F5BC0'
const ACCENT_GLOW = 'rgba(94,106,210,0.28)'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Completa todos los campos'); return }
    setLoading(true)
    try {
      const { data } = await client.post('/auth/login', form)
      login(data.token, data.user)
      toast.success(`¡Bienvenido, ${data.user.nombre}!`)
      navigate('/app')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
    borderRadius: 12, padding: '13px 16px 13px 44px', color: 'var(--color-fg)', fontSize: 15,
    outline: 'none', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'var(--font-body)',
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient blob */}
      <div className="blob-1" style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%,-50%)', width: 520, height: 520, background: `radial-gradient(circle, rgba(94,106,210,0.09) 0%, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: '44px 40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 42, height: 42, background: `linear-gradient(135deg, ${ACCENT}, #4F5BC0)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${ACCENT_GLOW}` }}>
              <Fuel size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--color-fg)' }}>GasMap</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, marginTop: 28, marginBottom: 8, letterSpacing: '-0.3px' }}>Bienvenido de vuelta</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14, fontWeight: 400 }}>Inicia sesión para ver los precios</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = 'rgba(94,106,210,0.06)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 46 }}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = 'rgba(94,106,210,0.06)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'rgba(255,255,255,0.04)' }} />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? 'var(--color-secondary)' : ACCENT, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.25s var(--easing)', fontFamily: 'var(--font-body)', marginTop: 8, boxShadow: loading ? 'none' : `0 0 24px ${ACCENT_GLOW}` }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = ACCENT_HOVER; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = 'translateY(0)' } }}>
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Entrando...</> : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--color-muted)', fontSize: 14 }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>Créala gratis</Link>
        </p>
      </div>
    </div>
  )
}
