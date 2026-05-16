const CACHE = 'gasmap-v2'
const BASE = '/gasolineras-nl'

const PRECACHE = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/favicon.svg`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // Skip API calls — always network
  if (url.pathname.startsWith('/api/')) return

  // Skip external resources (fonts, tiles, OSRM, etc.)
  if (url.origin !== self.location.origin) return

  // Navigation requests → network first, fall back to cached index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match(`${BASE}/index.html`))
    )
    return
  }

  // Hashed assets (JS/CSS with content hash in filename) → cache first
  if (/\/assets\/.+\.[a-f0-9]{8}\.(js|css)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            caches.open(CACHE).then(c => c.put(request, response.clone()))
          }
          return response
        })
      })
    )
    return
  }

  // Everything else → stale-while-revalidate
  e.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response.ok) {
          caches.open(CACHE).then(c => c.put(request, response.clone()))
        }
        return response
      })
      return cached || networkFetch
    })
  )
})

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'GasMap', {
      body: data.body || '',
      icon: `${BASE}/icon-192.png`,
      badge: `${BASE}/icon-192.png`,
      data: { url: data.url || `${BASE}/` },
      tag: 'gasmap-alerta',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || `${BASE}/`
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/gasolineras-nl') && 'focus' in c) return c.focus()
      }
      return clients.openWindow(url)
    })
  )
})
