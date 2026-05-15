import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Car, Fuel, Trash2, TrendingUp, Calendar, ChevronRight, X, Loader2, BarChart2 } from 'lucide-react'
import client from '../../api/client'
import toast from 'react-hot-toast'

const COMBUSTIBLES = ['magna', 'premium', 'diesel']
const COMBUST_COLORS = {
  magna:   { color: '#22C55E', label: 'Magna' },
  premium: { color: '#5E6AD2', label: 'Premium' },
  diesel:  { color: '#F59E0B', label: 'Diésel' },
}
const EMOJIS = ['🚗', '🚙', '🚕', '🏎️', '🚐', '🛻', '🚌', '🏍️', '⚡']

function AddVehicleSheet({ onClose, onCreated }) {
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [combustible, setCombustible] = useState('magna')
  const [emoji, setEmoji] = useState('🚗')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!nombre.trim()) { toast.error('El nombre es requerido'); return }
    setLoading(true)
    try {
      await client.post('/garaje/vehiculos', { nombre, marca, modelo, combustible, emoji })
      toast.success('Vehículo agregado')
      onCreated()
      onClose()
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end' }} className="animate-fade-in">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="animate-sheet-up" style={{
        position: 'relative', width: '100%',
        background: '#111114', borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
        padding: '8px 0 40px', zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'white' }}>Nuevo vehículo</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '0 20px' }}>
          {/* Emoji picker */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Icono</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} className="pressable" style={{
                  fontSize: 24, padding: '8px', borderRadius: 12, border: `2px solid ${emoji === e ? 'rgba(94,106,210,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  background: emoji === e ? 'rgba(94,106,210,0.12)' : 'transparent', cursor: 'pointer',
                }}>{e}</button>
              ))}
            </div>
          </div>

          {[
            { label: 'Nombre *', value: nombre, set: setNombre, placeholder: 'Ej: Mi Tsuru' },
            { label: 'Marca', value: marca, set: setMarca, placeholder: 'Ej: Nissan' },
            { label: 'Modelo', value: modelo, set: setModelo, placeholder: 'Ej: Tsuru 2018' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '11px 13px', color: 'white', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
              }} />
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Combustible</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {COMBUSTIBLES.map(c => (
                <button key={c} onClick={() => setCombustible(c)} className="pressable" style={{
                  flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  border: `1px solid ${combustible === c ? COMBUST_COLORS[c].color + '60' : 'rgba(255,255,255,0.08)'}`,
                  background: combustible === c ? COMBUST_COLORS[c].color + '15' : 'transparent',
                  color: combustible === c ? COMBUST_COLORS[c].color : 'var(--color-muted)',
                }}>{COMBUST_COLORS[c].label}</button>
              ))}
            </div>
          </div>

          <button onClick={submit} disabled={loading} className="pressable" style={{
            width: '100%', background: loading ? 'rgba(94,106,210,0.4)' : '#5E6AD2',
            color: 'white', border: 'none', borderRadius: 12, padding: '14px',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-body)',
          }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Guardando...</> : 'Guardar vehículo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SpendingChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.total || 0), 1)

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BarChart2 size={15} color="#5E6AD2" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Gasto últimos 6 meses</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
        {data.slice(-6).map((d, i) => {
          const h = ((d.total || 0) / max) * 100
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', height: `${Math.max(h, 4)}%`,
                minHeight: 4,
                background: `linear-gradient(180deg, #5E6AD2, #4F5BC0)`,
                borderRadius: '4px 4px 0 0',
                position: 'relative',
              }}>
                {h > 30 && (
                  <span style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                    ${Math.round(d.total || 0)}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 9, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                {d._id?.mes ? new Date(2024, d._id.mes - 1).toLocaleString('es', { month: 'short' }) : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function GarajeTab() {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const qc = useQueryClient()

  const { data: vehiculos = [], isLoading: loadingV } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: () => client.get('/garaje/vehiculos').then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['cargas-stats'],
    queryFn: () => client.get('/garaje/cargas/stats').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const { data: cargas = [], isLoading: loadingC } = useQuery({
    queryKey: ['cargas', selectedVehicle],
    queryFn: () => client.get('/garaje/cargas').then(r => r.data),
  })

  const deleteVehiculo = useMutation({
    mutationFn: id => client.delete(`/garaje/vehiculos/${id}`),
    onSuccess: () => { qc.invalidateQueries(['vehiculos']); toast.success('Vehículo eliminado') },
    onError: () => toast.error('No se pudo eliminar'),
  })

  const filteredCargas = selectedVehicle ? cargas.filter(c => c.vehiculo?._id === selectedVehicle) : cargas

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '16px 20px 0' }}>

        {/* Header */}
        <div className="animate-slide-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'white' }}>Garaje</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Tus vehículos y cargas</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="pressable" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#5E6AD2', border: 'none', borderRadius: 12,
            padding: '9px 14px', color: 'white', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 16px rgba(94,106,210,0.4)',
          }}>
            <Plus size={15} /> Agregar
          </button>
        </div>

        {/* Stats summary */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Este mes', value: `$${(stats.mes || 0).toFixed(0)}`, color: '#5E6AD2', icon: Calendar },
              { label: 'Total cargas', value: `$${(stats.total || 0).toFixed(0)}`, color: '#22C55E', icon: Fuel },
            ].map(({ label, value, color, icon: Icon }, i) => (
              <div key={i} className={`animate-card-enter stagger-${i + 1}`} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={13} color={color} />
                  <span style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Spending chart */}
        {stats?.porMes && <SpendingChart data={stats.porMes} />}

        {/* Vehicles */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Mis vehículos
          </div>

          {loadingV ? (
            <div style={{ display: 'flex', gap: 10 }}>
              {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, flex: 1, borderRadius: 14 }} />)}
            </div>
          ) : vehiculos.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px', textAlign: 'center' }}>
              <Car size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-muted)', marginBottom: 4 }}>Sin vehículos</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginBottom: 14 }}>Agrega tu vehículo para registrar tus cargas</div>
              <button onClick={() => setShowAdd(true)} className="pressable" style={{
                background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.3)',
                color: '#818CF8', borderRadius: 10, padding: '9px 18px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                Agregar vehículo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {vehiculos.map((v, i) => {
                const c = COMBUST_COLORS[v.combustible] || COMBUST_COLORS.magna
                const isSelected = selectedVehicle === v._id
                return (
                  <div
                    key={v._id}
                    className={`pressable animate-card-enter stagger-${i + 1}`}
                    onClick={() => setSelectedVehicle(isSelected ? null : v._id)}
                    style={{
                      minWidth: 130, borderRadius: 16, padding: '14px',
                      background: isSelected ? `${c.color}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? c.color + '40' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer', flexShrink: 0, position: 'relative',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{v.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{v.nombre}</div>
                    {v.marca && <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{v.marca}</div>}
                    <div style={{ fontSize: 10, color: c.color, marginTop: 4, fontWeight: 600 }}>{c.label}</div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteVehiculo.mutate(v._id) }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cargas history */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Historial de cargas {selectedVehicle && `(${vehiculos.find(v => v._id === selectedVehicle)?.nombre})`}
            </div>
          </div>

          {loadingC ? (
            [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 8 }} />)
          ) : filteredCargas.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
              <Fuel size={24} color="rgba(255,255,255,0.15)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Sin cargas registradas</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Registra tu primera carga desde el mapa</div>
            </div>
          ) : filteredCargas.map((carga, i) => {
            const c = COMBUST_COLORS[carga.combustible] || COMBUST_COLORS.magna
            const fecha = new Date(carga.fecha)
            return (
              <div key={carga._id} className={`animate-card-enter stagger-${Math.min(i + 1, 6)}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', marginBottom: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: c.color + '18', border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Fuel size={17} color={c.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {carga.estacion_nombre || 'Gasolinera'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                    {carga.litros?.toFixed(1)} L · ${carga.precio_litro?.toFixed(2)}/L · {c.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-heading)' }}>
                    ${carga.total?.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                    {fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAdd && <AddVehicleSheet onClose={() => setShowAdd(false)} onCreated={() => qc.invalidateQueries(['vehiculos'])} />}
    </div>
  )
}
