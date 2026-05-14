import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Fuel, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const ACCENT = '#5E6AD2'
const ACCENT_HOVER = '#4F5BC0'
const ACCENT_GLOW = 'rgba(94,106,210,0.28)'

export default function RegisterPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.password) { toast.error('Completa todos los campos'); return }
    if (form.password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    try {
      const { data } = await client.post('/auth/register', form)
      login(data.token, data.user)
      toast.success('¡Cuenta creada! Bienvenido a GasMap')
      navigate('/app')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear la cuenta')
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
      <div className="blob-2" style={{ position: 'absolute', top: '20%', right: '20%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div className="blob-1" style={{ position: 'absolute', bottom: '15%', left: '15%', width: 360, height: 360, background: `radial-gradient(circle, rgba(94,106,210,0.08) 0%, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />

      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: 440, padding: '44px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 42, height: 42, background: `linear-gradient(135deg, ${ACCENT}, #4F5BC0)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${ACCENT_GLOW}` }}>
              <Fuel size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--color-fg)' }}>GasMap</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, marginTop: 28, marginBottom: 8, letterSpacing: '-0.3px' }}>Crea tu cuenta gratis</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14, fontWeight: 400 }}>Empieza a ahorrar en gasolina hoy</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { label: 'Nombre completo', name: 'nombre', type: 'text', icon: User, placeholder: 'Tu nombre' },
            { label: 'Correo electrónico', name: 'email', type: 'email', icon: Mail, placeholder: 'tu@email.com' },
          ].map(field => (
            <div key={field.name}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{field.label}</label>
              <div style={{ position: 'relative' }}>
                <field.icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange} placeholder={field.placeholder} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = 'rgba(94,106,210,0.06)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.background = 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" style={{ ...inputStyle, paddingRight: 46 }}
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
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creando cuenta...</> : 'Crear cuenta gratis'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--color-muted)', fontSize: 14 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
