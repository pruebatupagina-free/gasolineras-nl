import { useState, useMemo, useEffect } from 'react'
import { Search, MapPin, Fuel, SlidersHorizontal, GitCompare, Plus, Check, Star, Heart } from 'lucide-react'
import ComparadorModal from './ComparadorModal'
import client from '../../api/client'
import { useFavoritos } from '../../hooks/useFavoritos'

function truncateName(name, max = 24) {
  if (!name || name.length <= max) return name
  const cut = name.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut) + '…'
}

const ESTADOS_LIST = [
  { value: '', label: 'Todo México' },
  { value: 'AGUASCALIENTES', label: 'Aguascalientes' },
  { value: 'BAJA CALIFORNIA', label: 'Baja California' },
  { value: 'BAJA CALIFORNIA SUR', label: 'Baja California Sur' },
  { value: 'CAMPECHE', label: 'Campeche' },
  { value: 'CHIAPAS', label: 'Chiapas' },
  { value: 'CHIHUAHUA', label: 'Chihuahua' },
  { value: 'CIUDAD DE MEXICO', label: 'Ciudad de México' },
  { value: 'COAHUILA', label: 'Coahuila' },
  { value: 'COLIMA', label: 'Colima' },
  { value: 'DURANGO', label: 'Durango' },
  { value: 'ESTADO DE MEXICO', label: 'Estado de México' },
  { value: 'GUANAJUATO', label: 'Guanajuato' },
  { value: 'GUERRERO', label: 'Guerrero' },
  { value: 'HIDALGO', label: 'Hidalgo' },
  { value: 'JALISCO', label: 'Jalisco' },
  { value: 'MICHOACAN', label: 'Michoacán' },
  { value: 'MORELOS', label: 'Morelos' },
  { value: 'NAYARIT', label: 'Nayarit' },
  { value: 'NUEVO LEON', label: 'Nuevo León' },
  { value: 'OAXACA', label: 'Oaxaca' },
  { value: 'PUEBLA', label: 'Puebla' },
  { value: 'QUERETARO', label: 'Querétaro' },
  { value: 'QUINTANA ROO', label: 'Quintana Roo' },
  { value: 'SAN LUIS POTOSI', label: 'San Luis Potosí' },
  { value: 'SINALOA', label: 'Sinaloa' },
  { value: 'SONORA', label: 'Sonora' },
  { value: 'TABASCO', label: 'Tabasco' },
  { value: 'TAMAULIPAS', label: 'Tamaulipas' },
  { value: 'TLAXCALA', label: 'Tlaxcala' },
  { value: 'VERACRUZ', label: 'Veracruz' },
  { value: 'YUCATAN', label: 'Yucatán' },
  { value: 'ZACATECAS', label: 'Zacatecas' },
]

const COMBUST_COLORS = {
  magna:   { color: '#22C55E', label: 'Magna' },
  premium: { color: '#5E6AD2', label: 'Premium' },
  diesel:  { color: '#F59E0B', label: 'Diésel' },
}

const BRANDS = [
  { test: t => t.includes('OXXO'),                               label: 'OXXO Gas',   color: '#DC2626' },
  { test: t => t.includes('HIDROSINA'),                          label: 'Hidrosina',  color: '#1D4ED8' },
  { test: t => t.includes('G500'),                               label: 'G500',       color: '#EA580C' },
  { test: t => t.includes('ORSAN'),                              label: 'Orsan',      color: '#16A34A' },
  { test: t => t.includes('SHELL'),                              label: 'Shell',      color: '#CA8A04' },
  { test: t => /\bBP\b/.test(t),                                 label: 'BP',         color: '#15803D' },
  { test: t => t.includes('MOBIL'),                              label: 'Mobil',      color: '#B91C1C' },
  { test: t => t.includes('BUEN PRECIO'),                        label: 'Buen Precio',color: '#C2410C' },
  { test: t => t.includes('TOTALENERGIES')||t.includes('TOTAL ENERGIES'), label: 'Total', color: '#CC0000' },
  { test: t => t.includes('PEMEX') || t.includes('ESTACION DE SERVICIO') || t.includes('ES DE') || t.includes('SERVICIO'), label: 'PEMEX', color: '#22C55E' },
]

