import { X, Navigation, MapPin } from 'lucide-react'

const FUELS = [
  { key: 'magna',   label: 'Magna',   color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)' },
  { key: 'premium', label: 'Premium', color: '#5E6AD2', bg: 'rgba(94,106,210,0.1)', border: 'rgba(94,106,210,0.2)' },
  { key: 'diesel',  label: 'Diésel',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
]

function truncateName(name, max = 18) {
  if (!name || name.length <= max) return name
  const cut = name.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut) + '…'
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function ComparadorModal({ stations, userLocation, onClose, onRemove }) {
  const n = stations.length

  // For each fuel, find the cheapest price among selected stations
  const cheapest = {}
  FUELS.forEach(f => {
    const prices = stations.map(s => s.precios?.[f.key]).filter(p => p != null && p >= 15)
    cheapest[f.key] = prices.length ? Math.min(...prices) : null
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="animate-sheet-up"
        style={{
          position: 'relative', width: '100%', zIndex: 1,
          background: 'linear-gradient(180deg, #13131a 0%, #0d0d13 100%)',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
          maxHeight: '88vh', overflowY: 'auto',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'white' }}>
              Comparador
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              {n} estaciones seleccionadas
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Station header cards */}
        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 }}>
          {stations.map(s => {
            const dist = userLocation ? distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng) : null
            return (
              <div key={s._id} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '12px 10px', position: 'relative',
              }}>
                <button
                  onClick={() => onRemove(s._id)}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)', border: 'none',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, lineHeight: 1,
                  }}
                >✕</button>

                <div style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 4, paddingRight: 18 }}>
                  {truncateName(s.nombre)}
                </div>
                {s.municipio && (
                  <div style={{ fontSize: 10, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: dist ? 2 : 0 }}>
                    <MapPin size={9} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.municipio.replace('San Pedro Garza García', 'San Pedro').replace('San Nicolás de los Garza', 'San Nicolás')}
                    </span>
                  </div>
                )}
                {dist !== null && (
                  <div style={{ fontSize: 10, color: '#5E6AD2' }}>
                    {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Price comparison table */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Precios por litro
          </div>

          {FUELS.map(fuel => {
            const prices = stations.map(s => s.precios?.[fuel.key])
            const min = cheapest[fuel.key]

            return (
              <div key={fuel.key} style={{
                background: fuel.bg, border: `1px solid ${fuel.border}`,
                borderRadius: 14, padding: '12px 14px', marginBottom: 8,
              }}>
                {/* Fuel label */}
                <div style={{ fontSize: 11, fontWeight: 700, color: fuel.color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  {fuel.label}
                </div>

                {/* Price columns */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 6 }}>
                  {prices.map((precio, i) => {
                    const isBest = precio != null && precio === min
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        {precio != null && precio >= 15 ? (
                          <>
                            <div style={{
                              fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-heading)',
                              color: isBest ? fuel.color : 'rgba(255,255,255,0.5)',
                              lineHeight: 1,
                            }}>
                              ${precio.toFixed(2)}
                            </div>
                            {isBest && min !== null && prices.filter(p => p != null && p >= 15).length > 1 && (
                              <div style={{ fontSize: 9, color: fuel.color, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Más barato
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>—</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Savings row — only show if there's a difference */}
                {(() => {
                  const validPrices = prices.filter(p => p != null && p >= 15)
                  if (validPrices.length < 2) return null
                  const maxP = Math.max(...validPrices)
                  const diff = maxP - min
                  if (diff < 0.01) return null
                  return (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${fuel.border}`, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: fuel.color, fontWeight: 600 }}>
                        Diferencia: ${diff.toFixed(2)}/L
                      </span>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Navigate buttons */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 }}>
          {stations.map(s => (
            <a
              key={s._id}
              href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
              target="_blank" rel="noreferrer"
              className="pressable"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)',
                color: 'white', borderRadius: 12, padding: '11px 8px',
                fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body)',
                textDecoration: 'none',
              }}
            >
              <Navigation size={13} />
              Ir
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
