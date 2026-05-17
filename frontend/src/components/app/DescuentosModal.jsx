import { useState, useEffect } from 'react'
import { X, Gift, CheckCircle, Zap, Tag, Users } from 'lucide-react'
import client from '../../api/client'

const PERKS = [
  { icon: Tag,   text: 'Hasta $0.50/L de descuento en estaciones afiliadas' },
  { icon: Zap,   text: 'Puntos "Gotas" por cada carga registrada en tu Garaje' },
  { icon: Users, text: 'Acceso anticipado antes del lanzamiento público' },
]

export default function DescuentosModal({ onClose }) {
  const [count, setCount]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [joined, setJoined]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    client.get('/descuentos/waitlist/count')
      .then(r => setCount(r.data.count))
      .catch(() => {})
  }, [])

  async function handleJoin() {
    setLoading(true)
    setError('')
    try {
      const r = await client.post('/descuentos/waitlist')
      setJoined(true)
      if (r.data.count) setCount(r.data.count)
    } catch (e) {
      setError('Hubo un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2001,
        background: '#111114',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 40px',
        animation: 'sheet-up 0.38s var(--easing, cubic-bezier(0.34,1.56,0.64,1)) both',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 24px' }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={16} color="white" />
        </button>

        {!joined ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={22} color="#FB923C" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>Descuentos en gasolina</div>
                <div style={{ fontSize: 12, color: '#FB923C', fontWeight: 600, marginTop: 2 }}>Próximamente · Acceso anticipado</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Estamos negociando descuentos directos con gasolineras en tu zona. Únete a la lista para ser de los primeros en acceder.
            </p>

            {/* Perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color="#FB923C" />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Social proof counter */}
            {count !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex' }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: `hsl(${30 + i * 20}, 90%, 60%)`, border: '2px solid #111114', marginLeft: i ? -6 : 0 }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  <strong style={{ color: 'white' }}>{count.toLocaleString()}</strong> personas ya en la lista
                </span>
              </div>
            )}

            {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 10 }}>{error}</div>}

            <button
              onClick={handleJoin}
              disabled={loading}
              style={{
                width: '100%', padding: '15px', borderRadius: 14, border: 'none',
                background: loading ? 'rgba(251,146,60,0.5)' : 'linear-gradient(135deg, #FB923C, #EA580C)',
                color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-heading)', letterSpacing: 0.3,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Guardando...' : 'Quiero acceso anticipado →'}
            </button>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={30} color="#22C55E" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)', marginBottom: 8 }}>¡Listo!</div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Te avisamos en cuanto los descuentos estén disponibles en tu zona.
            </p>
            {count !== null && (
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                Ya somos <strong style={{ color: '#22C55E' }}>{count.toLocaleString()}</strong> en la lista
              </div>
            )}
            <button
              onClick={onClose}
              style={{ marginTop: 24, width: '100%', padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>
  )
}
