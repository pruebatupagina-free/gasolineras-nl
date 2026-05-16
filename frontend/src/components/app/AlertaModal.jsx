import { useState } from 'react'
import { X, Bell, ChevronDown, ChevronUp } from 'lucide-react'
import client from '../../api/client'

const COMBUST_LABELS = { magna: 'Magna', premium: 'Premium', diesel: 'Diésel' }
const COMBUST_COLORS = { magna: '#22C55E', premium: '#5E6AD2', diesel: '#F59E0B' }

export default function AlertaModal({ station, combustible, precioActual, onClose, onCreated }) {
  const [precio, setPrecio] = useState(
    precioActual ? (precioActual - 0.5).toFixed(2) : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const color = COMBUST_COLORS[combustible] || '#5E6AD2'
  const label = COMBUST_LABELS[combustible] || combustible

  function adjust(delta) {
    const v = parseFloat(precio) || precioActual || 20
    setPrecio(Math.max(10, Math.min(50, v + delta)).toFixed(2))
  }

  async function handleCrear() {
    const v = parseFloat(precio)
    if (!v || v < 10 || v > 50) { setError('Ingresa un precio entre $10 y $50'); return }
    setLoading(true)
    setError(null)
    try {
      await client.post('/alertas', {
        estacion_id: station._id,
        combustible,
        precio_objetivo: v,
      })
      onCreated?.()
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear alerta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end' }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative', width: '100%', zIndex: 1,
        background: 'linear-gradient(180deg, #16161e 0%, #0d0d13 100%)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
        padding: '20px 20px calc(env(safe-area-inset-bottom) + 24px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `${color}18`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
                Alerta de precio
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 1 }}>
                {station.nombre?.substring(0, 30)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Context */}
        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
              Precio actual · {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>
              {precioActual ? `$${precioActual.toFixed(2)}` : '—'}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'right', lineHeight: 1.5 }}>
            Te avisamos cuando<br />baje de tu objetivo
          </div>
        </div>

        {/* Price input */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Notificarme cuando baje de
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => adjust(-0.5)}
              style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronDown size={20} color="white" />
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: 15, color: 'var(--color-muted)', fontWeight: 700 }}>$</span>
              <input
                type="number"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                step="0.01"
                min="10"
                max="50"
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  fontSize: 36, fontWeight: 800, color: 'white',
                  fontFamily: 'var(--font-heading)', width: 120, textAlign: 'center',
                }}
              />
            </div>
            <button onClick={() => adjust(0.5)}
              style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronUp size={20} color="white" />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 10 }}>{error}</div>
        )}

        <button
          onClick={handleCrear}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: 'white', fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-body)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: `0 4px 20px ${color}40`,
            marginTop: 4,
          }}
        >
          {loading ? 'Creando...' : '🔔 Crear alerta'}
        </button>
      </div>
    </div>
  )
}
