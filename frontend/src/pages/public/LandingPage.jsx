import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Fuel, Share2, ChevronDown, TrendingDown, BookOpen, Globe, Download, X } from 'lucide-react'

const ACCENT      = '#5E6AD2'
const ACCENT_GLOW = 'rgba(94,106,210,0.28)'
const API_BASE    = import.meta.env.VITE_API_URL || 'https://gasonl-backend-production.up.railway.app/api'
const APP_URL     = 'https://pruebatupagina-free.github.io/gasolineras-nl/'
const GRAIN_BG    = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)'/%3E%3C/svg%3E")`

/* Consistent container — used in every section */
const W = { maxWidth: 1140, margin: '0 auto', padding: '0 clamp(16px,4vw,28px)' }

const TESTIMONIALS = [
  {
    quote: 'Llevo 3 meses usándola y ya ahorro casi $400 al mes. En Guadalupe la diferencia entre gasolineras puede ser más de $2 por litro.',
    name: 'Carlos M.', role: 'Conductor · Guadalupe, NL', initials: 'CM', color: '#5E6AD2',
    saving: '$400/mes', savingLabel: 'de ahorro mensual',
  },
  {
    quote: 'Viajo seguido entre Guadalajara y Colima y ahora siempre sé cuál gasolinera vale la pena en cada tramo. Datos reales de la CRE, completamente gratis.',
    name: 'Ana R.', role: 'Conductora · Guadalajara, Jal', initials: 'AR', color: '#22C55E',
    saving: '$2/litro', savingLabel: 'diferencia promedio',
  },
  {
    quote: 'En el Edomex hay muchísimas opciones y GasMap me muestra cuál es la más barata a cada rato. El mapa carga rápido y los precios siempre están al día.',
    name: 'Roberto S.', role: 'Conductor · Ecatepec, Edomex', initials: 'RS', color: '#F59E0B',
    saving: '$640/mes', savingLabel: 'potencial de ahorro',
  },
]

const FAQ_ITEMS = [
  { q: '¿Cada cuánto se actualizan los precios de la CRE?', a: 'Los precios se sincronizan diariamente directo desde la Comisión Reguladora de Energía. Siempre tienes el precio oficial del día.' },
  { q: '¿Puedo reportar un precio incorrecto en una gasolinera?', a: 'Sí. Desde el detalle de cualquier gasolinera puedes tocar "Reportar" si el precio en la bomba no coincide con el que muestra la app. Ayuda a toda la comunidad.' },
  { q: '¿Cuánto puedo ahorrar al mes usando GasMap?', a: 'La diferencia entre la gasolinera más cara y la más barata en una misma ciudad puede ser de $3 a $5 por litro. Si cargas 40 litros a la semana, podrías ahorrar entre $480 y $800 al mes eligiendo siempre la más barata cercana a ti.' },
  { q: '¿GasMap cubre toda la República Mexicana?', a: 'Sí. GasMap tiene más de 13,000 gasolineras registradas en los 32 estados del país. Puedes filtrar por estado y municipio para ver los precios exactamente donde estás o planeas viajar.' },
  { q: '¿Necesito crear una cuenta para ver los precios?', a: 'No. Puedes explorar el mapa y ver precios sin registrarte. La cuenta es opcional y te permite guardar tu garaje y registrar tu historial de cargas.' },
  { q: '¿En qué marcas de gasolineras funciona GasMap?', a: 'En todas: PEMEX, BP, Shell, Mobil, Oxxo Gas, G500, Hidrosina y cualquier franquicia registrada ante la CRE. Si está registrada, aparece en el mapa.' },
  { q: '¿Es seguro registrarse en GasMap?', a: 'Sí. Solo pedimos nombre y correo electrónico. No guardamos datos bancarios, contraseñas en texto plano ni información sensible. Tu privacidad está protegida.' },
]

