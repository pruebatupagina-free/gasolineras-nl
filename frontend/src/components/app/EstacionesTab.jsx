import { useState, useMemo } from 'react'
import { Search, MapPin, ChevronRight, Fuel, SlidersHorizontal } from 'lucide-react'

const MUNICIPIOS = [
  'Todos',
  'Monterrey', 'San Pedro Garza García', 'Guadalupe', 'Apodaca',
  'Escobedo', 'Santa Catarina', 'Juárez', 'García', 'San Nicolás de los Garza',
]

const COMBUST_COLORS = {
  magna:   { color: '#22C55E', label: 'Magna' },
  premium: { color: '#5E6AD2', label: 'Premium' },
  diesel:  { color: '#F59E0B', label: 'Diésel' },
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function EstacionesTab({ estaciones = [], combustible, onCombustibleChange, userLocation, onSelectStation }) {
  const [query, setQuery] = useState('')
  const [municipio, setMunicipio] = useState('Todos')
  const [showMunicipios, setShowMunicipios] = useState(false)
  const c = COMBUST_COLORS[combustible] || COMBUST_COLORS.magna

  const filtered = useMemo(() => {
    let list = estaciones.filter(s => s.precios?.[combustible])

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(s =>
        s.nombre?.toLowerCase().includes(q) ||
        s.calle?.toLowerCase().includes(q) ||
        s.municipio?.toLowerCase().includes(q)
      )
    }

    if (municipio !== 'Todos') {
      list = list.filter(s => s.municipio?.toLowerCase().includes(municipio.toLowerCase()))
    }

    return list.sort((a, b) => (a.precios[combustible] || 99) - (b.precios[combustible] || 99))
  }, [estaciones, query, municipio, combustible])

  const cheapestPrice = filtered[0]?.precios?.[combustible]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)', marginBottom: 12 }}>
          Estaciones
        </div>

        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 10,
        }}>
          <Search size={16} color="#8A8F98" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre o calle..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'white', fontSize: 14, fontFamily: 'var(--font-body)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8F98', fontSize: 16, padding: 0 }}>✕</button>
          )}
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Municipio filter */}
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowMunicipios(!showMunicipios)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                background: municipio !== 'Todos' ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.05)',
                border: municipio !== 'Todos' ? '1px solid rgba(94,106,210,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                color: municipio !== 'Todos' ? '#A5B4FC' : '#8A8F98',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              }}
            >
              <SlidersHorizontal size={13} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {municipio === 'Todos' ? 'Municipio' : municipio}
              </span>
              <span style={{ fontSize: 10 }}>{showMunicipios ? '▲' : '▼'}</span>
            </button>

            {showMunicipios && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 100,
                background: '#141416', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {MUNICIPIOS.map(m => (
                  <button key={m} onClick={() => { setMunicipio(m); setShowMunicipios(false) }} style={{
                    width: '100%', padding: '11px 14px', background: municipio === m ? 'rgba(94,106,210,0.12)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: municipio === m ? '#A5B4FC' : '#EDEDEF',
                    textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13,
                    fontWeight: municipio === m ? 700 : 400,
                  }}>{m}</button>
                ))}
              </div>
            )}
          </div>

          {/* Combustible pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['magna', 'premium', 'diesel'].map(fuel => {
              const fc = COMBUST_COLORS[fuel]
              const active = combustible === fuel
              return (
                <button key={fuel} onClick={() => onCombustibleChange(fuel)} style={{
                  padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
                  background: active ? `${fc.color}20` : 'rgba(255,255,255,0.05)',
                  color: active ? fc.color : '#8A8F98',
                  transition: 'all 0.15s',
                }}>
                  {fuel === 'magna' ? 'Mag' : fuel === 'premium' ? 'Pre' : 'Die'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Count */}
      <div style={{ padding: '8px 20px', fontSize: 11, color: '#8A8F98', fontWeight: 600, flexShrink: 0 }}>
        {filtered.length} estaciones {municipio !== 'Todos' ? `en ${municipio}` : 'en NL'}
        {query && ` · "${query}"`}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ color: '#8A8F98', fontSize: 14 }}>No se encontraron estaciones</div>
            <button onClick={() => { setQuery(''); setMunicipio('Todos') }} style={{
              marginTop: 12, background: 'none', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 16px', color: '#8A8F98', cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-body)',
            }}>Limpiar filtros</button>
          </div>
        ) : filtered.map((s, i) => {
          const precio = s.precios[combustible]
          const isCheapest = precio === cheapestPrice
          const dist = userLocation ? distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng) : null
          return (
            <div
              key={s._id}
              onClick={() => onSelectStation(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                background: isCheapest ? 'rgba(34,197,94,0.04)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Rank */}
              <div style={{
                width: 28, flexShrink: 0, textAlign: 'center',
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? '#22C55E' : '#8A8F98',
                fontFamily: 'var(--font-heading)',
              }}>
                {isCheapest ? '🏆' : `#${i + 1}`}
              </div>

              {/* Icon */}
              <div style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                background: `${c.color}15`, border: `1px solid ${c.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Fuel size={18} color={c.color} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.nombre}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {s.municipio && (
                    <span style={{ fontSize: 11, color: '#8A8F98', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <MapPin size={9} />{s.municipio}
                    </span>
                  )}
                  {dist !== null && (
                    <span style={{ fontSize: 11, color: '#8A8F98' }}>
                      · {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: c.color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                  ${precio.toFixed(2)}
                </div>
                {isCheapest && (
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                    Más barata
                  </div>
                )}
              </div>

              <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
