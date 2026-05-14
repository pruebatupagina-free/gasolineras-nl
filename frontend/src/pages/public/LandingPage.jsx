import { Link } from 'react-router-dom'
import { Fuel, MapPin, TrendingDown, Navigation, Shield, Clock, ChevronRight, Star, Zap } from 'lucide-react'

const ACCENT = '#5E6AD2'
const ACCENT_HOVER = '#4F5BC0'
const ACCENT_GLOW = 'rgba(94,106,210,0.28)'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', color: 'var(--color-fg)', minHeight: '100dvh' }}>

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(5,5,6,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${ACCENT}, #4F5BC0)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${ACCENT_GLOW}` }}>
            <Fuel size={17} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>GasMap</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500, fontSize: 14, padding: '8px 16px', borderRadius: 10, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--color-fg)'} onMouseLeave={e => e.target.style.color = 'var(--color-muted)'}>
            Iniciar sesión
          </Link>
          <Link to="/register" style={{ background: ACCENT, color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 14, padding: '9px 20px', borderRadius: 10, transition: 'all 0.2s', boxShadow: `0 0 20px ${ACCENT_GLOW}` }}
            onMouseEnter={e => { e.target.style.background = ACCENT_HOVER; e.target.style.transform = 'translateY(-1px)' }} onMouseLeave={e => { e.target.style.background = ACCENT; e.target.style.transform = 'translateY(0)' }}>
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient blobs */}
        <div className="blob-1" style={{ position: 'absolute', top: '18%', right: '15%', width: 480, height: 480, background: `radial-gradient(circle, rgba(94,106,210,0.11) 0%, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />
        <div className="blob-2" style={{ position: 'absolute', bottom: '20%', left: '10%', width: 360, height: 360, background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div className="blob-3" style={{ position: 'absolute', top: '55%', left: '60%', width: 260, height: 260, background: 'radial-gradient(circle, rgba(94,106,210,0.06) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

        {/* Status badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(94,106,210,0.08)', border: `1px solid rgba(94,106,210,0.22)`, borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
          <span style={{ fontSize: 13, color: '#A5B4FC', fontWeight: 500 }}>Datos actualizados diariamente desde la CRE</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(38px, 6.5vw, 76px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-2px', maxWidth: 860, marginBottom: 24 }}>
          El precio real de la{' '}
          <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>gasolina</span>
          {' '}en México
        </h1>

        <p style={{ fontSize: 18, color: 'var(--color-muted)', maxWidth: 520, marginBottom: 44, lineHeight: 1.75, fontWeight: 400 }}>
          Encuentra la gasolinera más barata cerca de ti. Navega directo con animación estilo Waze. Piloto en Nuevo León.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: ACCENT, color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 14, boxShadow: `0 0 32px ${ACCENT_GLOW}`, transition: 'all 0.25s var(--easing)' }}
            onMouseEnter={e => { e.currentTarget.style.background = ACCENT_HOVER; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 40px ${ACCENT_GLOW}` }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 32px ${ACCENT_GLOW}` }}>
            <Fuel size={17} /> Ver precios ahora
          </Link>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'transparent', color: 'var(--color-fg)', textDecoration: 'none', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 14, border: '1px solid var(--color-border-strong)', transition: 'all 0.25s var(--easing)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}>
            Ya tengo cuenta <ChevronRight size={15} />
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, marginTop: 72, flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 40 }}>
          {[
            { value: '46+', label: 'Gasolineras en piloto' },
            { value: 'Diario', label: 'Actualización CRE' },
            { value: '$0', label: 'Siempre gratis' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '0 40px', borderRight: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800, color: 'var(--color-fg)' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '96px 24px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(94,106,210,0.08)', border: `1px solid rgba(94,106,210,0.2)`, borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
            <Zap size={12} color={ACCENT} />
            <span style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Funciones</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 16 }}>
            Todo lo que necesitas para ahorrar
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: 16, maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
            Diseñado para conductores de México. Simple, rápido y gratuito.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
          {[
            { icon: TrendingDown, color: '#22C55E', title: 'Precio más bajo primero', desc: 'Las estaciones se ordenan por precio según tu ubicación. La más barata siempre aparece al tope.' },
            { icon: Navigation, color: ACCENT, title: 'Navegación estilo Waze', desc: 'Al seleccionar una gasolinera, ves la ruta animada en el mapa antes de abrir Google Maps.' },
            { icon: MapPin, color: '#F59E0B', title: 'Mapa interactivo', desc: 'Pines de colores: verde = barato, amarillo = promedio, rojo = caro. Todo de un vistazo.' },
            { icon: Clock, color: '#A78BFA', title: 'Datos del día', desc: 'Sincronizamos con la CRE todos los días a las 18:30 hrs. Siempre el precio de hoy.' },
            { icon: Shield, color: '#FB7185', title: 'Fuente oficial', desc: 'Precios tomados directamente de la Comisión Reguladora de Energía (CRE) del gobierno mexicano.' },
            { icon: Star, color: '#F97316', title: 'Piloto en Nuevo León', desc: 'Iniciamos en San Pedro Garza García y Santa Catarina. Próximamente en más ciudades.' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 28,
              cursor: 'default',
              transition: 'transform 0.25s var(--easing), border-color 0.25s, background 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(94,106,210,0.3)'; e.currentTarget.style.background = 'rgba(94,106,210,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, marginBottom: 10, color: 'var(--color-fg)' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section style={{ padding: '96px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(94,106,210,0.08)', border: `1px solid rgba(94,106,210,0.2)`, borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
            <Navigation size={12} color={ACCENT} />
            <span style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Cómo funciona</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 56 }}>
            En 3 pasos sencillos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Permite tu ubicación', desc: 'Al entrar al mapa, GasMap detecta tu posición y muestra las gasolineras más cercanas.' },
              { n: '02', title: 'Ve el precio más bajo', desc: 'La lista se ordena automáticamente: la gasolinera más barata aparece al inicio, con su precio de hoy.' },
              { n: '03', title: 'Selecciona y navega', desc: 'Toca la gasolinera más conveniente. Verás la ruta animada y un botón para abrir Google Maps.' },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: 28, textAlign: 'left', padding: '36px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 44, fontWeight: 800, color: `rgba(94,106,210,0.22)`, minWidth: 64, lineHeight: 1, letterSpacing: '-2px' }}>{step.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 19, marginBottom: 10, color: 'var(--color-fg)' }}>{step.title}</h3>
                  <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.75 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '110px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 560, height: 560, background: `radial-gradient(circle, rgba(94,106,210,0.09) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 800, letterSpacing: '-1.2px', marginBottom: 16, maxWidth: 560, margin: '0 auto 16px' }}>
            Empieza a ahorrar hoy mismo
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: 16, marginBottom: 40, fontWeight: 400 }}>Gratis, sin anuncios, sin complicaciones.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: ACCENT, color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '16px 36px', borderRadius: 14, boxShadow: `0 0 40px ${ACCENT_GLOW}`, transition: 'all 0.25s var(--easing)' }}
            onMouseEnter={e => { e.currentTarget.style.background = ACCENT_HOVER; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 48px ${ACCENT_GLOW}` }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}` }}>
            <Fuel size={17} /> Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '28px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: `linear-gradient(135deg, ${ACCENT}, #4F5BC0)`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={13} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>GasMap</span>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 12, fontWeight: 500 }}>
          Precios vía CRE — Datos oficiales · Nuevo León, México
        </p>
        <p style={{ color: 'var(--color-muted)', fontSize: 12, fontWeight: 500 }}>© 2026 GasMap</p>
      </footer>
    </div>
  )
}
