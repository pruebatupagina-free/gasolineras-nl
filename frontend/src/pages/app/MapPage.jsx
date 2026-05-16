import { useState, useEffect, Component } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import client from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'

import BottomNav from '../../components/app/BottomNav'
import StationSheet from '../../components/app/StationSheet'
import HomeTab from '../../components/app/HomeTab'
import EstacionesTab from '../../components/app/EstacionesTab'
import MapTab from '../../components/app/MapTab'
import GarajeTab from '../../components/app/GarajeTab'
import HistorialTab from '../../components/app/HistorialTab'
import PerfilTab from '../../components/app/PerfilTab'
import OnboardingModal from '../../components/app/OnboardingModal'

class MapErrorBoundary extends Component {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('[MapPage error]', err) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#050506', color: 'white', padding: 20 }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>Error al cargar</div>
          <button onClick={() => this.setState({ hasError: false })} style={{ background: '#5E6AD2', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Reintentar</button>
        </div>
      )
    }
    return this.props.children
  }
}

function useNextSyncCountdown() {
  const [label, setLabel] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      const mtyMs = now.getTime() - now.getTimezoneOffset() * 60000 - 6 * 3600000
      const mty = new Date(mtyMs)
      const next = new Date(mty)
      next.setHours(18, 30, 0, 0)
      if (mty >= next) next.setDate(next.getDate() + 1)
      const diff = next - mty
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(`${h}h ${m}m`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [])
  return label
}

function MapPageInner() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { position: userLocation } = useGeolocation()

  const [activeTab, setActiveTab] = useState('home')
  const [combustible, setCombustible] = useState('magna')
  const [selectedStation, setSelectedStation] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const uid = user?._id
    if (!uid) return false
    return !localStorage.getItem(`onboardingCompleted_${uid}`)
  })

  const handleLogout = () => { logout(); navigate('/login') }
  const syncCountdown = useNextSyncCountdown()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { data: estaciones = [], isLoading } = useQuery({
    queryKey: ['estaciones', combustible, userLocation?.lat, userLocation?.lng],
    queryFn: () => {
      const endpoint = userLocation ? '/estaciones/nearby' : '/estaciones'
      const params = { combustible }
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; params.radio = 15 }
      return client.get(endpoint, { params }).then(r => {
        const list = r.data.estaciones || r.data || []
        return list.map(s => ({
          ...s,
          lat: s.lat ?? s.location?.coordinates?.[1],
          lng: s.lng ?? s.location?.coordinates?.[0],
        }))
      })
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  })

  const handleSelectStation = station => {
    setSelectedStation(station)
    if (station) setActiveTab('mapa')
  }

  const tabContent = {
    home: (
      <HomeTab
        user={user}
        estaciones={estaciones}
        combustible={combustible}
        userLocation={userLocation}
        syncCountdown={syncCountdown}
        isLoading={isLoading}
        onViewMap={() => setActiveTab('mapa')}
        onSelectStation={handleSelectStation}
      />
    ),
    estaciones: (
      <EstacionesTab
        estaciones={estaciones}
        combustible={combustible}
        onCombustibleChange={setCombustible}
        userLocation={userLocation}
        onSelectStation={s => setSelectedStation(s)}
      />
    ),
    mapa: (
      <MapTab
        estaciones={estaciones}
        combustible={combustible}
        onCombustibleChange={setCombustible}
        userLocation={userLocation}
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
        isLoading={isLoading}
      />
    ),
    garaje: <GarajeTab />,
    historial: <HistorialTab />,
    perfil: <PerfilTab />,
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div style={{ display: 'flex', height: '100dvh', background: 'var(--color-bg)' }}>
        {/* Sidebar */}
        <div className="desktop-panel" style={{ width: 340, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          {/* Sidebar header */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #5E6AD2, #4F5BC0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 }}>⛽</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>GasMap</div>
                {syncCountdown && <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Actualiza en {syncCountdown}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Fuel selector */}
              {['magna', 'premium', 'diesel'].map(c => {
                const colors = { magna: '#22C55E', premium: '#5E6AD2', diesel: '#F59E0B' }
                const labels = { magna: 'Mag', premium: 'Pre', diesel: 'Die' }
                return (
                  <button key={c} onClick={() => setCombustible(c)} style={{
                    padding: '4px 8px', borderRadius: 6, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    background: combustible === c ? colors[c] + '20' : 'transparent',
                    color: combustible === c ? colors[c] : 'var(--color-muted)',
                    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  }}>{labels[c]}</button>
                )
              })}
              {/* Logout */}
              <button onClick={handleLogout} title="Cerrar sesión" style={{
                width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--color-muted)', transition: 'all 0.15s', marginLeft: 2,
              }}>
                <LogOut size={13} />
              </button>
            </div>
          </div>

          {/* Sidebar content = HomeTab */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HomeTab
              user={user}
              estaciones={estaciones}
              combustible={combustible}
              userLocation={userLocation}
              syncCountdown={null}
              onViewMap={() => {}}
              onSelectStation={s => setSelectedStation(s)}
            />
          </div>
        </div>

        {/* Map full */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapTab
            estaciones={estaciones}
            combustible={combustible}
            onCombustibleChange={setCombustible}
            userLocation={userLocation}
            selectedStation={selectedStation}
            onSelectStation={setSelectedStation}
            isLoading={isLoading}
          />
        </div>
      </div>
    )
  }

  // ── Mobile layout ──────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {showOnboarding && (
        <OnboardingModal onComplete={() => {
          localStorage.setItem(`onboardingCompleted_${user._id}`, '1')
          setShowOnboarding(false)
        }} />
      )}

      {/* Tab content — map stays mounted, other tabs fade on enter */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0,
          opacity: activeTab === 'mapa' ? 1 : 0,
          pointerEvents: activeTab === 'mapa' ? 'auto' : 'none',
          transition: 'opacity 0.15s ease',
          zIndex: activeTab === 'mapa' ? 2 : 0,
        }}>
          {tabContent.mapa}
        </div>
        {activeTab !== 'mapa' && (
          <div key={activeTab} className="animate-tab-enter" style={{ height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
            {tabContent[activeTab]}
          </div>
        )}
      </div>

      {/* Station detail overlay for non-map tabs */}
      {selectedStation && activeTab !== 'mapa' && (
        <StationSheet
          station={selectedStation}
          combustible={combustible}
          userLocation={userLocation}
          onClose={() => setSelectedStation(null)}
        />
      )}

      {/* Bottom nav */}
      <BottomNav active={activeTab} onChange={tab => { setActiveTab(tab); if (tab !== 'mapa') setSelectedStation(null) }} />
    </div>
  )
}

export default function MapPage() {
  return (
    <MapErrorBoundary>
      <MapPageInner />
    </MapErrorBoundary>
  )
}
