import { useState } from 'react'

const ACCENT = '#5E6AD2'

const SLIDES = [
  {
    badge: 'EN TIEMPO REAL · CRE',
    title: 'Precios en tiempo real',
    desc: 'Consulta los precios actualizados de todas las gasolineras de México directamente desde la CRE.',
    visual: () => (
      <div style={{ position: 'relative', width: 280, height: 200, margin: '0 auto' }}>
        {/* Grid lines */}
        <svg width="280" height="200" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={i*50+25} x2="280" y2={i*50+25} stroke="white" strokeWidth="1" />)}
          {[0,1,2,3,4].map(i => <line key={`v${i}`} x1={i*60+20} y1="0" x2={i*60+20} y2="200" stroke="white" strokeWidth="1" />)}
        </svg>
        {/* Price markers */}
        <PricePin price="$24.50" color="#EF4444" x={40} y={60} />
        <PricePin price="$22.80" color="#22C55E" x={160} y={100} active />
        <PricePin price="$23.90" color="#F59E0B" x={70} y={140} />
      </div>
    ),
  },
  {
    badge: 'PRECIO MÁS BAJO',
    title: 'Encuentra la más barata',
    desc: 'Las gasolineras se ordenan por precio. La más barata cerca de ti, siempre al tope de la lista.',
    visual: () => (
      <div style={{ width: 260, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: '#1 PEMEX Revolución', price: '$22.80', color: '#22C55E', highlight: true },
          { label: '#2 Oxxo Gas San Pedro', price: '$23.10', color: '#F59E0B' },
          { label: '#3 BP Constitución', price: '$23.90', color: '#EF4444' },
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
    desc: 'Ruta animada hasta la gasolinera. Instrucciones paso a paso y acceso directo a Google Maps.',
    visual: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px rgba(94,106,210,0.5)` }}>
          <span style={{ fontSize: 36 }}>↑</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: '#8A8F98', marginBottom: 2 }}>EN 250 M</div>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>↱  Girar a la derecha</div>
          <div style={{ fontSize: 11, color: '#8A8F98' }}>Av. Gonzalitos</div>
        </div>
        <div style={{ padding: '6px 16px', borderRadius: 20, background: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}>
          <span style={{ fontSize: 11, color: '#A5B4FC', fontWeight: 700, letterSpacing: 0.8 }}>🗺️ NAVEGACIÓN ANIMADA</span>
        </div>
      </div>
    ),
  },
  {
    badge: 'SIN APP STORE',
    title: 'Instala la app gratis',
    desc: 'Agrega GasMap a tu pantalla de inicio para acceso instantáneo sin abrir el navegador.',
    visual: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 90, height: 90, borderRadius: 22, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 40px rgba(94,106,210,0.5)` }}>
          <span style={{ fontSize: 44 }}>⛽</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white', fontFamily: 'var(--font-heading)' }}>GasMap</div>
        {[
          '📲  Instala desde el ícono del navegador',
          '✅  Acceso como app nativa en tu pantalla de inicio',
        ].map((t, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.1)', width: 260, fontSize: 12, color: '#EDEDEF' }}>
            {t}
          </div>
        ))}
      </div>
    ),
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
    localStorage.setItem('onboardingCompleted', '1')
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
