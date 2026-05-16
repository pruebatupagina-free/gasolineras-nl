import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingDown, TrendingUp, MapPin, Navigation, ChevronRight, Zap, Clock, Fuel, ArrowRight, Star, Bell } from 'lucide-react'
import client from '../../api/client'

const SLIDES = [
  {
    id: 1,
    title: 'Precios en tiempo real',
    subtitle: 'Datos oficiales de la CRE actualizados diariamente',
    accent: '#5E6AD2',
    glow: 'rgba(94,106,210,0.3)',
    icon: Zap,
    bg: 'linear-gradient(135deg, rgba(94,106,210,0.18) 0%, rgba(79,91,192,0.08) 100%)',
  },
  {
    id: 2,
    title: 'Ahorra en cada carga',
    subtitle: 'Compara precios y encuentra la gasolinera más barata cerca de ti',
    accent: '#22C55E',
    glow: 'rgba(34,197,94,0.3)',
    icon: TrendingDown,
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 100%)',
  },
  {
    id: 3,
    title: 'Garaje inteligente',
    subtitle: 'Registra tus cargas y controla el gasto de tu vehículo',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.3)',
    icon: Star,
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.06) 100%)',
  },
]

const COMBUST_COLORS = {
  magna:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',  label: 'Magna' },
  premium: { color: '#5E6AD2', bg: 'rgba(94,106,210,0.12)', border: 'rgba(94,106,210,0.25)', label: 'Premium' },
  diesel:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Diésel' },
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  const frame = useRef(null)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const animate = now => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) frame.current = requestAnimationFrame(animate)
    }
    frame.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])
  return val
}