function detectMarca(s) {
  const text = `${s.razon_social || ''} ${s.nombre || ''}`.toUpperCase()
  for (const b of BRANDS) {
    if (b.test(text)) return b.label
  }
  return 'Otros'
}

function brandColor(label) {
  return BRANDS.find(b => b.label === label)?.color ?? '#8A8F98'
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function EstacionesTab({ estaciones = [], combustible, onCombustibleChange, userLocation, onSelectStation, estadoFilter = '', onEstadoChange = () => {} }) {
  const [query, setQuery] = useState('')
  const [municipio, setMunicipio] = useState('Todos')
  const [showMunicipios, setShowMunicipios] = useState(false)
  const [showEstados, setShowEstados] = useState(false)
  const [compareIds, setCompareIds] = useState([])
  const [showComparador, setShowComparador] = useState(false)
  const [sortBy, setSortBy] = useState('precio')
  const [marcaFilter, setMarcaFilter] = useState('Todas')
  const [showFavs, setShowFavs] = useState(false)
  const [ratingsStats, setRatingsStats] = useState({})
  const { ids: favIds, isFav } = useFavoritos()
  const c = COMBUST_COLORS[combustible] || COMBUST_COLORS.magna

  useEffect(() => {
    client.get('/estaciones/ratings-stats').then(res => setRatingsStats(res.data)).catch(() => {})
  }, [])

  // Reset municipio when estado changes
  useEffect(() => { setMunicipio('Todos') }, [estadoFilter])

  // Dynamic municipio list from loaded estaciones
  const municipiosDisponibles = useMemo(() => {
    const set = new Set(estaciones.filter(s => s.municipio).map(s => s.municipio))
    return ['Todos', ...[...set].sort()]
  }, [estaciones])

  const estadoLabel = ESTADOS_LIST.find(e => e.value === estadoFilter)?.label || 'Todo México'

  function toggleCompare(e, station) {
    e.stopPropagation()
    setCompareIds(prev => {
      if (prev.includes(station._id)) return prev.filter(id => id !== station._id)
      if (prev.length >= 3) return prev
      return [...prev, station._id]
    })
  }

  const compareStations = estaciones.filter(s => compareIds.includes(s._id))

  // Pre-filter: combustible + search + municipio (before brand filter)
  const preFiltered = useMemo(() => {
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
    return list
  }, [estaciones, query, municipio, combustible])

  // Unique brands available in current pre-filtered list
  const availableBrands = useMemo(() => {
    const set = new Set(preFiltered.map(detectMarca))
    return [...set].sort()
  }, [preFiltered])

  // Reset brand filter if it disappears from available brands
  useEffect(() => {
    if (marcaFilter !== 'Todas' && !availableBrands.includes(marcaFilter)) {
      setMarcaFilter('Todas')
    }
  }, [availableBrands, marcaFilter])

  const filtered = useMemo(() => {
    // Favoritas mode bypasses all other filters
    let list = showFavs
      ? estaciones.filter(s => favIds.includes(s._id))
      : (marcaFilter === 'Todas' ? preFiltered : preFiltered.filter(s => detectMarca(s) === marcaFilter))

    if (sortBy === 'rating') {
      return list.sort((a, b) => {
        const ra = ratingsStats[a._id]?.avg || 0
        const rb = ratingsStats[b._id]?.avg || 0
        return rb - ra
      })
    }
    return list.sort((a, b) => (a.precios[combustible] || 99) - (b.precios[combustible] || 99))
  }, [preFiltered, marcaFilter, combustible, sortBy, ratingsStats, showFavs, favIds, estaciones])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', paddingBottom: 64, position: 'relative' }}>

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

        {/* Filters row — Estado + Municipio */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {/* Estado filter */}
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => { setShowEstados(!showEstados); setShowMunicipios(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                background: estadoFilter ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.05)',
                border: estadoFilter ? '1px solid rgba(94,106,210,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                color: estadoFilter ? '#A5B4FC' : '#8A8F98',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
              }}
            >
              <MapPin size={13} />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {estadoLabel}
              </span>
              <span style={{ fontSize: 10 }}>{showEstados ? '▲' : '▼'}</span>
            </button>

            {showEstados && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 101,
                background: '#141416', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, overflow: 'auto', maxHeight: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {ESTADOS_LIST.map(e => (
                  <button key={e.value} onClick={() => { onEstadoChange(e.value); setShowEstados(false) }} style={{
                    width: '100%', padding: '11px 14px',
                    background: estadoFilter === e.value ? 'rgba(94,106,210,0.12)' : 'transparent',
                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: estadoFilter === e.value ? '#A5B4FC' : '#EDEDEF',
                    textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13,
                    fontWeight: estadoFilter === e.value ? 700 : 400,
                  }}>{e.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Municipio filter */}
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => { setShowMunicipios(!showMunicipios); setShowEstados(false) }}
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
                borderRadius: 12, overflow: 'auto', maxHeight: 240, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {municipiosDisponibles.map(m => (
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

        {/* Brand filter pills — only when 2+ distinct brands exist */}
        {availableBrands.length >= 2 && (
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', marginTop: 10,
            paddingBottom: 2,
            scrollbarWidth: 'none',
          }}>
            {['Todas', ...availableBrands].map(brand => {
              const active = marcaFilter === brand
              const color = brand === 'Todas' ? '#8A8F98' : brandColor(brand)
              return (
                <button
                  key={brand}
                  onClick={() => setMarcaFilter(brand)}
                  style={{
                    flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: active
                      ? (brand === 'Todas' ? 'rgba(255,255,255,0.12)' : `${color}22`)
                      : 'rgba(255,255,255,0.05)',
                    color: active ? (brand === 'Todas' ? 'white' : color) : '#8A8F98',
                    outline: active && brand !== 'Todas' ? `1px solid ${color}44` : 'none',
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {brand !== 'Todas' && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: active ? color : '#8A8F98',
                      flexShrink: 0, transition: 'background 0.15s',
                    }} />
                  )}
                  {brand}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Sort toggle + count + favoritas */}
      <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#8A8F98', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {showFavs ? `${filtered.length} favoritas` : `${filtered.length} estaciones${estadoFilter ? ` · ${estadoLabel}` : ''}${municipio !== 'Todos' ? ` · ${municipio}` : ''}${marcaFilter !== 'Todas' ? ` · ${marcaFilter}` : ''}${query ? ` · "${query}"` : ''}`}
        </span>
        {favIds.length > 0 && (
          <button onClick={() => setShowFavs(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: showFavs ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
            color: showFavs ? '#EF4444' : '#8A8F98',
            outline: showFavs ? '1px solid rgba(239,68,68,0.35)' : 'none',
            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
            transition: 'all 0.15s', flexShrink: 0,
          }}>
            <Heart size={11} fill={showFavs ? '#EF4444' : 'none'} color={showFavs ? '#EF4444' : '#8A8F98'} />
            {favIds.length}
          </button>
        )}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2, gap: 2, flexShrink: 0 }}>
          {[{ key: 'precio', label: 'Precio' }, { key: 'rating', label: '⭐' }].map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key)} style={{
              padding: '4px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: sortBy === s.key ? 'rgba(94,106,210,0.25)' : 'transparent',
              color: sortBy === s.key ? '#A5B4FC' : '#8A8F98',
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ color: '#8A8F98', fontSize: 14 }}>No se encontraron estaciones</div>
            <button onClick={() => { setQuery(''); setMunicipio('Todos'); setMarcaFilter('Todas'); setShowFavs(false); onEstadoChange('') }} style={{
              marginTop: 12, background: 'none', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 16px', color: '#8A8F98', cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-body)',
            }}>Limpiar filtros</button>
          </div>
        ) : filtered.map((s, i) => {
          const precio = s.precios[combustible]
          const isCheapest = i === 0
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
                position: 'relative',
              }}>
                {isCheapest ? '🏆' : `#${i + 1}`}
                {isFav(s._id) && (
                  <div style={{ position: 'absolute', top: -6, right: -4 }}>
                    <Heart size={8} fill="#EF4444" color="#EF4444" />
                  </div>
                )}
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
                  {truncateName(s.nombre)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, overflow: 'hidden' }}>
                  {/* Brand badge */}
                  {(() => {
                    const marca = detectMarca(s)
                    const bc = brandColor(marca)
                    return (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: 0.3,
                        color: bc,
                        background: `${bc}15`,
                        border: `1px solid ${bc}30`,
                        borderRadius: 4, padding: '1px 5px', flexShrink: 0,
                      }}>
                        {marca}
                      </span>
                    )
                  })()}
                  {s.municipio && (
                    <span style={{ fontSize: 11, color: '#8A8F98', display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, overflow: 'hidden' }}>
                      <MapPin size={9} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.municipio}</span>
                    </span>
                  )}
                  {dist !== null && (
                    <span style={{ fontSize: 11, color: '#8A8F98', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      · {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                    </span>
                  )}
                </div>
                {ratingsStats[s._id] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <Star size={10} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700 }}>{ratingsStats[s._id].avg}</span>
                    <span style={{ fontSize: 10, color: '#8A8F98' }}>({ratingsStats[s._id].count})</span>
                  </div>
                )}
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

              {/* Compare toggle button */}
              {(() => {
                const isSelected = compareIds.includes(s._id)
                const isFull = compareIds.length >= 3 && !isSelected
                return (
                  <button
                    onClick={e => toggleCompare(e, s)}
                    disabled={isFull}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                      background: isSelected ? '#5E6AD2' : 'transparent',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: isFull ? 0.3 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected
                      ? <Check size={14} color="white" />
                      : <Plus size={14} color="rgba(255,255,255,0.5)" />
                    }
                  </button>
                )
              })()}
            </div>
          )
        })}
      </div>

      {/* Floating compare bar */}
      {compareIds.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 72, left: 16, right: 16,
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid rgba(94,106,210,0.4)',
          borderRadius: 16, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(94,106,210,0.2)',
          zIndex: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
              {compareIds.length === 1 ? '1 seleccionada' : `${compareIds.length} seleccionadas`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {compareIds.length < 2 ? 'Selecciona al menos 2 para comparar' : `Máx. 3 estaciones`}
            </div>
          </div>
          <button
            onClick={() => setCompareIds([])}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 12, fontFamily: 'var(--font-body)', padding: '4px 8px' }}
          >
            Limpiar
          </button>
          <button
            onClick={() => setShowComparador(true)}
            disabled={compareIds.length < 2}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: compareIds.length >= 2 ? 'linear-gradient(135deg, #5E6AD2, #4F5BC0)' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 12, padding: '10px 16px',
              color: compareIds.length >= 2 ? 'white' : 'rgba(255,255,255,0.3)',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-body)',
              cursor: compareIds.length >= 2 ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            <GitCompare size={14} />
            Comparar
          </button>
        </div>
      )}

      {/* Comparador modal */}
      {showComparador && compareStations.length >= 2 && (
        <ComparadorModal
          stations={compareStations}
          userLocation={userLocation}
          onClose={() => setShowComparador(false)}
          onRemove={id => {
            setCompareIds(prev => {
              const next = prev.filter(i => i !== id)
              if (next.length < 2) setShowComparador(false)
              return next
            })
          }}
        />
      )}
    </div>
  )
}
