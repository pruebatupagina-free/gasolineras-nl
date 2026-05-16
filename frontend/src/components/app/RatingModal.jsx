import { useState } from 'react'
import { X, Star } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

export default function RatingModal({ station, miResena, onClose, onSuccess }) {
  const [estrellas, setEstrellas] = useState(miResena?.estrellas || 0)
  const [hovered, setHovered] = useState(0)
  const [texto, setTexto] = useState(miResena?.texto || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!estrellas) return toast.error('Selecciona al menos 1 estrella')
    setLoading(true)
    try {
      await client.post(`/estaciones/${station._id}/resenas`, { estrellas, texto })
      toast.success(miResena ? 'Calificación actualizada' : '¡Gracias por tu calificación!')
      onSuccess?.()
      onClose()
    } catch {
      toast.error('Error al guardar la calificación')
    } finally {
      setLoading(false)
    }
  }

  const active = hovered || estrellas

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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)' }}>
              {miResena ? 'Editar calificación' : 'Calificar estación'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {station.nombre}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setEstrellas(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                transition: 'transform 0.12s',
                transform: active >= n ? 'scale(1.18)' : 'scale(1)',
              }}
            >
              <Star
                size={38}
                fill={active >= n ? '#F59E0B' : 'none'}
                color={active >= n ? '#F59E0B' : 'rgba(255,255,255,0.18)'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', height: 20, marginBottom: 20 }}>
          {active > 0 && (
            <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>{LABELS[active]}</span>
          )}
        </div>

        {/* Text review */}
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value.slice(0, 280))}
          placeholder="¿Cómo fue tu experiencia? (opcional)"
          style={{
            width: '100%', minHeight: 84, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            color: 'white', fontSize: 14, fontFamily: 'var(--font-body)',
            padding: '12px 14px', resize: 'none', outline: 'none',
            boxSizing: 'border-box', marginBottom: 6,
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--color-muted)', textAlign: 'right', marginBottom: 18 }}>
          {texto.length}/280
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !estrellas}
          className="pressable"
          style={{
            width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: estrellas ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.07)',
            color: estrellas ? 'white' : 'rgba(255,255,255,0.25)',
            fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-body)',
            cursor: estrellas ? 'pointer' : 'not-allowed',
            boxShadow: estrellas ? '0 4px 20px rgba(245,158,11,0.35)' : 'none',
          }}
        >
          {loading ? 'Guardando...' : miResena ? 'Actualizar calificación' : 'Publicar calificación'}
        </button>
      </div>
    </div>
  )
}
