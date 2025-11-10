/**
 * Service Worker for Svetlinki CRM
 * Provides offline support and caching strategies
 */

const CACHE_VERSION = 'v2'
const CACHE_NAME = `svetlinki-crm-${CACHE_VERSION}`
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `images-${CACHE_VERSION}`

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50
const MAX_IMAGE_CACHE_SIZE = 30

/**
 * Limit cache size
 */
const limitCacheSize = (cacheName, maxItems) => {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => limitCacheSize(cacheName, maxItems))
      }
    })
  })
}

/**
 * Install event - cache static resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old version caches
            return cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE &&
                   cacheName !== IMAGE_CACHE
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    }).then(() => {
      console.log('[SW] Service worker activated')
      return self.clients.claim()
    })
  )
})

/**
 * Fetch event - different strategies for different resources
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Skip Firebase API calls (always fresh)
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('googleapis.com')) {
    return
  }

  // Images: Cache first, then network
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request).then(networkResponse => {
          return caches.open(IMAGE_CACHE).then(cache => {
            cache.put(request, networkResponse.clone())
            limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE)
            return networkResponse
          })
        }).catch(() => {
          // Return placeholder if offline
          return new Response('Image not available offline', {
            headers: { 'Content-Type': 'text/plain' }
          })
        })
      })
    )
    return
  }

  // Static assets: Cache first
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request).then(networkResponse => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, networkResponse.clone())
            return networkResponse
          })
        })
      })
    )
    return
  }

  // HTML pages & API: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // Cache successful responses
        if (networkResponse.ok) {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, networkResponse.clone())
            limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE)
            return networkResponse
          })
        }
        return networkResponse
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If HTML page, return offline page
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/').then(response => {
              return response || new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html' }
              })
            })
          }

          // For other resources, return error
          return new Response('Network error', {
            status: 408,
            statusText: 'Request Timeout'
          })
        })
      })
  )
})

/**
 * Message event - allow clients to skip waiting
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  const options = {
    body: event.data ? event.data.text() : 'Ново известие от Светлинки',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'svetlinki-notification',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Отвори', icon: '/icon-192.png' },
      { action: 'close', title: 'Затвори', icon: '/icon-192.png' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('💡 Светлинки CRM', options)
  )
})

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
