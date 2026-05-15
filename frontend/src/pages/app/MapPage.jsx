import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useQuery } from '@tanstack/react-query'
import {
  Fuel, MapPin, Navigation, TrendingDown, LogOut, Loader2, RefreshCw,
  ChevronDown, Home, Map, Clock, User, ChevronRight, Zap, Bell, ArrowRight,
  Car, History, Target,
} from 'lucide-react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import NavigationOverlay from '../../components/map/NavigationOverlay'
import { useNavigate } from 'react-router-dom'

// ─── Leaflet icons ───────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useNextSyncCountdown() {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      const mtyMs = now.getTime() - now.getTimezoneOffset() * 60000 - 6 * 3600000
      const mty = new Date(mtyMs)
      const next = new Date(mty)
      next.setHours(18, 30, 0, 0)
      if (mty >= next) next.setDate(next.getDate() + 1)
      const diff = next - mty
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(`${h}h ${m}m`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [])
  return label
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const COMBUSTIBLES = [
  { key: 'magna', label: 'Magna', color: '#22C55E' },
  { key: 'premium', label: 'Premium', color: '#5E6AD2' },
  { key: 'diesel', label: 'Diésel', color: '#F59E0B' },
]

function getPriceClass(precio, min, max) {
  if (!precio) return 'marker-mid'
  const range = max - min
  if (range === 0) return 'marker-mid'
  const pct = (precio - min) / range
  if (pct < 0.33) return 'marker-cheap'
  if (pct < 0.66) return 'marker-mid'
  return 'marker-expensive'
}

function createMarkerIcon(precio, priceClass) {
  const colors = { 'marker-cheap': '#22C55E', 'marker-mid': '#F59E0B', 'marker-expensive': '#EF4444' }
  const color = colors[priceClass] || '#F59E0B'
  const label = precio ? `$${precio.toFixed(0)}` : '?'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.4);">
      <span style="color:white;font-weight:700;font-size:10px;font-family:'Manrope',sans-serif;">${label}</span>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22],
  })
}

