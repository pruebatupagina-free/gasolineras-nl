import { useState } from 'react'
import { LogOut, User, Shield, Info, ChevronRight, Bell, Moon, Zap, Star } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const APP_VERSION = '2.0.0'

export default function PerfilTab() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const nombre = user?.nombre || user?.email?.split('@')[0] || 'Usuario'
  const initials = nombre.slice(0, 2).toUpperCase()
  const email = user?.email || ''

  const menuItems = [
    {
      group: 'Cuenta',
      items: [
        { icon: User, label: 'Mi perfil', sub: email, color: '#5E6AD2' },
        { icon: Shield, label: 'Seguridad', sub: 'Contraseña y acceso', color: '#22C55E' },
        { icon: Bell, label: 'Notificaciones', sub: 'Alertas de precios', color: '#F59E0B' },
      ],
    },
    {
      group: 'Aplicación',
      items: [
        { icon: Zap, label: 'Actualización de datos', sub: 'CRE · 18:30 MTY diario', color: '#818CF8' },
        { icon: Info, label: 'Versión', sub: `GasMap v${APP_VERSION}`, color: 'var(--color-muted)' },
      ],
    },
  ]

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '20px 20px 0' }}>

        {/* Avatar section */}
        <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: 'white',
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 0 0 4px rgba(94,106,210,0.2), 0 8px 32px rgba(94,106,210,0.4)',
            marginBottom: 14,
          }}>
            {initials}
          </div>

          {/* Name */}
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'white', marginBottom: 4 }}>
            {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 12 }}>{email}</div>

          {/* Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)',
            borderRadius: 20, padding: '5px 12px',
          }}>
            <Star size={11} color="#818CF8" />
            <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 700 }}>Usuario GasMap</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Datos oficiales', value: 'CRE', color: '#22C55E' },
            { label: 'Actualización', value: 'Diaria', color: '#5E6AD2' },
          ].map(({ label, value, color }, i) => (
            <div key={i} className={`animate-card-enter stagger-${i + 1}`} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-heading)', marginBottom: 3 }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Menu groups */}
        {menuItems.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {group}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              {items.map(({ icon: Icon, label, sub, color }, i) => (
                <div
                  key={label}
                  className="pressable"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13,
                    padding: '14px 16px',
                    borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '18', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{label}</div>
                    {sub && <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>{sub}</div>}
                  </div>
                  <ChevronRight size={15} color="rgba(255,255,255,0.2)" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        {showLogoutConfirm ? (
          <div className="animate-scale-in" style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 16, padding: '16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, color: 'white', fontWeight: 600, marginBottom: 4 }}>¿Cerrar sesión?</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14 }}>Se perderán tus preferencias locales</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)} className="pressable" style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Cancelar</button>
              <button onClick={handleLogout} className="pressable" style={{
                flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Cerrar sesión</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="pressable"
            style={{
              width: '100%', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 14, padding: '14px', color: '#EF4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              marginBottom: 20,
            }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>GasMap v{APP_VERSION}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)', marginTop: 3 }}>Datos oficiales de la CRE · México</div>
        </div>
      </div>
    </div>
  )
}
