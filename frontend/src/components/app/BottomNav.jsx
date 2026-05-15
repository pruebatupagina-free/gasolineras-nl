import { Home, Map, History, User, Target } from 'lucide-react'

const ITEMS = [
  { id: 'home',     icon: Home,    label: 'Inicio' },
  { id: 'mapa',     icon: Map,     label: 'Mapa' },
  { id: 'historial',icon: History, label: 'Historial' },
  { id: 'perfil',   icon: User,    label: 'Perfil' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
      background: 'rgba(5,5,6,0.96)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      height: 64, paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="bottom-nav">

      {ITEMS.slice(0, 2).map(item => <NavBtn key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />)}

      {/* FAB */}
      <button onClick={() => onChange('mapa')} className="pressable animate-bounce-in" style={{
        width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #5E6AD2 0%, #4F5BC0 100%)',
        border: '2px solid rgba(255,255,255,0.15)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 24px rgba(94,106,210,0.55)',
        transform: 'translateY(-10px)',
        transition: 'box-shadow 0.2s',
      }}>
        <Target size={22} color="white" strokeWidth={2} />
      </button>

      {ITEMS.slice(2).map(item => <NavBtn key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />)}
    </nav>
  )
}

function NavBtn({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '6px 18px', minWidth: 60, position: 'relative',
      color: active ? '#5E6AD2' : '#8A8F98',
      transition: 'color 0.2s',
    }}>
      {active && (
        <span style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 28, height: 3, borderRadius: '0 0 3px 3px', background: '#5E6AD2',
        }} />
      )}
      <Icon size={20} strokeWidth={active ? 2.5 : 1.8} style={{ transition: 'transform 0.2s', transform: active ? 'scale(1.1)' : 'scale(1)' }} />
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: 'var(--font-body)', letterSpacing: 0.2, transition: 'font-weight 0.2s' }}>
        {item.label}
      </span>
    </button>
  )
}
