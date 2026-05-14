import { Link } from 'react-router-dom'
import { Fuel, MapPin, TrendingDown, Navigation, Shield, Clock, ChevronRight, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', color: 'var(--color-fg)', minHeight: '100dvh' }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--color-border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3B82F6, #1d4ed8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>GasoNL</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--color-muted)', textDecoration: 'none', fontWeight: 500, fontSize: 14, padding: '8px 16px', borderRadius: 8, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = 'var(--color-muted)'}>
            Iniciar sesión
          </Link>
          <Link to="/register" style={{ background: 'var(--color-accent)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 14, padding: '8px 20px', borderRadius: 8, transition: 'background 0.2s' }}
            onMouseEnter={e => e.target.style.background = 'var(--color-accent-hover)'} onMouseLeave={e => e.target.style.background = 'var(--color-accent)'}>
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Fondo glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
          <span style={{ fontSize: 13, color: '#93C5FD', fontWeight: 500 }}>Datos actualizados diariamente desde la CRE</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', maxWidth: 860, marginBottom: 24 }}>
          El precio real de la{' '}
          <span style={{ background: 'linear-gradient(135deg, #3B82F6, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>gasolina</span>
          {' '}en Nuevo León
        </h1>

        <p style={{ fontSize: 18, color: 'var(--color-muted)', maxWidth: 540, marginBottom: 40, lineHeight: 1.7 }}>
          Encuentra la gasolinera más barata cerca de ti en San Pedro y Santa Catarina. Navega directo con animación estilo Waze.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-accent)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '14px 28px', borderRadius: 12, boxShadow: '0 0 24px rgba(59,130,246,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <Fuel size={18} /> Ver precios ahora
          </Link>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--color-fg)', textDecoration: 'none', fontWeight: 600, fontSize: 16, padding: '14px 28px', borderRadius: 12, border: '1px solid var(--color-border-strong)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'var(--color-muted)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}>
            Ya tengo cuenta <ChevronRight size={16} />
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { value: '46+', label: 'Gasolineras' },
            { value: 'Diario', label: 'Actualización CRE' },
            { value: '$0', label: 'Costo de uso' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, color: 'white' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>
            Todo lo que necesitas para ahorrar en gasolina
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
            Diseñado para los conductores de Nuevo León. Simple, rápido y gratuito.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[
            { icon: TrendingDown, color: '#22C55E', title: 'Precio más bajo primero', desc: 'Las estaciones se ordenan por precio según tu ubicación. La más barata siempre aparece al tope.' },
            { icon: Navigation, color: '#3B82F6', title: 'Navegación estilo Waze', desc: 'Al seleccionar una gasolinera, ves la ruta animada en el mapa antes de abrir Google Maps.' },
            { icon: MapPin, color: '#F59E0B', title: 'Mapa interactivo', desc: 'Pines de colores en el mapa: verde = barato, amarillo = promedio, rojo = caro. Todo de un vistazo.' },
            { icon: Clock, color: '#A78BFA', title: 'Datos del día', desc: 'Sincronizamos con la CRE todos los días a las 18:30 hrs. Siempre el precio de hoy.' },
            { icon: Shield, color: '#FB7185', title: 'Fuente oficial', desc: 'Precios tomados directamente de la Comisión Reguladora de Energía (CRE) del gobierno mexicano.' },
            { icon: Star, color: '#F97316', title: 'San Pedro y Santa Catarina', desc: 'Enfoque 100% en los municipios de San Pedro Garza García y Santa Catarina, Nuevo León.' },
          ].map(f => (
            <div key={f.title} className="glass-card" style={{ padding: 28, transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ padding: '80px 24px', background: 'rgba(30,41,59,0.3)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 56 }}>
            ¿Cómo funciona?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Permite tu ubicación', desc: 'Al entrar al mapa, GasoNL detecta tu posición para mostrarte las gasolineras más cercanas.' },
              { n: '02', title: 'Ve el precio más bajo', desc: 'La lista se ordena automáticamente: la gasolinera más barata aparece al inicio, con su precio de hoy.' },
              { n: '03', title: 'Selecciona y navega', desc: 'Toca la gasolinera más conveniente. Verás la ruta animada en el mapa y un botón para abrir Google Maps.' },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: 28, textAlign: 'left', padding: '32px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 42, fontWeight: 800, color: 'rgba(59,130,246,0.25)', minWidth: 60, lineHeight: 1 }}>{step.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: 'var(--color-muted)', fontSize: 15, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16, maxWidth: 600, margin: '0 auto 16px' }}>
          Empieza a ahorrar hoy mismo
        </h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 17, marginBottom: 36 }}>Gratis, sin anuncios, sin complicaciones.</p>
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-accent)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '16px 36px', borderRadius: 12, boxShadow: '0 0 32px rgba(59,130,246,0.4)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)' }}>
          <Fuel size={18} /> Crear cuenta gratis
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #3B82F6, #1d4ed8)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fuel size={13} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>GasoNL</span>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>
          Precios vía CRE — Datos oficiales del gobierno de México · Nuevo León
        </p>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>© 2026 GasoNL</p>
      </footer>
    </div>
  )
}
