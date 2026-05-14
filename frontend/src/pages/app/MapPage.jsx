import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useQuery } from '@tanstack/react-query'
import { Fuel, MapPin, Navigation, TrendingDown, LogOut, Loader2, RefreshCw, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import NavigationOverlay from '../../components/map/NavigationOverlay'
import { useNavigate } from 'react-router-dom'

// Fix Leaflet icons en Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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
    html: `<div class="gas-marker-icon ${priceClass}" style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.4);">
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

const COMBUSTIBLES = [
  { key: 'magna', label: 'Magna', color: '#22C55E' },
  { key: 'premium', label: 'Premium', color: '#5E6AD2' },
  { key: 'diesel', label: 'Diésel', color: '#F59E0B' },
]

export default function MapPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { position, loading: geoLoading } = useGeolocation()
  const [combustible, setCombustible] = useState('magna')
  const [selectedStation, setSelectedStation] = useState(null)
  const [navigating, setNavigating] = useState(null)
  const [listOpen, setListOpen] = useState(false)

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
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700 }}>Obteniendo ubicación...</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Permite el acceso a tu ubicación para ver las gasolineras más cercanas</p>
        <Loader2 size={24} color="#5E6AD2" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Navegación overlay */}
      {navigating && (
        <NavigationOverlay station={navigating} userPosition={position} onClose={() => setNavigating(null)} />
      )}

      {/* Topbar */}
      <div style={{ padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,5,6,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)', zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={15} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17 }}>GasMap</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Selector de combustible */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--color-primary)', borderRadius: 8, padding: 3 }}>
            {COMBUSTIBLES.map(c => (
              <button key={c.key} onClick={() => setCombustible(c.key)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', transition: 'all 0.15s', background: combustible === c.key ? c.color : 'transparent', color: combustible === c.key ? 'white' : 'var(--color-muted)' }}>
                {c.label}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()} style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Contenido principal — desktop: split, mobile: mapa + bottom sheet */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Panel lateral izquierdo — desktop */}
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg)', overflowY: 'auto', '@media (max-width: 768px)': { display: 'none' } }}
          className="desktop-panel">
          <StationList estaciones={estaciones} loading={isLoading} combustible={combustible} minPrice={minPrice} maxPrice={maxPrice} onNavigate={handleNavigate} selected={selectedStation} onSelect={setSelectedStation} />
        </div>

        {/* Mapa */}
        <div style={{ flex: 1, position: 'relative' }}>
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
                      <div style={{ background: 'var(--color-primary)', borderRadius: 10, padding: 14, minWidth: 200, color: 'var(--color-fg)', fontFamily: 'var(--font-body)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          {idx === 0 && <span style={{ background: 'rgba(34,197,94,0.2)', color: '#22C55E', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>MÁS BARATA</span>}
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'white' }}>{est.nombre}</h4>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>{est.calle || est.municipio}</p>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                          {est.precios.magna && <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>Mg ${est.precios.magna.toFixed(2)}</span>}
                          {est.precios.premium && <span style={{ fontSize: 13, fontWeight: 700, color: '#818CF8' }}>Pm ${est.precios.premium.toFixed(2)}</span>}
                          {est.precios.diesel && <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>Ds ${est.precios.diesel.toFixed(2)}</span>}
                        </div>
                        <button onClick={() => handleNavigate({ ...est, distancia_km: est.distancia_km })}
                          style={{ width: '100%', background: '#5E6AD2', color: 'white', border: 'none', borderRadius: 7, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)' }}>
                          <Navigation size={13} /> Navegar aquí
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Bottom sheet mobile — Lista de estaciones */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'rgba(5,5,6,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--color-border)', maxHeight: listOpen ? '70dvh' : 'auto', transition: 'max-height 0.3s ease', display: 'flex', flexDirection: 'column' }}
        className="mobile-sheet">
        <button onClick={() => setListOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fg)', width: '100%', borderBottom: listOpen ? '1px solid var(--color-border)' : 'none', fontFamily: 'var(--font-body)' }}>
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
        </button>
        {listOpen && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <StationList estaciones={estaciones} loading={isLoading} combustible={combustible} minPrice={minPrice} maxPrice={maxPrice} onNavigate={handleNavigate} selected={selectedStation} onSelect={setSelectedStation} />
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-sheet { display: none !important; }
          .desktop-panel { display: flex !important; }
        }
        @media (max-width: 767px) {
          .desktop-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function StationList({ estaciones, loading, combustible, minPrice, maxPrice, onNavigate, selected, onSelect }) {
  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'var(--color-primary)', borderRadius: 12, padding: 16, animation: 'pulse 1.5s ease-in-out infinite', height: 80 }} />
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
    <div style={{ padding: '12px 12px 80px' }}>
      {estaciones.map((est, idx) => {
        const priceClass = getPriceClass(est.precio_seleccionado, minPrice, maxPrice)
        const badgeColors = { 'marker-cheap': { bg: 'rgba(34,197,94,0.12)', text: '#22C55E' }, 'marker-mid': { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' }, 'marker-expensive': { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' } }
        const badge = badgeColors[priceClass]
        return (
          <div key={est._id} onClick={() => onSelect(est._id)} style={{ background: selected === est._id ? 'rgba(94,106,210,0.08)' : 'var(--color-primary)', border: `1px solid ${selected === est._id ? 'rgba(94,106,210,0.3)' : 'var(--color-border)'}`, borderRadius: 12, padding: 14, marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (selected !== est._id) e.currentTarget.style.background = 'rgba(30,41,59,0.8)' }}
            onMouseLeave={e => { if (selected !== est._id) e.currentTarget.style.background = 'var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'white' }}>#{idx + 1}</span>
                  {idx === 0 && <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>MÁS BARATA</span>}
                </div>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13, margin: '0 0 4px', color: 'var(--color-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{est.nombre}</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }}>{est.municipio} · {est.distancia_km} km</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: badge.text }}>${est.precio_seleccionado?.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: 'var(--color-muted)', textTransform: 'capitalize' }}>{combustible}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {est.precios.magna && <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>Mg ${est.precios.magna.toFixed(2)}</span>}
                {est.precios.premium && <span style={{ background: 'rgba(94,106,210,0.1)', color: '#818CF8', fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>Pm ${est.precios.premium.toFixed(2)}</span>}
                {est.precios.diesel && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 11, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>Ds ${est.precios.diesel.toFixed(2)}</span>}
              </div>
              <button onClick={e => { e.stopPropagation(); onNavigate(est) }}
                style={{ background: '#5E6AD2', color: 'white', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4F5BC0'}
                onMouseLeave={e => e.currentTarget.style.background = '#5E6AD2'}>
                <Navigation size={11} /> Ir
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
