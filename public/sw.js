/* StockFlow POS service worker — app-shell cache + offline fallback */
const CACHE = 'stockflow-shell-v1'
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/vite.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache API — online sync handles mutations
  if (url.pathname.startsWith('/api')) return

  // Navigation: network first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets: cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (!res.ok || request.url.startsWith('chrome-extension')) return res
        const copy = res.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
        return res
      }).catch(() => cached)
    })
  )
})
