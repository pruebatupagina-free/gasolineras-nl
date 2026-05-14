import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem('gasonl_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gasonl_token')
      localStorage.removeItem('gasonl_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/gasolineras-nl/login'
      }
    }
    return Promise.reject(err)
  }
)

export default client
