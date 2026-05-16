import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

const FUELS = [
  { key: 'magna',   label: 'Magna',   color: '#22C55E' },
  { key: 'premium', label: 'Premium', color: '#5E6AD2' },
  { key: 'diesel',  label: 'Diésel',  color: '#F59E0B' },
]

export default function PrecioReporteModal({ station, combustibleActivo, onClose, onSuccess }) {
  const [combustible, setCombustible] = useState(combustibleActivo || 'magna')
  const [precio, setPrecio] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const p = parseFloat(precio)
    if (!p || p < 15 || p > 45) return toast.error('Ingresa un precio válido ($15 – $45)')
    setLoading(true)
    try {
      await client.post(`/estaciones/${station._id}/precio-reporte`, { combustible, precio: p })
      toast.success('¡Precio reportado! Gracias por contribuir 🙌')
      onSuccess?.()
      onClose()
    } catch {
      toast.error('Error al reportar el precio')
    } finally {
      setLoading(false)
    }
  }

  const fc = FUELS.find(f => f.key === combustible)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="animate-sheet-up" style={{
        position: 'relative', width: '100%', zIndex: 1,
        background: 'linear-gradient(180deg, #13131a 0%, #0d0d13 100%)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
        padding: '12px 20px calc(env(safe-area-inset-bottom) + 32px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
              Reportar precio
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>
              ¿Qué precio ves en la bomba ahora?
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Fuel selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {FUELS.map(f => (
            <button key={f.key} onClick={() => setCombustible(f.key)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: combustible === f.key ? `${f.color}20` : 'rgba(255,255,255,0.05)',
              color: combustible === f.key ? f.color : '#8A8F98',
              outline: combustible === f.key ? `1px solid ${f.color}40` : 'none',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Price input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${fc?.color}30`,
          borderRadius: 14, padding: '16px 20px', marginBottom: 22,
        }}>
          <DollarSign size={22} color={fc?.color || '#8A8F98'} />
          <input
            type="number"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            placeholder="23.50"
            step="0.01"
            min="15"
            max="45"
            autoFocus
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'white', fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 800,
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--color-muted)', fontWeight: 600 }}>/litro</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !precio}
          className="pressable"
          style={{
            width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: precio ? `linear-gradient(135deg, ${fc?.color}, ${fc?.color}cc)` : 'rgba(255,255,255,0.07)',
            color: precio ? 'white' : 'rgba(255,255,255,0.25)',
            fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-body)',
            cursor: precio ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Enviando...' : 'Reportar precio'}
        </button>
      </div>
    </div>
  )
}
