import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('gasonl_token')
      if (!token) return null
      const payload = parseJwt(token)
      if (!payload || payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('gasonl_token')
        localStorage.removeItem('gasonl_user')
        return null
      }
      const stored = localStorage.getItem('gasonl_user')
      return stored ? JSON.parse(stored) : payload
    } catch { return null }
  })

  const login = useCallback((token, userData) => {
    localStorage.setItem('gasonl_token', token)
    if (userData) localStorage.setItem('gasonl_user', JSON.stringify(userData))
    setUser(userData || parseJwt(token))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gasonl_token')
    localStorage.removeItem('gasonl_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