function BannerCarousel() {
  const [active, setActive] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setActive(a => (a + 1) % SLIDES.length), 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  const slide = SLIDES[active]
  const Icon = slide.icon

  return (
    <div style={{ margin: '0 0 20px', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
      <div
        key={active}
        className="animate-slide-right"
        style={{
          background: slide.bg,
          border: `1px solid ${slide.accent}30`,
          borderRadius: 18,
          padding: '20px 20px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: slide.glow, filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${slide.accent}22`, border: `1px solid ${slide.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={slide.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>{slide.title}</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>{slide.subtitle}</div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 14, justifyContent: 'flex-end' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 18 : 6, height: 6,
                borderRadius: 3,
                background: i === active ? slide.accent : 'rgba(255,255,255,0.2)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function NearestStationCard({ station, combustible, userLocation, onViewMap }) {
  if (!station) return null
  const c = COMBUST_COLORS[combustible] || COMBUST_COLORS.magna
  const precio = station.precios?.[combustible]
  const dist = userLocation
    ? distanceKm(userLocation.lat, userLocation.lng, station.lat, station.lng)
    : null

  return (
    <div
      className="animate-card-enter pressable"
      onClick={onViewMap}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '16px 18px',
        marginBottom: 16,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '0 3px 3px 0', background: c.color }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Fuel size={22} color={c.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>
            Más cercana • {c.label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {station.nombre}
          </div>
          {dist !== null && (
            <div style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <MapPin size={10} />
              {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {precio ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                ${precio.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>por litro</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>—</div>
          )}
        </div>

        <ChevronRight size={16} color="var(--color-muted)" />
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, color, icon: Icon, delay = 0 }) {
  const animated = useCountUp(parseFloat(value) || 0, 900)

  return (
    <div
      className={`animate-card-enter stagger-${delay}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '12px 10px 10px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={11} color={color} />
        </div>
        <span style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
        ${animated.toFixed(2)}
      </div>
      {unit && <div style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 2 }}>{unit}</div>}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
      <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skeleton" style={{ height: 13, width: '65%', borderRadius: 6, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 6 }} />
      </div>
      <div className="skeleton" style={{ width: 50, height: 18, borderRadius: 6 }} />
    </div>
  )
}

export default function HomeTab({ user, estaciones, combustible, userLocation, syncCountdown, isLoading, onViewMap, onSelectStation }) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => client.get('/estaciones/stats').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const greeting = getGreeting()
  const nombre = user?.nombre || user?.email?.split('@')[0] || 'usuario'

  const nearest = userLocation && estaciones?.length
    ? [...estaciones]
        .filter(e => e.precios?.[combustible])
        .sort((a, b) => distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng))[0]
    : estaciones?.[0]

  const cheapest = estaciones?.length
    ? [...estaciones].filter(e => e.precios?.[combustible]).sort((a, b) => (a.precios[combustible] || 99) - (b.precios[combustible] || 99))[0]
    : null

  const statMin = stats?.[combustible]?.min
  const statMax = stats?.[combustible]?.max
  const statAvg = stats?.[combustible]?.avg

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '16px 20px 0' }}>

        {/* Greeting */}
        <div className="animate-slide-up" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 2 }}>{greeting},</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'white' }}>
              {nombre.charAt(0).toUpperCase() + nombre.slice(1)} 👋
            </div>
            {syncCountdown && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 20, padding: '4px 10px' }}>
                <Clock size={11} color="#5E6AD2" />
                <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 600 }}>Actualiza en {syncCountdown}</span>
              </div>
            )}
          </div>
        </div>

        {/* Banner carousel */}
        <BannerCarousel />

        {/* Stats row */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Precios hoy — {combustible.charAt(0).toUpperCase() + combustible.slice(1)}
          </div>
          {isLoading && !statMin ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
            </div>
          ) : (statMin || statAvg || statMax) ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {statMin && <StatCard label="Mínimo" value={statMin} color="#22C55E" icon={TrendingDown} delay={1} />}
              {statAvg && <StatCard label="Promedio" value={statAvg} color="#5E6AD2" icon={Fuel} delay={2} />}
              {statMax && <StatCard label="Máximo" value={statMax} color="#EF4444" icon={TrendingUp} delay={3} />}
            </div>
          ) : null}
        </div>

        {/* Nearest station */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Gasolinera más cercana
          </div>
          {isLoading && !nearest ? (
            <div className="skeleton" style={{ height: 82, borderRadius: 18, marginBottom: 16 }} />
          ) : nearest ? (
            <NearestStationCard station={nearest} combustible={combustible} userLocation={userLocation} onViewMap={() => { onSelectStation(nearest); onViewMap() }} />
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <MapPin size={24} color="var(--color-muted)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Activa tu ubicación para ver la más cercana</div>
            </div>
          )}
        </div>

        {/* Cheapest station */}
        {cheapest && cheapest._id !== nearest?._id && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Precio más bajo
            </div>
            <NearestStationCard station={cheapest} combustible={combustible} userLocation={userLocation} onViewMap={() => { onSelectStation(cheapest); onViewMap() }} />
          </div>
        )}

        {/* Quick actions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Acceso rápido
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Ver mapa', icon: Navigation, color: '#5E6AD2', onClick: onViewMap },
              { label: 'Más baratas', icon: TrendingDown, color: '#22C55E', onClick: onViewMap },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="pressable"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '14px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', color: action.color,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${action.color}15`, border: `1px solid ${action.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={action.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{action.label}</span>
                  <ArrowRight size={13} color="var(--color-muted)" style={{ marginLeft: 'auto' }} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Station list preview */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Gasolineras cercanas
            </div>
            {estaciones?.length > 0 && (
              <button onClick={onViewMap} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5E6AD2', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                Ver todas <ChevronRight size={12} />
              </button>
            )}
          </div>
          {isLoading && !estaciones?.length ? (
            [1,2,3,4].map(i => <SkeletonRow key={i} />)
          ) : estaciones?.length > 0 ? (
            estaciones.slice(0, 4).map((s, i) => {
              const precio = s.precios?.[combustible]
              const c = COMBUST_COLORS[combustible] || COMBUST_COLORS.magna
              const dist = userLocation
                ? distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng)
                : null
              return (
                <div
                  key={s._id}
                  className={`pressable animate-card-enter stagger-${i + 1}`}
                  onClick={() => { onSelectStation(s); onViewMap() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: precio ? c.color : 'var(--color-muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nombre}</div>
                    {dist !== null && <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: precio ? c.color : 'var(--color-muted)', fontFamily: 'var(--font-heading)' }}>
                    {precio ? `$${precio.toFixed(2)}` : '—'}
                  </div>
                  <ChevronRight size={13} color="rgba(255,255,255,0.2)" />
                </div>
              )
            })
          ) : null}
        </div>
      </div>
    </div>
  )
}
