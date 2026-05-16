import { useEffect, useState } from 'react'
import { X, Bell, BellOff, Fuel } from 'lucide-react'
import client from '../../api/client'

const COMBUST_COLORS = { magna: '#22C55E', premium: '#5E6AD2', diesel: '#F59E0B' }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const m = Math.floor(diff / 60000)
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default function NotificacionesPanel({ onClose }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/notificaciones')
      .then(res => setNotifs(res.data.notificaciones || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Mark all as read after 1s
    const t = setTimeout(() => {
      client.patch('/notificaciones/leidas').catch(() => {})
    }, 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end' }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative', width: '100%', zIndex: 1,
        background: 'linear-gradient(180deg, #16161e 0%, #0d0d13 100%)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '4px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={17} color="#5E6AD2" />
            <span style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>Notificaciones</span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>Cargando...</div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <BellOff size={36} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>Sin notificaciones aún</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                Crea alertas de precio en las estaciones para recibir avisos aquí
              </div>
            </div>
          ) : notifs.map(n => {
            const color = COMBUST_COLORS[n.combustible] || '#5E6AD2'
            return (
              <div key={n._id} style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                background: n.leida ? 'transparent' : 'rgba(94,106,210,0.04)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Fuel size={16} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'white', fontWeight: n.leida ? 400 : 600, lineHeight: 1.4 }}>
                    {n.mensaje}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                    {timeAgo(n.createdAt)}
                    {!n.leida && <span style={{ marginLeft: 8, background: '#5E6AD2', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700, color: 'white' }}>NUEVO</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
