import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Loader2 } from 'lucide-react'
import StationSheet from './StationSheet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const COMBUSTIBLES = [
  { key: 'magna',   label: 'Magna',   color: '#22C55E' },
  { key: 'premium', label: 'Premium', color: '#5E6AD2' },
  { key: 'diesel',  label: 'Diésel',  color: '#F59E0B' },
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

function createMarkerIcon(precio, priceClass, isSelected = false) {
  const colors = { 'marker-cheap': '#22C55E', 'marker-mid': '#F59E0B', 'marker-expensive': '#EF4444' }
  const color = colors[priceClass] || '#F59E0B'
  const label = precio ? `$${precio.toFixed(0)}` : '?'
  const size = isSelected ? 48 : 40
  const border = isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.4)'
  const shadow = isSelected ? '0 4px 20px rgba(0,0,0,0.8), 0 0 0 4px rgba(255,255,255,0.15)' : '0 2px 8px rgba(0,0,0,0.5)'
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:${shadow};border:${border};transition:all 0.2s;">
      <span style="color:white;font-weight:700;font-size:${isSelected ? 11 : 10}px;font-family:'Manrope',sans-serif;">${label}</span>
    </div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2 + 4)],
  })
}

function UserMarker({ position }) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(94,106,210,0.25);animation:pulse-ring 1.8s ease-out infinite;"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:#5E6AD2;border:2px solid white;box-shadow:0 2px 8px rgba(94,106,210,0.6);"></div>
    </div>`,
    iconSize: [20, 20], iconAnchor: [10, 10],
  })
  return <Marker position={[position.lat, position.lng]} icon={icon} />
}

function MapFlyTo({ position }) {
  const map = useMap()
  const lastPos = useRef(null)
  useEffect(() => {
    if (!position) return
    const key = `${position.lat},${position.lng}`
    if (lastPos.current !== key) {
      lastPos.current = key
      map.flyTo([position.lat, position.lng], 14, { duration: 1.2 })
    }
  }, [position, map])
  return null
}

function MapCenterOnStation({ station, mapRef }) {
  const map = useMap()
  useEffect(() => {
    if (station?.lat && station?.lng) {
      map.flyTo([station.lat, station.lng], 15, { duration: 0.8 })
    }
  }, [station, map])
  return null
}

export default function MapTab({ estaciones, combustible, onCombustibleChange, userLocation, selectedStation, onSelectStation, isLoading }) {
  const mapRef = useRef(null)

  const prices = estaciones?.map(e => e.precios?.[combustible]).filter(Boolean) ?? []
  const minP = prices.length ? Math.min(...prices) : 0
  const maxP = prices.length ? Math.max(...prices) : 0

  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [25.6866, -100.3161]

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Fuel pill selector */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        zIndex: 900, display: 'flex',
        background: 'rgba(5,5,6,0.92)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 50, padding: '4px',
        gap: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        {COMBUSTIBLES.map(c => (
          <button
            key={c.key}
            onClick={() => onCombustibleChange(c.key)}
            className="pressable"
            style={{
              padding: '7px 16px',
              borderRadius: 50,
              border: 'none',
              background: combustible === c.key ? c.color : 'transparent',
              color: combustible === c.key ? 'white' : 'var(--color-muted)',
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'all 0.2s',
              boxShadow: combustible === c.key ? `0 2px 12px ${c.color}60` : 'none',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)',
          zIndex: 900,
          background: 'rgba(5,5,6,0.9)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <Loader2 size={13} color="#5E6AD2" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Cargando...</span>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          maxZoom={19}
        />

        {userLocation && <MapFlyTo position={userLocation} />}
        {selectedStation && <MapCenterOnStation station={selectedStation} />}
        {userLocation && <UserMarker position={userLocation} />}

        {estaciones?.map(station => {
          const precio = station.precios?.[combustible]
          const priceClass = getPriceClass(precio, minP, maxP)
          const isSelected = selectedStation?._id === station._id
          return (
            <Marker
              key={station._id}
              position={[station.lat, station.lng]}
              icon={createMarkerIcon(precio, priceClass, isSelected)}
              eventHandlers={{ click: () => onSelectStation(station) }}
            />
          )
        })}
      </MapContainer>

      {/* GPS re-center button */}
      {userLocation && (
        <button
          className="pressable"
          onClick={() => mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.8 })}
          style={{
            position: 'absolute', bottom: 84, right: 16, zIndex: 900,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(5,5,6,0.92)', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Navigation size={18} color="#5E6AD2" />
        </button>
      )}

      {/* Station Sheet */}
      {selectedStation && (
        <StationSheet
          station={selectedStation}
          combustible={combustible}
          userLocation={userLocation}
          onClose={() => onSelectStation(null)}
        />
      )}
    </div>
  )
}