function UserMarker({ position }) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;background:rgba(94,106,210,0.3);border-radius:50%;animation:pulse-ring 1.5s ease-out infinite;"></div>
      <div style="position:absolute;inset:3px;background:#5E6AD2;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(94,106,210,0.7);"></div>
    </div>`,
    iconSize: [20, 20], iconAnchor: [10, 10],
  })
  return <Marker position={[position.lat, position.lng]} icon={icon} />
}

function RecenterMap({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], 13, { animate: true, duration: 1 })
  }, [position, map])
  return null
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const items = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'mapa', icon: Map, label: 'Estaciones' },
    { id: 'historial', icon: History, label: 'Historial' },
    { id: 'perfil', icon: User, label: 'Perfil' },
  ]
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
      background: 'rgba(5,5,6,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      height: 64, paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="bottom-nav">
      {items.slice(0, 2).map(item => (
        <NavItem key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />
      ))}

      {/* Center FAB */}
      <button onClick={() => onChange('mapa')} style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(94,106,210,0.5)',
        transform: 'translateY(-8px)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(94,106,210,0.65)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(94,106,210,0.5)' }}
      >
        <Target size={22} color="white" />
      </button>

      {items.slice(2).map(item => (
        <NavItem key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />
      ))}
    </nav>
  )
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '8px 16px', borderRadius: 10, transition: 'all 0.15s',
      color: active ? '#5E6AD2' : '#8A8F98',
      minWidth: 64,
    }}>
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: 'var(--font-body)', letterSpacing: 0.3 }}>
        {item.label}
      </span>
      {active && (
        <div style={{ position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: '50%', background: '#5E6AD2' }} />
      )}
    </button>
  )
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
const BANNERS = [
  {
    title: '¡Encuentra el mejor precio cerca!',
    desc: 'Compara precios y ahorra en cada carga.',
    cta: 'EXPLORAR MAPA',
    tab: 'mapa',
    gradient: 'linear-gradient(135deg, #1a1a3e 0%, #2d2f6b 100%)',
    accent: '#5E6AD2',
    icon: '⛽',
  },
  {
    title: '¡Precios actualizados cada día!',
    desc: 'Datos oficiales de la CRE, sincronizados a las 18:30.',
    cta: 'VER ESTACIONES',
    tab: 'mapa',
    gradient: 'linear-gradient(135deg, #0d2b1a 0%, #1a4d2e 100%)',
    accent: '#22C55E',
    icon: '📡',
  },
  {
    title: 'Más de 1,200 gasolineras en NL',
    desc: 'Cobertura completa del área metropolitana de Monterrey.',
    cta: 'EMPEZAR',
    tab: 'mapa',
    gradient: 'linear-gradient(135deg, #2b1a0d 0%, #4d3010 100%)',
    accent: '#F59E0B',
    icon: '🗺️',
  },
]

function BannerCarousel({ onTabChange }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  const banner = BANNERS[idx]

  return (
    <div style={{ padding: '0 16px', marginBottom: 20 }}>
      <div style={{
        borderRadius: 16, overflow: 'hidden', position: 'relative',
        background: banner.gradient,
        border: `1px solid ${banner.accent}33`,
        transition: 'background 0.5s',
      }}>
        <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 40, lineHeight: 1 }}>{banner.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'white', marginBottom: 4, lineHeight: 1.3 }}>
              {banner.title}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 14, lineHeight: 1.4 }}>
              {banner.desc}
            </div>
            <button onClick={() => onTabChange(banner.tab)} style={{
              background: banner.accent, color: 'white', border: 'none', borderRadius: 20,
              padding: '7px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'var(--font-body)', letterSpacing: 0.5,
            }}>
              {banner.cta}
            </button>
          </div>
        </div>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 12 }}>
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
              background: i === idx ? banner.accent : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s', padding: 0,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HomeTab({ user, onTabChange, position, nextSync }) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => { const { data } = await client.get('/estaciones/stats'); return data },
    staleTime: 10 * 60 * 1000,
  })

  const nombre = user?.nombre || user?.email?.split('@')[0] || 'usuario'

  const fuelStats = [
    { key: 'magna', label: 'Magna', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', data: stats?.magna },
    { key: 'premium', label: 'Premium', color: '#5E6AD2', bg: 'rgba(94,106,210,0.1)', data: stats?.premium },
    { key: 'diesel', label: 'Diésel', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', data: stats?.diesel },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
      {/* Header greeting */}
      <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 2 }}>Hola,</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'white' }}>
            {nombre.charAt(0).toUpperCase() + nombre.slice(1)} 👋
          </div>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: 'white',
        }}>
          {nombre[0].toUpperCase()}
        </div>
      </div>

      {/* Update countdown badge */}
      {nextSync && (
        <div style={{ margin: '0 16px 16px', padding: '10px 14px', borderRadius: 10, background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0, animation: 'pulse-ring 2s ease-out infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>Precios actualizados · próxima sincronización en <strong style={{ color: 'white' }}>{nextSync}</strong></span>
        </div>
      )}

      {/* Banner carousel */}
      <BannerCarousel onTabChange={onTabChange} />

      {/* Price stats */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Precios mínimos en NL
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {fuelStats.map(({ key, label, color, bg, data }) => (
            <div key={key} onClick={() => onTabChange('mapa')} style={{
              flex: 1, background: bg, border: `1px solid ${color}22`,
              borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: 11, color, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              {data ? (
                <>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: 'white' }}>
                    ${data.min?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                    prom. ${data.avg?.toFixed(2)}
                  </div>
                </>
              ) : (
                <div style={{ height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 6, animation: 'shimmer 1.5s ease-in-out infinite' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Acciones rápidas
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QuickAction
            icon={<MapPin size={18} color="#5E6AD2" />}
            title="Ver mapa de gasolineras"
            desc={position ? 'Tu ubicación detectada ✓' : 'Buscar estaciones cercanas'}
            accentColor="rgba(94,106,210,0.1)"
            onClick={() => onTabChange('mapa')}
          />
          <QuickAction
            icon={<TrendingDown size={18} color="#22C55E" />}
            title="Comparar precios"
            desc="Ver ranking de precios más baratos"
            accentColor="rgba(34,197,94,0.1)"
            onClick={() => onTabChange('mapa')}
          />
          <QuickAction
            icon={<Clock size={18} color="#F59E0B" />}
            title="Historial de precios"
            desc="Próximamente disponible"
            accentColor="rgba(245,158,11,0.1)"
            onClick={() => onTabChange('historial')}
          />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, title, desc, accentColor, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: accentColor, border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={e => e.currentTarget.style.background = accentColor}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{desc}</div>
      </div>
      <ChevronRight size={16} color="var(--color-muted)" />
    </div>
  )
}

// ─── Map Tab ──────────────────────────────────────────────────────────────────
function MapTab({ position, combustible, setCombustible, estaciones, isLoading, refetch, minPrice, maxPrice, onNavigate, nextSync, isMobile }) {
  const [listOpen, setListOpen] = useState(true)
  const [selectedStation, setSelectedStation] = useState(null)

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Fuel selector overlay (mobile) */}
      {isMobile && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 500, display: 'flex', gap: 4,
          background: 'rgba(5,5,6,0.9)', borderRadius: 10, padding: 3,
          border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)',
        }}>
          {COMBUSTIBLES.map(c => (
            <button key={c.key} onClick={() => setCombustible(c.key)} style={{
              padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              background: combustible === c.key ? c.color : 'transparent',
              color: combustible === c.key ? 'white' : 'var(--color-muted)',
            }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      {position && (
        <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO" />
          <RecenterMap position={position} />
          <UserMarker position={position} />
          {estaciones.map((est, idx) => {
            const [lng, lat] = est.location.coordinates
            const priceClass = getPriceClass(est.precio_seleccionado, minPrice, maxPrice)
            const icon = createMarkerIcon(est.precio_seleccionado, priceClass)
            return (
              <Marker key={est._id} position={[lat, lng]} icon={icon}>
                <Popup>
                  <div style={{ background: '#0a0a0c', borderRadius: 10, padding: 14, minWidth: 200, color: '#EDEDEF', fontFamily: 'Manrope,sans-serif' }}>
                    {idx === 0 && <span style={{ background: 'rgba(34,197,94,0.2)', color: '#22C55E', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, display: 'inline-block', marginBottom: 6 }}>MÁS BARATA</span>}
                    <h4 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'white' }}>{est.nombre}</h4>
                    <p style={{ fontSize: 12, color: '#8A8F98', marginBottom: 10 }}>{est.calle || est.municipio}</p>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {est.precios.magna && <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>Mg ${est.precios.magna.toFixed(2)}</span>}
                      {est.precios.premium && <span style={{ fontSize: 13, fontWeight: 700, color: '#818CF8' }}>Pm ${est.precios.premium.toFixed(2)}</span>}
                      {est.precios.diesel && <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>Ds ${est.precios.diesel.toFixed(2)}</span>}
                    </div>
                    <button onClick={() => onNavigate({ ...est })}
                      style={{ width: '100%', background: '#5E6AD2', color: 'white', border: 'none', borderRadius: 7, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Manrope,sans-serif' }}>
                      <Navigation size={13} /> Navegar aquí
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      )}

      {/* Mobile bottom sheet — sits above bottom nav */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 1100,
          background: '#111114', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderTop: '2px solid rgba(94,106,210,0.4)', boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
          height: listOpen ? '42dvh' : 'auto', transition: 'height 0.3s var(--easing)',
          display: 'flex', flexDirection: 'column', borderRadius: '16px 16px 0 0',
        }}>
          <button onClick={() => setListOpen(v => !v)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px 10px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg)',
            width: '100%', borderBottom: listOpen ? '1px solid var(--color-border)' : 'none',
            fontFamily: 'var(--font-body)', flexShrink: 0,
          }}>
            <div style={{ width: 36, height: 4, background: 'var(--color-border-strong)', borderRadius: 2, marginBottom: 10 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingDown size={16} color="#22C55E" />
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>
                  {isLoading ? 'Buscando...' : `${estaciones.length} gasolineras cerca`}
                </span>
                {!isLoading && estaciones[0] && (
                  <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                    desde ${estaciones[0].precio_seleccionado?.toFixed(2)}
                  </span>
                )}
              </div>
              <ChevronDown size={18} color="var(--color-muted)" style={{ transform: listOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </button>
          {listOpen && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <StationList estaciones={estaciones} loading={isLoading} combustible={combustible} minPrice={minPrice} maxPrice={maxPrice} onNavigate={onNavigate} selected={selectedStation} onSelect={setSelectedStation} nextSync={nextSync} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Historial Tab ────────────────────────────────────────────────────────────
function HistorialTab() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', paddingBottom: 96 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Clock size={32} color="#F59E0B" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, marginBottom: 10, color: 'white' }}>
        Historial de precios
      </h3>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
        Muy pronto podrás ver el historial de precios de tu gasolinera favorita y alertas de precio.
      </p>
      <div style={{ marginTop: 24, padding: '8px 20px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>
        PRÓXIMAMENTE
      </div>
    </div>
  )
}

// ─── Perfil Tab ───────────────────────────────────────────────────────────────
function PerfilTab({ user, onLogout, nextSync }) {
  const nombre = user?.nombre || user?.email?.split('@')[0] || 'Usuario'
  const initial = nombre[0].toUpperCase()

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
      {/* Avatar + name */}
      <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, marginBottom: 16,
          background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, color: 'white',
          boxShadow: '0 8px 32px rgba(94,106,210,0.4)',
        }}>
          {initial}
        </div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 4 }}>
          {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>{user?.email}</p>
      </div>

      {/* Info cards */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Estado del servicio
        </div>

        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>Datos en tiempo real activos</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              {nextSync ? `Próxima actualización en ${nextSync}` : 'Sincronización diaria 18:30 MTY'}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Fuel size={16} color="#5E6AD2" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>1,200+ gasolineras en NL</div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>Fuente: CRE (Comisión Reguladora de Energía)</div>
          </div>
        </div>
      </div>

      {/* App info */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Acerca de GasMap
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: 'Versión', value: '1.0.0' },
            { label: 'Región', value: 'Nuevo León, México' },
            { label: 'Fuente de datos', value: 'CRE — datos.gob.mx' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{row.label}</span>
              <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '0 16px' }}>
        <button onClick={onLogout} style={{
          width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'var(--font-body)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ─── Station List ─────────────────────────────────────────────────────────────
function StationList({ estaciones, loading, combustible, minPrice, maxPrice, onNavigate, selected, onSelect, nextSync }) {
  if (loading) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, height: 88, animation: 'pulse-skeleton 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    )
  }
  if (!estaciones.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Fuel size={32} color="var(--color-muted)" style={{ marginBottom: 12 }} />
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>No se encontraron gasolineras en tu área</p>
      </div>
    )
  }
  return (
    <div style={{ padding: '8px 12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px 10px' }}>
        <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
          {estaciones.length} estaciones · por precio
        </span>
        {nextSync && (
          <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            act. en {nextSync}
          </span>
        )}
      </div>
      {estaciones.map((est, idx) => {
        const priceClass = getPriceClass(est.precio_seleccionado, minPrice, maxPrice)
        const badgeColors = {
          'marker-cheap': { bg: 'rgba(34,197,94,0.12)', text: '#22C55E' },
          'marker-mid': { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
          'marker-expensive': { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
        }
        const badge = badgeColors[priceClass]
        const direccion = [est.calle, est.colonia].filter(Boolean).join(', ')
        const isSelected = selected === est._id
        return (
          <div key={est._id} onClick={() => onSelect(est._id)} style={{
            background: isSelected ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isSelected ? 'rgba(94,106,210,0.35)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--color-muted)' }}>#{idx + 1}</span>
                  {idx === 0 && <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8, letterSpacing: 0.4 }}>MÁS BARATA</span>}
                </div>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, margin: '0 0 2px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{est.nombre}</p>
                {direccion && <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{direccion}</p>}
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>{est.municipio} · {est.distancia_km} km</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: badge.text }}>${est.precio_seleccionado?.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'capitalize' }}>{combustible}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {est.precios.magna && <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>Mg ${est.precios.magna.toFixed(2)}</span>}
                {est.precios.premium && <span style={{ background: 'rgba(94,106,210,0.1)', color: '#818CF8', fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>Pm ${est.precios.premium.toFixed(2)}</span>}
                {est.precios.diesel && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>Ds ${est.precios.diesel.toFixed(2)}</span>}
              </div>
              <button onClick={e => { e.stopPropagation(); onNavigate(est) }} style={{
                background: '#5E6AD2', color: 'white', border: 'none', borderRadius: 7,
                padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)',
              }}>
                <Navigation size={11} /> Ir
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main MapPage ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { position, loading: geoLoading } = useGeolocation()
  const nextSync = useNextSyncCountdown()
  const [combustible, setCombustible] = useState('magna')
  const [selectedStation, setSelectedStation] = useState(null)
  const [navigating, setNavigating] = useState(null)
  const [activeTab, setActiveTab] = useState('mapa')

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['estaciones', position?.lat, position?.lng, combustible],
    queryFn: async () => {
      if (!position) return { estaciones: [] }
      const { data } = await client.get('/estaciones/nearby', {
        params: { lat: position.lat, lng: position.lng, combustible, radio: 20 },
      })
      return data
    },
    enabled: !!position,
    staleTime: 5 * 60 * 1000,
  })

  const estaciones = data?.estaciones || []
  const precios = estaciones.map(e => e.precio_seleccionado).filter(Boolean)
  const minPrice = Math.min(...precios)
  const maxPrice = Math.max(...precios)

  const handleLogout = () => { logout(); navigate('/login') }
  const handleNavigate = (station) => setNavigating(station)

  if (geoLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--color-bg)' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(94,106,210,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={28} color="#5E6AD2" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>Obteniendo ubicación...</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, textAlign: 'center', maxWidth: 260, padding: '0 16px' }}>
          Permite el acceso a tu ubicación para ver las gasolineras más cercanas
        </p>
        <Loader2 size={24} color="#5E6AD2" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Navigation overlay */}
      {navigating && (
        <NavigationOverlay station={navigating} userPosition={position} onClose={() => setNavigating(null)} />
      )}

      {/* ── TOPBAR ─────────────────────────────────────────────────────── */}
      <header style={{
        padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(5,5,6,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)', zIndex: 100, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={16} color="white" />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18 }}>GasMap</span>
            {nextSync && (
              <div style={{ fontSize: 9, color: 'var(--color-muted)', lineHeight: 1, marginTop: 1 }}>act. en {nextSync}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Desktop: combustible selector */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 4, background: 'var(--color-primary)', borderRadius: 8, padding: 3 }}>
              {COMBUSTIBLES.map(c => (
                <button key={c.key} onClick={() => setCombustible(c.key)} style={{
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  background: combustible === c.key ? c.color : 'transparent',
                  color: combustible === c.key ? 'white' : 'var(--color-muted)',
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => refetch()} style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} />
          </button>
          {/* Desktop logout */}
          {!isMobile && (
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Desktop: left panel always visible */}
        {!isMobile && (
          <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg)', overflowY: 'auto' }}>
            <StationList
              estaciones={estaciones} loading={isLoading} combustible={combustible}
              minPrice={minPrice} maxPrice={maxPrice} onNavigate={handleNavigate}
              selected={selectedStation} onSelect={setSelectedStation} nextSync={nextSync}
            />
          </div>
        )}

        {/* Map always mounted (desktop full, mobile active when mapa tab) */}
        <div style={{
          flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
          // On mobile, hide/show based on tab but keep mounted for perf
          ...(isMobile && activeTab !== 'mapa' ? { display: 'none' } : {}),
        }}>
          <MapTab
            position={position} combustible={combustible} setCombustible={setCombustible}
            estaciones={estaciones} isLoading={isLoading} refetch={refetch}
            minPrice={minPrice} maxPrice={maxPrice} onNavigate={handleNavigate}
            nextSync={nextSync} isMobile={isMobile}
          />
        </div>

        {/* Mobile-only tab panels */}
        {isMobile && (
          <>
            {activeTab === 'home' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <HomeTab user={user} onTabChange={setActiveTab} position={position} nextSync={nextSync} />
              </div>
            )}
            {activeTab === 'historial' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <HistorialTab />
              </div>
            )}
            {activeTab === 'perfil' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <PerfilTab user={user} onLogout={handleLogout} nextSync={nextSync} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── BOTTOM NAV (mobile only) ───────────────────────────────────── */}
      {isMobile && <BottomNav active={activeTab} onChange={setActiveTab} />}

      <style>{`
        @keyframes pulse-skeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none !important; }
      `}</style>
    </div>
  )
}
