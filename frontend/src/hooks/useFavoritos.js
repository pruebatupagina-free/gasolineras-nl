import { useState, useEffect, useCallback } from 'react'

const KEY = 'gasmap_favoritos'
const EVENT = 'gasmap:favoritos'

export function useFavoritos() {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
  })

  useEffect(() => {
    const sync = () => {
      try { setIds(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { setIds([]) }
    }
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const toggle = useCallback((id) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      localStorage.setItem(KEY, JSON.stringify(next))
      window.dispatchEvent(new Event(EVENT))
      return next
    })
  }, [])

  const isFav = useCallback((id) => ids.includes(id), [ids])

  return { ids, toggle, isFav }
}
