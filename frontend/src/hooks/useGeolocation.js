import { useState, useEffect } from 'react'

// Centro de San Pedro Garza García como fallback
const DEFAULT_POSITION = { lat: 25.6510, lng: -100.3900 }

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible')
      setPosition(DEFAULT_POSITION)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      err => {
        setError(err.message)
        setPosition(DEFAULT_POSITION)
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }, [])

  return { position, error, loading }
}
