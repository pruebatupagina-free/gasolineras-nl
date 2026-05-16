import { useQuery } from '@tanstack/react-query'
import { Fuel, TrendingDown, BarChart2, Calendar, Droplets, ChevronRight } from 'lucide-react'
import client from '../../api/client'

const COMBUST_COLORS = {
  magna:   { color: '#22C55E', label: 'Magna' },
  premium: { color: '#5E6AD2', label: 'Premium' },
  diesel:  { color: '#F59E0B', label: 'Diésel' },
}

function groupByMonth(cargas) {
  const groups = {}
  for (const c of cargas) {
    const d = new Date(c.fecha)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1)
  return d.toLocaleString('es-MX', { month: 'long', year: 'numeric' })
}

export default function HistorialTab() {
  const { data: cargas = [], isLoading } = useQuery({
    queryKey: ['cargas'],
    queryFn: () => client.get('/garaje/cargas').then(r => r.data.cargas || []),
    staleTime: 2 * 60 * 1000,
  })

  const { data: stats } = useQuery({
    queryKey: ['cargas-stats'],
    queryFn: () => client.get('/garaje/cargas/stats').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const totalLitros = cargas.reduce((s, c) => s + (c.litros || 0), 0)
  const avgPrecio = cargas.length
    ? cargas.reduce((s, c) => s + (c.precio_litro || 0), 0) / cargas.length
    : 0

  const groups = groupByMonth(cargas)

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '16px 20px 0' }}>

        {/* Header */}
        <div className="animate-slide-up" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'white' }}>Historial</div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Registro de todas tus cargas</div>
        </div>

        {/* Summary cards */}
        {cargas.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Gastado', value: `$${(stats?.total?.total_mxn || 0).toFixed(0)}`, color: '#5E6AD2', icon: BarChart2 },
              { label: 'Litros', value: totalLitros.toFixed(0) + 'L', color: '#22C55E', icon: Droplets },
              { label: 'Precio avg', value: `$${avgPrecio.toFixed(2)}`, color: '#F59E0B', icon: TrendingDown },
            ].map(({ label, value, color, icon: Icon }, i) => (
              <div key={i} className={`animate-card-enter stagger-${i + 1}`} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '12px 10px', textAlign: 'center',
              }}>
                <Icon size={14} color={color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Este mes highlight */}
        {stats?.mes?.total_mxn > 0 && (
          <div className="animate-card-enter" style={{
            background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)',
            borderRadius: 16, padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#818CF8" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Gasto este mes</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#818CF8', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                ${(stats.mes?.total_mxn || 0).toFixed(0)} MXN
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 8 }} />)
        ) : cargas.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 18, padding: '40px 20px', textAlign: 'center', marginTop: 20,
          }}>
            <Fuel size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Sin cargas registradas</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.15)', lineHeight: 1.5 }}>
              Selecciona una gasolinera en el mapa y registra tu próxima carga
            </div>
          </div>
        ) : groups.map(([monthKey, items]) => (
          <div key={monthKey} style={{ marginBottom: 20 }}>
            {/* Month header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'capitalize' }}>
                {monthLabel(monthKey)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5E6AD2' }}>
                ${items.reduce((s, c) => s + (c.total || 0), 0).toFixed(0)}
              </div>
            </div>

            {/* Items */}
            {items.map((carga, i) => {
              const c = COMBUST_COLORS[carga.combustible] || COMBUST_COLORS.magna
              const fecha = new Date(carga.fecha)
              const vehicleEmoji = carga.vehiculo?.emoji || '🚗'
              return (
                <div
                  key={carga._id}
                  className={`animate-card-enter stagger-${Math.min(i + 1, 6)}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                  }}
                >
                  {/* Vehicle emoji */}
                  <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{vehicleEmoji}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {carga.estacion_nombre || 'Gasolinera'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: c.color, background: c.color + '15', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {c.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                        {carga.litros?.toFixed(1)}L · ${carga.precio_litro?.toFixed(2)}/L
                      </span>
                    </div>
                  </div>

                  {/* Total + date */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-heading)' }}>
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
        ))}
      </div>
    </div>
  )
}
