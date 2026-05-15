import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

const TIPOS = [
  { key: 'precio_incorrecto', label: 'Precio incorrecto' },
  { key: 'cerrada',           label: 'Estación cerrada' },
  { key: 'sin_combustible',   label: 'Sin combustible' },
  { key: 'otro',              label: 'Otro problema' },
]

export default function ReportModal({ station, combustible, onClose }) {
  const [tipo, setTipo]   = useState('precio_incorrecto')
  const [precio, setPrecio] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!precio && tipo === 'precio_incorrecto') {
      toast.error('Ingresa el precio que viste')
      return
    }
    setLoading(true)
    try {
      await client.post('/reportes', {
        estacion_id: station._id, combustible, tipo,
        precio_reportado: parseFloat(precio) || station.precios?.[combustible] || 0,
        notas,
      })
      setDone(true)
    } catch {
      toast.error('No se pudo enviar el reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end' }} className="animate-fade-in">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="animate-sheet-up" style={{
        position: 'relative', width: '100%', background: '#111114',
        borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 0 32px', zIndex: 1,
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'white' }}>Reportar precio</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{station.nombre}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div style={{ padding: '20px 24px 8px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={28} color="#22C55E" />
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 8 }}>¡Reporte enviado!</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>Gracias por ayudar a mantener los datos precisos.</div>
            <button onClick={onClose} className="pressable" style={{ width: '100%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '13px', color: '#22C55E', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Cerrar
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {/* Tipo */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Tipo de problema</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TIPOS.map(t => (
                  <button key={t.key} onClick={() => setTipo(t.key)} className="pressable" style={{
                    padding: '10px 12px', borderRadius: 10, border: `1px solid ${tipo === t.key ? 'rgba(94,106,210,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    background: tipo === t.key ? 'rgba(94,106,210,0.12)' : 'transparent',
                    color: tipo === t.key ? '#818CF8' : 'var(--color-muted)', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s', textAlign: 'left',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {tipo === 'precio_incorrecto' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Precio que viste (MXN)</div>
                <input
                  type="number" inputMode="decimal" placeholder="Ej: 23.50" value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Notas (opcional)</div>
              <textarea
                placeholder="Cualquier detalle adicional..." value={notas}
                onChange={e => setNotas(e.target.value)} rows={2}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button onClick={submit} disabled={loading} className="pressable" style={{
              width: '100%', background: loading ? 'rgba(94,106,210,0.4)' : '#5E6AD2',
              color: 'white', border: 'none', borderRadius: 12, padding: '14px',
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-body)',
            }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : 'Enviar reporte'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
