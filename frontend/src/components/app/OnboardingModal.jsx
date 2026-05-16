import { useState } from 'react'

const ACCENT = '#5E6AD2'

const SLIDES = [
  {
    badge: '13,000+ ESTACIONES · 32 ESTADOS',
    title: 'Precios en tiempo real',
    desc: 'Más de 13,000 gasolineras en los 32 estados de México, actualizadas diariamente con datos oficiales de la CRE.',
    visual: () => (
      <div style={{ position: 'relative', width: 280, height: 200, margin: '0 auto' }}>
        <svg width="280" height="200" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
          {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i*50+25} x2="280" y2={i*50+25} stroke="white" strokeWidth="1" />)}
          {[0,1,2,3,4].map(i => <line key={`v${i}`} x1={i*60+20} y1="0" x2={i*60+20} y2="200" stroke="white" strokeWidth="1" />)}
        </svg>
        <PricePin price="$24.50" color="#EF4444" x={40} y={60} />
        <PricePin price="$22.80" color="#22C55E" x={160} y={100} active />
        <PricePin price="$23.90" color="#F59E0B" x={70} y={140} />
        <PricePin price="$23.20" color="#F59E0B" x={220} y={55} />
        <PricePin price="$22.95" color="#22C55E" x={240} y={150} />
        {/* Estado chips */}
        {[
          { label: 'JALISCO', x: 20, y: 8 },
          { label: 'CDMX', x: 110, y: 8 },
          { label: 'NUEVO LEÓN', x: 190, y: 8 },
        ].map(({ label, x }) => (
          <div key={label} style={{
            position: 'absolute', top: 8, left: x,
            background: 'rgba(94,106,210,0.18)', border: '1px solid rgba(94,106,210,0.35)',
            borderRadius: 20, padding: '2px 8px',
            fontSize: 8, color: '#A5B4FC', fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap',
          }}>{label}</div>
        ))}
      </div>
    ),
  },
  {
    badge: 'FILTRA POR ESTADO',
    title: 'Busca en todo México',
    desc: 'Filtra por estado, municipio y tipo de combustible. Ordenado siempre del más barato al más caro.',
    visual: () => (
      <div style={{ width: 260, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Filter row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.4)',
            fontSize: 11, color: '#A5B4FC', fontWeight: 700,
          }}>🌎 JALISCO</div>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 11, color: '#8A8F98', fontWeight: 600,
          }}>Guadalajara</div>
        </div>
        {[
          { label: '#1 PEMEX Insurgentes', price: '$22.80', color: '#22C55E', highlight: true },
          { label: '#2 Oxxo Gas Reforma', price: '$23.10', color: '#F59E0B' },
          { label: '#3 BP Chapultepec', price: '$23.90', color: '#EF4444' },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12,
            background: s.highlight ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${s.highlight ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <span style={{ fontSize: 12, color: s.highlight ? '#22C55E' : '#8A8F98', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: s.color, fontFamily: 'var(--font-heading)' }}>{s.price}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    badge: 'NAVEGACIÓN INTEGRADA',
    title: 'Navega a la estación',
    desc: 'Ruta directa hasta la gasolinera más barata. Toca "Cómo llegar" y abre Google Maps al instante.',
    visual: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px rgba(94,106,210,0.5)` }}>
          <span style={{ fontSize: 36 }}>↑</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: '#8A8F98', marginBottom: 2 }}>EN 350 M</div>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>↱  Girar a la derecha</div>
          <div style={{ fontSize: 11, color: '#8A8F98' }}>Av. Insurgentes Sur</div>
        </div>
        <div style={{ padding: '6px 16px', borderRadius: 20, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}>
          <span style={{ fontSize: 11, color: '#A5B4FC', fontWeight: 700, letterSpacing: 0.8 }}>🗺️ ABRE EN GOOGLE MAPS</span>
        </div>
      </div>
    ),
  },
  {
    badge: 'SIN APP STORE',
    title: 'Instala la app gratis',
    desc: 'Agrega GasMap a tu pantalla de inicio para acceso instantáneo, sin abrir el navegador.',
    visual: () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 300, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px rgba(94,106,210,0.5)`, marginBottom: 4 }}>
            <span style={{ fontSize: 36 }}>⛽</span>
          </div>
          {ios ? (
            <>
              {[
                { icon: '⬆️', text: 'Toca el botón Compartir en Safari' },
                { icon: '➕', text: 'Selecciona "Agregar a pantalla de inicio"' },
                { icon: '✅', text: 'Toca "Agregar" — ¡listo!' },
              ].map(({ icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: '#EDEDEF', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { icon: '🔔', text: 'Busca el banner de instalación en Chrome' },
                { icon: '👤', text: 'O ve a Perfil → "Instalar GasMap"' },
                { icon: '✅', text: 'Toca "Instalar" — acceso instantáneo' },
              ].map(({ icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: '#EDEDEF', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )
    },
  },
]

function PricePin({ price, color, x, y, active }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        background: active ? color : `${color}90`,
        borderRadius: 10, padding: '5px 10px',
        fontSize: 12, fontWeight: 800, color: 'white',
        boxShadow: active ? `0 4px 20px ${color}60` : 'none',
        border: active ? `2px solid white` : 'none',
      }}>{price}</div>
      <div style={{ width: 2, height: 8, background: color }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    </div>
  )
}

export default function OnboardingModal({ onComplete }) {
  const [slide, setSlide] = useState(0)
  const isLast = slide === SLIDES.length - 1
  const s = SLIDES[slide]
  const Visual = s.visual

  function next() {
    if (isLast) complete()
    else setSlide(slide + 1)
  }

  function complete() {
    onComplete()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5,5,6,0.97)', backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* X close */}
      <button
        onClick={complete}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          cursor: 'pointer', color: 'white', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>

      {/* Visual */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Visual />
      </div>

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`,
        borderRadius: 100, padding: '5px 14px', marginBottom: 16,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
        <span style={{ fontSize: 11, color: '#A5B4FC', fontWeight: 700, letterSpacing: '0.8px' }}>{s.badge}</span>
      </div>

      {/* Text */}
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontWeight: 800,
        fontSize: 28, letterSpacing: '-0.5px', textAlign: 'center',
        color: 'white', marginBottom: 12, lineHeight: 1.15,
      }}>{s.title}</h2>
      <p style={{ color: '#8A8F98', fontSize: 15, textAlign: 'center', lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
        {s.desc}
      </p>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{
            height: 6, borderRadius: 3,
            width: i === slide ? 24 : 6,
            background: i === slide ? ACCENT : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
        {!isLast && (
          <button onClick={complete} style={{
            flex: 1, padding: '14px 0', borderRadius: 14,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#8A8F98', fontWeight: 600, fontSize: 15, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}>Omitir</button>
        )}
        <button onClick={next} style={{
          flex: isLast ? 1 : 2, padding: '14px 0', borderRadius: 14,
          background: ACCENT, border: 'none',
          color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          boxShadow: `0 4px 24px rgba(94,106,210,0.45)`,
        }}>
          {isLast ? 'Comenzar →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}
