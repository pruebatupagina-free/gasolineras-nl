import { useRef, useEffect, useState } from 'react'
import { X, Navigation, Flag, Fuel, Clock, MapPin, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react'
import ReportModal from './ReportModal'

const COMBUST = [
  { key: 'magna',   label: 'Magna',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)' },
  { key: 'premium', label: 'Premium', color: '#5E6AD2', bg: 'rgba(94,106,210,0.12)', border: 'rgba(94,106,210,0.25)' },
  { key: 'diesel',  label: 'Diésel',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
]

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function StationSheet({ station, combustible, userLocation, onClose, onNavigate }) {
  const [reportCombust, setReportCombust] = useState(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    let startY = 0
    let startScrollTop = 0

    const onTouchStart = e => {
      startY = e.touches[0].clientY
      startScrollTop = el.scrollTop
    }
    const onTouchMove = e => {
      const dy = e.touches[0].clientY - startY
      if (dy > 60 && startScrollTop === 0) onClose()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [onClose])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!station) return null

  const dist = userLocation
    ? distanceKm(userLocation.lat, userLocation.lng, station.lat, station.lng)
    : null

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`

  const prices = COMBUST.map(c => ({ ...c, precio: station.precios?.[c.key] }))
  const activePrecio = station.precios?.[combustible]

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'flex-end' }}
        className="animate-fade-in"
      >
        {/* Backdrop */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />

        {/* Sheet */}
        <div
          ref={sheetRef}
          className="animate-sheet-up"
          style={{
            position: 'relative', width: '100%', zIndex: 1,
            background: 'linear-gradient(180deg, #13131a 0%, #0d0d13 100%)',
            borderRadius: '24px 24px 0 0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            maxHeight: '82vh', overflowY: 'auto',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Header */}
          <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)',
                color: 'white', marginBottom: 4, lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {station.nombre}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {station.marca && (
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                    {station.marca}
                  </span>
                )}
                {dist !== null && (
                  <span style={{ fontSize: 11, color: '#5E6AD2', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={11} />
                    {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)', flexShrink: 0, marginLeft: 12 }}>
              <X size={18} />
            </button>
          </div>

          {/* Price highlight */}
          {activePrecio && (
            <div style={{ margin: '0 20px 16px', padding: '16px 20px', background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                  {COMBUST.find(c => c.key === combustible)?.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#818CF8', lineHeight: 1 }}>
                  ${activePrecio.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>por litro MXN</div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Fuel size={24} color="#818CF8" />
              </div>
            </div>
          )}

          {/* All prices */}
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Todos los precios
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {prices.map((c, i) => (
                <div key={c.key} className={`animate-card-enter stagger-${i + 1}`} style={{ padding: '12px 10px', borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c.precio ? c.color : 'var(--color-muted)', fontFamily: 'var(--font-heading)' }}>
                    {c.precio ? `$${c.precio.toFixed(2)}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          {(station.calle || station.colonia || station.municipio) && (
            <div style={{ margin: '0 20px 16px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <MapPin size={16} color="var(--color-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                {station.calle && <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{station.calle}</div>}
                {station.colonia && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 1 }}>{station.colonia}</div>}
                {station.municipio && <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{station.municipio}</div>}
              </div>
            </div>
          )}

          {/* CRE info */}
          {station.cre_id && (
            <div style={{ margin: '0 20px 16px', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={13} color="var(--color-muted)" />
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>Datos oficiales CRE</span>
              <span style={{ fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 'auto', border: '1px solid rgba(34,197,94,0.2)' }}>Verificado</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ padding: '0 20px', display: 'flex', gap: 10 }}>
            <a
              href={mapsUrl} target="_blank" rel="noreferrer"
              className="pressable"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)',
                color: 'white', borderRadius: 14, padding: '14px',
                fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)',
                textDecoration: 'none', border: 'none',
                boxShadow: '0 4px 20px rgba(94,106,210,0.4)',
              }}
            >
              <Navigation size={16} />
              Cómo llegar
            </a>
            <button
              onClick={() => setReportCombust(combustible)}
              className="pressable"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                color: '#F59E0B', borderRadius: 14, padding: '14px 16px',
                fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer',
              }}
            >
              <Flag size={15} />
              Reportar
            </button>
          </div>
        </div>
      </div>

      {reportCombust && (
        <ReportModal
          station={station}
          combustible={reportCombust}
          onClose={() => setReportCombust(null)}
        />
      )}
    </>
  )
}