// ── AppMockup ──────────────────────────────────────────────────────────────
function AppMockup({ stats }) {
  const f    = v => v != null ? `$${Number(v).toFixed(2)}` : null
  const minP = f(stats?.magna?.min) ?? '$18.99'
  const avgP = f(stats?.magna?.avg) ?? '$23.61'
  const maxP = f(stats?.magna?.max) ?? '$27.99'

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,106,210,0.22) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', width: 290, borderRadius: 50, background: '#080809', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 48px 96px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, marginBottom: 8 }}>
          <div style={{ width: 100, height: 28, background: '#000', borderRadius: 14 }} />
        </div>
        <div style={{ padding: '8px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Buenos días,</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.4px' }}>Eduardo 👋</div>
            </div>
            <div style={{ background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.3)', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 9, color: '#A5B4FC', fontWeight: 700 }}>⏱ 5h 20m</span>
            </div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#5E6AD2', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Precios hoy — Magna</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 16 }}>
            {[
              { label: 'MÍNIMO',   value: minP, color: '#22C55E', bg: 'rgba(34,197,94,0.1)'    },
              { label: 'PROMEDIO', value: avgP, color: '#5E6AD2', bg: 'rgba(94,106,210,0.1)'   },
              { label: 'MÁXIMO',   value: maxP, color: '#EF4444', bg: 'rgba(239,68,68,0.1)'    },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 7.5, color: '#6B7280', fontWeight: 700, letterSpacing: 0.4, marginBottom: 5, textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: c.color, fontFamily: 'var(--font-heading)' }}>{c.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#5E6AD2', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Precio más bajo</div>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderLeft: '3px solid #22C55E', borderRadius: 12, padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⛽</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: '#22C55E', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase' }}>MÁS BARATA · 2.3 km</div>
              <div style={{ fontSize: 12, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>PEMEX Revolución</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#22C55E', fontFamily: 'var(--font-heading)', flexShrink: 0 }}>{minP}</div>
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', height: 128, position: 'relative', background: '#0A0E16' }}>
            <svg width="100%" height="128" style={{ position: 'absolute', inset: 0 }}>
              <line x1="0" y1="64" x2="290" y2="64" stroke="#1A2030" strokeWidth="10" />
              <line x1="145" y1="0" x2="145" y2="128" stroke="#1A2030" strokeWidth="10" />
              <line x1="0" y1="24" x2="290" y2="100" stroke="#1A2030" strokeWidth="6" />
              <line x1="0" y1="104" x2="240" y2="14" stroke="#1A2030" strokeWidth="6" />
            </svg>
            {[
              { left: '17%', top: '42%', price: minP, color: '#22C55E', active: true  },
              { left: '60%', top: '62%', price: avgP, color: '#F59E0B', active: false },
              { left: '80%', top: '24%', price: maxP, color: '#EF4444', active: false },
            ].map((pin, i) => (
              <div key={i} style={{ position: 'absolute', left: pin.left, top: pin.top, transform: 'translate(-50%, -50%)', background: pin.active ? pin.color : `${pin.color}CC`, borderRadius: 6, padding: '3px 7px', fontSize: 9.5, fontWeight: 800, color: 'white', boxShadow: pin.active ? `0 3px 12px ${pin.color}70` : 'none', border: pin.active ? '1.5px solid white' : 'none' }}>{pin.price}</div>
            ))}
            <div style={{ position: 'absolute', left: '43%', top: '52%', width: 11, height: 11, borderRadius: '50%', background: '#5E6AD2', boxShadow: '0 0 0 5px rgba(94,106,210,0.25)', transform: 'translate(-50%, -50%)' }} />
          </div>
        </div>
        <div style={{ height: 52, background: 'rgba(8,8,9,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 6, marginTop: 10 }}>
          {[{ label: 'Inicio', active: true }, { label: 'Est.', active: false }, { label: 'Nav.', active: false }, { label: 'Garaje', active: false }, { label: 'Perfil', active: false }].map(tab => (
            <div key={tab.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: tab.active ? 1 : 0.3 }}>
              <div style={{ width: 18, height: 3, borderRadius: 2, background: tab.active ? '#5E6AD2' : 'transparent', marginBottom: 2 }} />
              <span style={{ fontSize: 7.5, color: tab.active ? '#5E6AD2' : '#6B7280', fontWeight: tab.active ? 700 : 400, letterSpacing: 0.3 }}>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 72, right: -8, background: 'rgba(8,8,9,0.96)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E80' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: 0.5 }}>CRE · EN VIVO</span>
      </div>
      <div style={{ position: 'absolute', top: 88, left: -8, background: 'rgba(8,8,9,0.96)', border: '1px solid rgba(94,106,210,0.35)', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
        <span style={{ fontSize: 14 }}>💰</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', letterSpacing: 0.3 }}>Ahorra hasta $640/mes</span>
      </div>
    </div>
  )
}

// ── Reveal on scroll ───────────────────────────────────────────────────────
function Reveal({ children, delay = 0, from = 'bottom', style = {}, className = '' }) {
  const ref           = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const tx = from === 'left'  ? (vis ? 'translateX(0)' : 'translateX(-32px)')
           : from === 'right' ? (vis ? 'translateX(0)' : 'translateX(32px)')
           :                    (vis ? 'translateY(0)' : 'translateY(32px)')
  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: tx, transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, ...style }}>
      {children}
    </div>
  )
}

// ── FAQ item ───────────────────────────────────────────────────────────────
function FaqItem({ item, open, onToggle }) {
  return (
    <div onClick={onToggle} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 24px', cursor: 'pointer', transition: 'border-color 0.2s', ...(open ? { borderColor: 'rgba(94,106,210,0.35)' } : {}) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-fg)', lineHeight: 1.5 }}>{item.q}</span>
        <ChevronDown size={18} color={ACCENT} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
      </div>
      {open && <p style={{ marginTop: 16, color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.8 }}>{item.a}</p>}
    </div>
  )
}

const isIOS        = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !('MSStream' in window)
const isStandalone = () => window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches

// ── Main component ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [openFaq, setOpenFaq]           = useState(null)
  const [stats, setStats]               = useState(null)
  const [mounted, setMounted]           = useState(false)
  const [canInstall, setCanInstall]     = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const deferredPrompt                  = useRef(null)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  useEffect(() => { fetch(`${API_BASE}/estaciones/stats`).then(r => r.json()).then(d => setStats(d)).catch(() => {}) }, [])
  useEffect(() => {
    const handler = e => { e.preventDefault(); deferredPrompt.current = e; setCanInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setCanInstall(false))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      if (outcome === 'accepted') { setCanInstall(false); deferredPrompt.current = null }
    } else if (isIOS() && !isStandalone()) {
      setShowIOSModal(true)
    }
  }

  function handleShare() {
    if (navigator.share) { navigator.share({ title: 'GasMap', text: 'El precio real de la gasolina en México', url: APP_URL }) }
    else { navigator.clipboard?.writeText(APP_URL); alert('¡Link copiado al portapapeles!') }
  }

  const showInstallBtn = (canInstall || (isIOS() && !isStandalone())) && !isStandalone()
  const fmt = v => v != null ? `$${Number(v).toFixed(2)}` : '—'

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', color: 'var(--color-fg)', minHeight: '100dvh' }}>

      {/* Global styles */}
      <style>{`
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-1%,-2%)} 20%{transform:translate(2%,1%)}
          30%{transform:translate(-1%,3%)} 40%{transform:translate(1%,-1%)} 50%{transform:translate(-2%,2%)}
          60%{transform:translate(3%,-2%)} 70%{transform:translate(-1%,1%)} 80%{transform:translate(1%,2%)} 90%{transform:translate(-2%,-1%)}
        }
        .bento-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .bento-wide-l { grid-column:1/3; }
        .bento-wide-r { grid-column:2/4; }
        @media(max-width:720px){
          .bento-grid { display:flex; flex-direction:column; gap:12px; }
        }
        .footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:48px; }
        @media(max-width:680px){ .footer-grid { grid-template-columns:1fr; gap:32px; } }
      `}</style>

      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: '-20%', zIndex: 45, pointerEvents: 'none', opacity: 0.055, mixBlendMode: 'overlay', backgroundImage: GRAIN_BG, backgroundRepeat: 'repeat', backgroundSize: '250px 250px', animation: 'grain 8s steps(10) infinite', willChange: 'transform' }} />

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(5,5,6,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)', height: 58 }}>
        <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fuel size={16} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>GasMap</span>
          </div>
          {showInstallBtn ? (
            <button onClick={handleInstall} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: ACCENT, color: 'white', border: 'none', fontWeight: 600, fontSize: 13, padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <Download size={14} />Instalar app
            </button>
          ) : (
            <Link to="/register" style={{ background: ACCENT, color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 13, padding: '8px 18px', borderRadius: 8 }}>
              Abrir app
            </Link>
          )}
        </div>
      </nav>

      {/* iOS modal */}
      {showIOSModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowIOSModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', zIndex: 1, background: 'linear-gradient(180deg,#13131a 0%,#0d0d13 100%)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '28px 28px 48px' }}>
            <button onClick={() => setShowIOSModal(false)} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'white', marginBottom: 6 }}>Instala GasMap en iPhone</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>3 pasos — sin App Store, completamente gratis</div>
            {[{ step:'1', icon:'⬆️', label:'Toca el botón Compartir', sub:'El ícono de la flecha hacia arriba en Safari' }, { step:'2', icon:'➕', label:'"Agregar a pantalla de inicio"', sub:'Desplázate en el menú hasta encontrarlo' }, { step:'3', icon:'✅', label:'Toca "Agregar"', sub:'GasMap aparece en tu pantalla de inicio' }].map(({ step, icon, label, sub }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid texture */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse 60% 80% at 20% 50%, black 0%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 20% 50%, black 0%, transparent 100%)' }} />
        {/* Ambient glows */}
        <div style={{ position: 'absolute', right: '10%', top: '20%', width: 560, height: 560, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(94,106,210,0.15) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', left: '-5%', bottom: '10%', width: 320, height: 320, borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />

        <div style={{ ...W, width: '100%', boxSizing: 'border-box', padding: '90px 28px 60px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
            {/* Left */}
            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(28px)', transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1)' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 20, fontSize: 'clamp(38px, 5.5vw, 68px)' }}>
                El precio real<br />
                de la <span style={{ color: ACCENT }}>gasolina</span><br />
                en México
              </h1>
              <p style={{ fontSize: 17, color: 'var(--color-muted)', marginBottom: 24, lineHeight: 1.75, maxWidth: 440 }}>
                Precios oficiales de la CRE. Encuentra la estación más barata cerca de ti. Gratis, sin tarjeta de crédito.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, flexWrap: 'wrap' }}>
                {[{ dot: '#22C55E', text: '13,000+ gasolineras' }, { dot: '#5E6AD2', text: 'Los 32 estados · CRE diaria' }, { dot: '#F59E0B', text: 'Completamente gratis' }].map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.12)', marginRight: 1 }}>·</span>}
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.dot, display: 'inline-block', flexShrink: 0 }} />
                    {item.text}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: ACCENT, color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '13px 26px', borderRadius: 12, boxShadow: `0 0 28px ${ACCENT_GLOW}` }}>
                  <Fuel size={16} /> Abrir GasMap
                </Link>
                <button onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--color-fg)', border: '1px solid var(--color-border-strong)', fontWeight: 600, fontSize: 15, padding: '13px 26px', borderRadius: 12, cursor: 'pointer' }}>
                  <Share2 size={16} /> Compartir
                </button>
              </div>
            </div>
            {/* Right — AppMockup */}
            <div style={{ display: 'flex', justifyContent: 'center', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(36px)', transition: 'opacity 0.95s cubic-bezier(0.16,1,0.3,1) 0.18s, transform 0.95s cubic-bezier(0.16,1,0.3,1) 0.18s' }}>
              <AppMockup stats={stats} />
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID features ── */}
      <section style={{ padding: '0 0 80px' }}>
        <div style={{ ...W }}>
          <Reveal style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '1px', textTransform: 'uppercase' }}>✦ Características</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-0.5px' }}>
              Todo lo que necesitas para ahorrar
            </h2>
          </Reveal>

          <div className="bento-grid">
            {/* Card 1 — Large left */}
            <Reveal delay={0} className="bento-wide-l">
              <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: 20, padding: 'clamp(18px,3vw,28px) clamp(16px,3vw,26px)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.12)', borderRadius: 8, padding: '4px 10px', marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', letterSpacing: 1, textTransform: 'uppercase' }}>⬆ Precio más bajo primero</span>
                </div>
                <p style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                  Las estaciones se ordenan por precio según tu ubicación. La más barata siempre al tope.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { rank: '🏆', name: 'PEMEX Revolución', dist: '1.2 km', price: '$18.29', badge: 'MÁS BARATA', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  color: '#22C55E' },
                    { rank: '#2', name: 'Oxxo Gas Centro',  dist: '2.8 km', price: '$19.15', badge: null,         bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', color: '#F59E0B' },
                    { rank: '#3', name: 'BP Periférico',    dist: '4.1 km', price: '$20.44', badge: null,         bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)', color: '#EF4444' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12 }}>
                      <span style={{ fontSize: 16, width: 28, textAlign: 'center', flexShrink: 0 }}>{s.rank}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{s.dist}</div>
                      </div>
                      {s.badge && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '3px 8px', borderRadius: 6, letterSpacing: 0.5, flexShrink: 0 }}>{s.badge}</span>}
                      <span style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: 'var(--font-heading)', flexShrink: 0 }}>{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Card 2 — Small: 32 estados */}
            <Reveal delay={80}>
              <div style={{ background: 'rgba(94,106,210,0.05)', border: '1px solid rgba(94,106,210,0.15)', borderRadius: 20, padding: 'clamp(18px,3vw,28px) clamp(16px,3vw,22px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(56px,8vw,80px)', color: ACCENT, letterSpacing: -4, lineHeight: 1, marginBottom: 6 }}>32</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-fg)', marginBottom: 4 }}>estados cubiertos</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 20 }}>toda la República Mexicana</div>
                <div style={{ background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 12, padding: '10px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--color-fg)' }}>13,000+</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>gasolineras</div>
                </div>
              </div>
            </Reveal>

            {/* Card 3 — Small: sin descarga */}
            <Reveal delay={110}>
              <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.14)', borderRadius: 20, padding: 'clamp(18px,3vw,28px) clamp(16px,3vw,22px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#EF4444','#F59E0B','#22C55E'].map(c => <div key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'monospace', flex: 1 }}>gasmap.app</span>
                  <Globe size={12} color="var(--color-muted)" />
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(18px,2.5vw,24px)', marginBottom: 8, letterSpacing: -0.5 }}>Sin descargar nada</div>
                <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.65 }}>Abre GasMap desde cualquier navegador. Chrome, Safari o Firefox — funciona en todos.</div>
              </div>
            </Reveal>

            {/* Card 4 — Large right */}
            <Reveal delay={160} className="bento-wide-r">
              <div style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.14)', borderRadius: 20, padding: 'clamp(18px,3vw,28px) clamp(16px,3vw,26px)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(48px,7vw,80px)', letterSpacing: -3, lineHeight: 1, marginBottom: 10, background: 'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.45) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Gratis
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 22, lineHeight: 1.65, maxWidth: 340 }}>
                  Sin tarjeta de crédito. Sin anuncios. Sin planes de pago. Solo entra y ahorra en tu próxima carga.
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px', maxWidth: 320 }}>
                  {['Nombre completo', 'Correo electrónico'].map(ph => (
                    <div key={ph} style={{ height: 38, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, marginBottom: 8, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{ph}</span>
                    </div>
                  ))}
                  <div style={{ height: 40, background: ACCENT, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${ACCENT_GLOW}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Crear cuenta gratis →</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SOBRE NOSOTROS + PRECIOS ── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64 }}>
          <Reveal from="left">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 20, height: 20, background: ACCENT, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fuel size={11} color="white" /></div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: ACCENT }}>Sobre nosotros</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.5px', marginBottom: 20 }}>¿Qué es GasMap?</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85, marginBottom: 16 }}>GasMap es una plataforma mexicana creada para ayudar a conductores y familias a encontrar la gasolina más barata cerca de ellos. Nacimos con una misión simple: hacer transparente el precio de la gasolina en México y entregar información oficial, sin letra chica.</p>
              <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85, marginBottom: 16 }}>A diferencia de otras apps, GasMap no solo muestra precios — te entrega el ranking actualizado de las estaciones más baratas cerca de ti, con navegación directa para llegar a ellas sin perder tiempo.</p>
              <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85 }}>Usamos datos oficiales de la Comisión Reguladora de Energía (CRE) actualizados diariamente, combinados con reportes de nuestra comunidad. El resultado es el mapa de gasolina más completo de México: más de <strong style={{ color: 'var(--color-fg)' }}>13,000 estaciones en los 32 estados</strong> de la República.</p>
              <p style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 20, fontStyle: 'italic' }}>· GasMap es completamente gratis.</p>
            </div>
          </Reveal>
          <Reveal from="right" delay={150}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 20, height: 20, background: 'rgba(94,106,210,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={11} color={ACCENT} /></div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: ACCENT }}>Precios de hoy</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.5px', marginBottom: 8 }}>¿Cuánto cuesta la gasolina hoy?</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Los precios varían por estación, estado y día. Aquí el rango nacional oficial de hoy según la CRE, calculado sobre 13,000+ estaciones.</p>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  {['COMBUSTIBLE','MÍN','MÁX','PROMEDIO'].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.5px' }}>{h}</span>)}
                </div>
                {[
                  { label: '🟢 Magna',   min:stats?.magna?.min,   max:stats?.magna?.max,   avg:stats?.magna?.avg,   highlight:true  },
                  { label: '🔵 Premium', min:stats?.premium?.min, max:stats?.premium?.max, avg:stats?.premium?.avg },
                  { label: '🟡 Diésel',  min:stats?.diesel?.min,  max:stats?.diesel?.max,  avg:stats?.diesel?.avg  },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 16px', alignItems: 'center', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none', background: row.highlight ? 'rgba(94,106,210,0.06)' : 'transparent' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: row.highlight ? 'var(--color-fg)' : 'var(--color-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg)' }}>{fmt(row.min)}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{fmt(row.max)}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{fmt(row.avg)}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 12, lineHeight: 1.5 }}>* Precios referenciales según datos de la CRE. Pueden variar por estación individual.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ ...W }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '1px', textTransform: 'uppercase' }}>✦ Usuarios reales</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.5px', marginBottom: 12 }}>Lo que dicen nuestros usuarios</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>Conductores mexicanos que ya ahorran en gasolina con GasMap.</p>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px,100%), 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 90}>
                <div style={{ background: `linear-gradient(135deg, ${t.color}35 0%, rgba(255,255,255,0.07) 100%)`, borderRadius: 22, padding: 1, height: '100%' }}>
                  <div style={{ background: '#0C0C14', borderRadius: 21, padding: '26px 24px', height: '100%', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ position: 'absolute', top: -12, right: 16, fontFamily: 'Georgia, serif', fontSize: 130, color: `${t.color}12`, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontWeight: 900 }}>"</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${t.color}15`, border: `1px solid ${t.color}30`, borderRadius: 10, padding: '6px 12px', alignSelf: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800, color: t.color }}>{t.saving}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>{t.savingLabel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 13, color: '#F59E0B' }}>★</span>)}
                    </div>
                    <p style={{ color: 'var(--color-fg)', fontSize: 14, lineHeight: 1.8, flex: 1, margin: 0, position: 'relative', zIndex: 1 }}>"{t.quote}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${t.color}30, ${t.color}12)`, border: `1.5px solid ${t.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: t.color, fontFamily: 'var(--font-heading)' }}>{t.initials}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-fg)' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 28px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 20, height: 20, background: 'rgba(94,106,210,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={11} color={ACCENT} /></div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: ACCENT }}>Preguntas frecuentes</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.5px', marginBottom: 10 }}>Todo sobre el ahorro en gasolina</h2>
              <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.7 }}>Resolvemos las dudas más comunes sobre precios de gasolina, la CRE y cómo funciona GasMap.</p>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={i} delay={i * 60}>
                <FaqItem item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, transparent 0%, rgba(94,106,210,0.07) 50%, transparent 100%)', borderTop: '1px solid rgba(94,106,210,0.15)', borderBottom: '1px solid rgba(94,106,210,0.15)' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,106,210,0.12) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px', maskImage: 'radial-gradient(ellipse 80% 100% at 50% 50%, black 0%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 50%, black 0%, transparent 100%)' }} />
        <Reveal>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 28px', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E80' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', letterSpacing: 1, textTransform: 'uppercase' }}>Completamente gratis</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(30px, 5vw, 52px)', letterSpacing: '-1.5px', marginBottom: 18, lineHeight: 1.1 }}>
              ¿Listo para ahorrar<br />en tu próxima carga?
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: 16, lineHeight: 1.75, maxWidth: 460, margin: '0 auto 40px' }}>
              Más de 13,000 gasolineras. Datos oficiales CRE. Sin instalar nada, sin tarjeta de crédito.
            </p>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: ACCENT, color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '15px 36px', borderRadius: 14, boxShadow: `0 0 48px ${ACCENT_GLOW}, 0 4px 24px rgba(0,0,0,0.4)`, letterSpacing: '-0.3px' }}>
              <Fuel size={18} /> Abrir GasMap gratis →
            </Link>
            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--color-muted)' }}>Sin tarjeta · Sin descarga · En tu navegador</p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '60px 0 32px' }}>
        <div style={{ ...W }}>
          <div className="footer-grid" style={{ marginBottom: 48 }}>
            {/* Col 1: Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, background: ACCENT, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fuel size={16} color="white" /></div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18 }}>GasMap</span>
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.8, maxWidth: 280, marginBottom: 20 }}>El precio real de la gasolina en México. Datos oficiales CRE actualizados diariamente en los 32 estados.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ label: '𝕏', href: 'https://x.com' }, { label: '▶', href: 'https://youtube.com' }, { label: '📷', href: 'https://instagram.com' }].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
            {/* Col 2: App */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 20 }}>App</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[{ label: 'Abrir GasMap', to: '/register' }, { label: 'Crear cuenta', to: '/register' }, { label: 'Iniciar sesión', to: '/login' }].map(link => (
                  <Link key={link.label} to={link.to} style={{ color: 'var(--color-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{link.label}</Link>
                ))}
              </div>
            </div>
            {/* Col 3: Legal */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 20 }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[{ label: 'Política de Privacidad', to: '/privacidad' }, { label: 'Términos y Condiciones', to: '/terminos' }, { label: 'Contacto', to: '/contacto' }].map(link => (
                  <Link key={link.label} to={link.to} style={{ color: 'var(--color-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{link.label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>© 2026 GasMap · Datos oficiales CRE · México</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 11 }}>Los precios son referenciales. GasMap no es responsable de variaciones en estaciones individuales.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
