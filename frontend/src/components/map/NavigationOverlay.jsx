import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { X, Navigation, ExternalLink, Loader2, Fuel, MapPin } from 'lucide-react'

function userIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 0 12px rgba(59,130,246,0.5);"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  })
}

function stationIcon(nombre) {
  return L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#22C55E,#16a34a);border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h12M4 9V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M15 9l3-3 3 3v10a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-1"/><line x1="7" y1="22" x2="7" y2="9"/><line x1="11" y1="22" x2="11" y2="9"/><line x1="7" y1="13" x2="11" y2="13"/></svg>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  })
}

function AnimatedCar({ route, onDone }) {
  const map = useMap()
  const markerRef = useRef(null)
  const frameRef = useRef(null)
  const [carIcon] = useState(() => L.divIcon({
    className: '',
    html: `<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🚗</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  }))

  useEffect(() => {
    if (!route.length || !map) return
    const marker = L.marker(route[0], { icon: carIcon }).addTo(map)
    markerRef.current = marker

    let idx = 0
    const totalSteps = route.length
    const duration = 3000
    const stepDuration = duration / totalSteps

    const move = () => {
      if (idx >= totalSteps - 1) {
        onDone()
        return
      }
      idx++
      marker.setLatLng(route[idx])
      frameRef.current = setTimeout(move, stepDuration)
    }
    frameRef.current = setTimeout(move, stepDuration)

    return () => {
      clearTimeout(frameRef.current)
      marker.remove()
    }
  }, [route, map])

  return null
}

function FitBounds({ userPos, stationPos }) {
  const map = useMap()
  useEffect(() => {
    if (userPos && stationPos) {
      map.fitBounds([[userPos.lat, userPos.lng], [stationPos.lat, stationPos.lng]], { padding: [60, 60], animate: true, duration: 1.2 })
    }
  }, [map, userPos, stationPos])
  return null
}

export default function NavigationOverlay({ station, userPosition, onClose }) {
  const [route, setRoute] = useState([])
  const [loading, setLoading] = useState(true)
  const [animDone, setAnimDone] = useState(false)
  const [phase, setPhase] = useState('loading') // loading | animating | ready

  const [stationLng, stationLat] = station.location.coordinates

  useEffect(() => {
    async function fetchRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPosition.lng},${userPosition.lat};${stationLng},${stationLat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()
        const coords = data.routes[0].geometry.coordinates
        // OSRM devuelve [lng, lat], Leaflet necesita [lat, lng]
        const latLngs = coords.map(([lng, lat]) => [lat, lng])
        // Reducir puntos para animación fluida
        const step = Math.max(1, Math.floor(latLngs.length / 60))
        const reduced = latLngs.filter((_, i) => i % step === 0)
        setRoute(reduced)
        setPhase('animating')
      } catch {
        // Si OSRM falla, línea recta
        setRoute([[userPosition.lat, userPosition.lng], [stationLat, stationLng]])
        setPhase('animating')
      } finally {
        setLoading(false)
      }
    }
    fetchRoute()
  }, [])

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${stationLat},${stationLng}&travelmode=driving`
    window.open(url, '_blank')
  }

  const precioBadge = station.precios?.magna
    ? `$${station.precios.magna.toFixed(2)} Magna`
    : 'Sin precio'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--color-border)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(34,197,94,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Navigation size={20} color="#22C55E" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, margin: 0 }}>{station.nombre}</h3>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{station.municipio}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
          <X size={18} />
        </button>
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[userPosition.lat, userPosition.lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO" />
          <FitBounds userPos={userPosition} stationPos={{ lat: stationLat, lng: stationLng }} />
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon()} />
          <Marker position={[stationLat, stationLng]} icon={stationIcon(station.nombre)} />
          {route.length > 0 && (
            <Polyline positions={route} pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.8, dashArray: '10 8' }} />
          )}
          {phase === 'animating' && route.length > 0 && (
            <AnimatedCar route={route} onDone={() => { setAnimDone(true); setPhase('ready') }} />
          )}
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 5 }}>
            <Loader2 size={32} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Calculando ruta...</p>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--color-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Fuel size={14} color="#22C55E" />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>{precioBadge}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-muted)', fontSize: 13 }}>
              <MapPin size={12} />
              <span>{station.calle || 'Ver en mapa'}{station.colonia ? `, ${station.colonia}` : ''}</span>
            </div>
          </div>
          {station.distancia_km && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--color-accent)' }}>{station.distancia_km} km</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>de distancia</div>
            </div>
          )}
        </div>

        {phase === 'loading' && (
          <div style={{ background: 'var(--color-primary)', borderRadius: 10, padding: '13px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Trazando ruta...
          </div>
        )}
        {phase === 'animating' && (
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '13px', textAlign: 'center', color: '#93C5FD', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🚗 Navegando hacia la gasolinera...
          </div>
        )}
        {phase === 'ready' && (
          <button onClick={openGoogleMaps} style={{ width: '100%', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2563EB'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}>
            <ExternalLink size={18} /> Abrir en Google Maps
          </button>
        )}
      </div>
    </div>
  )
}
