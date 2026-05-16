import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Fuel, Share2, ChevronDown, TrendingDown, BookOpen, Globe, Lock } from 'lucide-react'

const ACCENT = '#5E6AD2'
const ACCENT_GLOW = 'rgba(94,106,210,0.28)'
const API_BASE = import.meta.env.VITE_API_URL || 'https://gasonl-backend-production.up.railway.app/api'
const APP_URL = 'https://pruebatupagina-free.github.io/gasolineras-nl/'
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(APP_URL)}&bgcolor=141416&color=ededef&margin=12&format=png`

const FAQ_ITEMS = [
  {
    q: '¿Cada cuánto se actualizan los precios de la CRE?',
    a: 'Los precios se sincronizan diariamente directo desde la Comisión Reguladora de Energía. Siempre tienes el precio oficial del día.'
  },
  {
    q: '¿Puedo reportar un precio incorrecto en una gasolinera?',
    a: 'Sí. Desde el detalle de cualquier gasolinera puedes tocar "Reportar" si el precio en la bomba no coincide con el que muestra la app. Ayuda a toda la comunidad.'
  },
  {
    q: '¿Cuánto puedo ahorrar al mes usando GasMap?',
    a: 'La diferencia entre la gasolinera más cara y la más barata puede ser de hasta $4 por litro. Si cargas 40 litros a la semana, podrías ahorrar hasta $640 al mes eligiendo siempre la más barata cercana.'
  },
  {
    q: '¿Necesito crear una cuenta para ver los precios?',
    a: 'No. Puedes explorar el mapa y ver precios sin registrarte. La cuenta es opcional y te permite guardar tu garaje y registrar tu historial de cargas.'
  },
  {
    q: '¿En qué marcas de gasolineras funciona GasMap?',
    a: 'En todas: PEMEX, BP, Shell, Mobil, Oxxo Gas, G500, Hidrosina y cualquier franquicia registrada ante la CRE. Si está registrada, aparece en el mapa.'
  },
  {
    q: '¿Es seguro registrarse en GasMap?',
    a: 'Sí. Solo pedimos nombre y correo electrónico. No guardamos datos bancarios, contraseñas en texto plano ni información sensible. Tu privacidad está protegida.'
  },
]

function FaqItem({ item, open, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        ...(open ? { borderColor: `rgba(94,106,210,0.35)` } : {})
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-fg)', lineHeight: 1.5 }}>{item.q}</span>
        <ChevronDown
          size={18}
          color={ACCENT}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
        />
      </div>
      {open && (
        <p style={{ marginTop: 16, color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.8 }}>
          {item.a}
        </p>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/estaciones/stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'GasMap', text: 'El precio real de la gasolina en México', url: APP_URL })
    } else {
      navigator.clipboard?.writeText(APP_URL)
      alert('¡Link copiado al portapapeles!')
    }
  }

  const fmt = v => v != null ? `$${Number(v).toFixed(2)}` : '—'

  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', color: 'var(--color-fg)', minHeight: '100dvh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,5,6,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>GasMap</span>
        </div>
        <Link to="/register" style={{
          background: ACCENT, color: 'white', textDecoration: 'none',
          fontWeight: 600, fontSize: 13, padding: '8px 18px', borderRadius: 8
        }}>
          Abrir app
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '90px 28px 60px',
        maxWidth: 1140, margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64, alignItems: 'center'
        }}>

          {/* Left */}
          <div>
            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 800, lineHeight: 1.05,
              letterSpacing: '-2px', marginBottom: 20,
              fontSize: 'clamp(38px, 5.5vw, 68px)'
            }}>
              El precio real de la{' '}
              <span style={{ color: ACCENT }}>gasolina</span>
              {' '}en MX
            </h1>

            <p style={{ fontSize: 17, color: 'var(--color-muted)', marginBottom: 36, lineHeight: 1.75, maxWidth: 440 }}>
              Precios oficiales de la CRE. Encuentra la estación más barata cerca de ti.
              Gratis, sin tarjeta de crédito.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: ACCENT, color: 'white', textDecoration: 'none',
                fontWeight: 700, fontSize: 15, padding: '13px 26px', borderRadius: 12,
                boxShadow: `0 0 28px ${ACCENT_GLOW}`
              }}>
                <Fuel size={16} /> Abrir GasMap
              </Link>
              <button onClick={handleShare} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: 'var(--color-fg)',
                border: '1px solid var(--color-border-strong)',
                fontWeight: 600, fontSize: 15, padding: '13px 26px', borderRadius: 12, cursor: 'pointer'
              }}>
                <Share2 size={16} /> Compartir
              </button>
            </div>
          </div>

          {/* Right — QR card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(20,20,22,0.95)', border: '1px solid var(--color-border-strong)',
              borderRadius: 20, padding: '32px 36px', textAlign: 'center', maxWidth: 280
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 20 }}>
                Escanea para abrir la app
              </p>
              <img
                src={QR_URL}
                alt="QR GasMap"
                width={180} height={180}
                style={{ borderRadius: 12, display: 'block', margin: '0 auto' }}
              />
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 18, lineHeight: 1.6 }}>
                Apunta la cámara de tu celular al código QR o toca el botón de arriba
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ textAlign: 'center', marginTop: 64 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            ¿Qué incluye?
          </span>
          <div style={{ marginTop: 8, color: 'var(--color-muted)' }}>↓</div>
        </div>
      </section>

      {/* ── FEATURES (4 cards 2x2) ── */}
      <section style={{ padding: '80px 28px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
          gap: 14
        }}>
          {[
            {
              icon: '🪙',
              title: 'Precio más bajo primero',
              desc: 'Las estaciones se ordenan por precio según tu ubicación. La más barata aparece siempre al tope, todos los días.'
            },
            {
              icon: '📋',
              title: 'Precios en tiempo real',
              desc: 'Mapa de estaciones con precios oficiales de la CRE actualizados diariamente. Sin estimaciones.'
            },
            {
              icon: '📱',
              title: 'Acceso inmediato desde el navegador',
              desc: 'Abre GasMap desde tu celular y úsala al instante. Sin descargar nada, sin instalaciones previas.'
            },
            {
              icon: '🔒',
              title: 'Sin tarjeta de crédito',
              desc: 'Crea tu cuenta gratis en menos de 1 minuto. Solo necesitas tu nombre y correo electrónico.'
            },
          ].map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 16, padding: '28px 24px',
              display: 'flex', gap: 16, alignItems: 'flex-start'
            }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0, borderRadius: 12,
                background: 'rgba(94,106,210,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--color-fg)' }}>{f.title}</h3>
                <p style={{ color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOBRE NOSOTROS + PRECIOS DE HOY ── */}
      <section style={{ padding: '80px 28px', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64
        }}>
          {/* Left — About */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 20, height: 20, background: ACCENT, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Fuel size={11} color="white" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: ACCENT }}>
                Sobre nosotros
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.5px', marginBottom: 20 }}>
              ¿Qué es GasMap?
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85, marginBottom: 16 }}>
              GasMap es una plataforma mexicana creada para ayudar a conductores y familias
              a encontrar la gasolina más barata cerca de ellos. Nacimos con una misión simple:
              hacer transparente el precio de la gasolina en México y entregar información oficial,
              sin letra chica.
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85, marginBottom: 16 }}>
              A diferencia de otras apps, GasMap no solo muestra precios — te entrega el ranking
              actualizado de las estaciones más baratas cerca de ti, con navegación directa estilo Waze
              para llegar a ellas sin perder tiempo.
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.85 }}>
              Usamos datos oficiales de la Comisión Reguladora de Energía (CRE) actualizados
              diariamente, combinados con reportes de nuestra comunidad que contribuye con
              información en terreno. El resultado es el mapa de gasolina más completo y actualizado
              de México, con más de 1,276 estaciones.
            </p>
            <p style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 20, fontStyle: 'italic' }}>
              · GasMap es completamente gratis.
            </p>
          </div>

          {/* Right — Precios de hoy */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 20, height: 20, background: 'rgba(94,106,210,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={11} color={ACCENT} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: ACCENT }}>
                Precios de hoy
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.5px', marginBottom: 8 }}>
              ¿Cuánto cuesta la gasolina en MX?
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Los precios varían por estación, municipio y día. Aquí el rango oficial de hoy según la CRE.
            </p>

            {/* Table */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                background: 'rgba(255,255,255,0.04)',
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border)'
              }}>
                {['COMBUSTIBLE', 'MÍN', 'MÁX', 'PROMEDIO'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.5px' }}>{h}</span>
                ))}
              </div>

              {[
                {
                  label: '🟢 Magna',
                  badge: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
                  min: stats?.magna?.min,
                  max: stats?.magna?.max,
                  avg: stats?.magna?.avg,
                  highlight: true
                },
                {
                  label: '🔵 Premium',
                  badge: { bg: 'rgba(94,106,210,0.1)', color: ACCENT },
                  min: stats?.premium?.min,
                  max: stats?.premium?.max,
                  avg: stats?.premium?.avg
                },
                {
                  label: '🟡 Diésel',
                  badge: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
                  min: stats?.diesel?.min,
                  max: stats?.diesel?.max,
                  avg: stats?.diesel?.avg
                },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  padding: '14px 16px', alignItems: 'center',
                  borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none',
                  background: row.highlight ? 'rgba(94,106,210,0.06)' : 'transparent'
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: row.highlight ? 'var(--color-fg)' : 'var(--color-muted)'
                  }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg)' }}>{fmt(row.min)}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{fmt(row.max)}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{fmt(row.avg)}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 12, lineHeight: 1.5 }}>
              * Precios referenciales según datos de la CRE. Pueden variar por estación individual.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 28px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ width: 20, height: 20, background: 'rgba(94,106,210,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={11} color={ACCENT} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: ACCENT }}>
                Preguntas frecuentes
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.5px', marginBottom: 10 }}>
              Todo sobre el ahorro en gasolina
            </h2>
            <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.7 }}>
              Resolvemos las dudas más comunes sobre precios de gasolina, la CRE y cómo funciona GasMap.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '28px 28px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 26, background: ACCENT, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Fuel size={13} color="white" />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>GasMap</span>
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                Plataforma de precios de gasolina — México · 2026
              </p>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Política de Privacidad', to: '/privacidad' },
                { label: 'Términos y Condiciones', to: '/terminos' },
                { label: 'Contacto', to: '/contacto' },
                { label: 'Abrir App', to: '/register' },
              ].map(link => (
                <Link key={link.label} to={link.to} style={{ color: 'var(--color-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 11, lineHeight: 1.6 }}>
            Los precios son referenciales según datos de la CRE. GasMap no es responsable de variaciones en estaciones individuales.
          </p>
        </div>
      </footer>

    </div>
  )
}
