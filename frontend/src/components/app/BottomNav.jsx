import { Home, List, Map, Car, History, User } from 'lucide-react'

const ITEMS = [
  { id: 'home',       icon: Home,    label: 'Inicio'     },
  { id: 'estaciones', icon: List,    label: 'Estaciones' },
  { id: 'mapa',       icon: Map,     label: 'Mapa'       },
  { id: 'garaje',     icon: Car,     label: 'Garaje'     },
  { id: 'historial',  icon: History, label: 'Historial'  },
  { id: 'perfil',     icon: User,    label: 'Perfil'     },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
      background: 'rgba(5,5,6,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      height: 62, paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="bottom-nav">
      {ITEMS.map(item => <NavBtn key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />)}
    </nav>
  )
}

function NavBtn({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '4px 6px', flex: 1, position: 'relative',
      color: active ? '#5E6AD2' : '#8A8F98',
      transition: 'color 0.2s',
    }}>
      {active && (
        <span style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 24, height: 2, borderRadius: '0 0 2px 2px', background: '#5E6AD2',
        }} />
      )}
      <Icon size={18} strokeWidth={active ? 2.5 : 1.8} style={{ transition: 'transform 0.2s', transform: active ? 'scale(1.1)' : 'scale(1)' }} />
      <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, fontFamily: 'var(--font-body)', letterSpacing: 0.1, transition: 'font-weight 0.2s' }}>
        {item.label}
      </span>
    </button>
  )
}
