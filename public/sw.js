const CACHE_VERSION = 'v5-20250206-1'
const STATIC_CACHE = `ar-studio-static-${CACHE_VERSION}`
const MODEL_CACHE = `ar-studio-models-${CACHE_VERSION}`
const IMAGE_CACHE = `ar-studio-images-${CACHE_VERSION}`

// Static assets list
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css'
]

// Model assets list
const MODEL_ASSETS = [
  '/models/RaidenShogun.vrm',
  '/models/Zhongli.vrm',
  '/models/HuTao.vrm',
  '/models/KamisatoAyaka.vrm'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing... Version:', CACHE_VERSION)
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(MODEL_CACHE).then(cache => {
        console.log('[SW] Caching models')
        return cache.addAll(MODEL_ASSETS).catch(err => {
          console.warn('[SW] Some models failed to cache:', err)
        })
      })
    ])
    .then(() => {
      console.log('[SW] Pre-cache complete')
      return self.skipWaiting()
    })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Activation complete')
      return self.clients.claim()
    })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  if (request.method !== 'GET') {
    return
  }
  
  // Static assets - network first with cache update
  if (isStaticAsset(url)) {
    event.respondWith(networkFirstWithCacheUpdate(request, STATIC_CACHE))
    return
  }
  
  // Model files - network first
  if (isModelFile(url)) {
    event.respondWith(networkFirst(request, MODEL_CACHE))
    return
  }
  
  // Images - stale while revalidate
  if (isImageFile(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }
  
  // Default - network first
  event.respondWith(networkFirst(request, null))
})

// Helper functions
function isStaticAsset(url) {
  const exts = ['.js', '.css', '.html', '.json', '.woff', '.woff2']
  return exts.some(ext => url.pathname.endsWith(ext))
}

function isModelFile(url) {
  return url.pathname.endsWith('.vrm') || 
         url.pathname.endsWith('.gltf') || 
         url.pathname.endsWith('.glb')
}

function isImageFile(url) {
  const exts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
  return exts.some(ext => url.pathname.endsWith(ext))
}

// Network first with cache update
async function networkFirstWithCacheUpdate(request, cacheName) {
  try {
    const fetchRequest = new Request(request.url + '?_=' + Date.now(), {
      method: request.method,
      headers: request.headers,
      mode: request.mode,
      credentials: request.credentials,
      redirect: request.redirect
    })
    
    const networkResponse = await fetch(fetchRequest)
    
    if (networkResponse.ok && cacheName) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    if (cacheName) {
      const cache = await caches.open(cacheName)
      const cached = await cache.match(request)
      if (cached) {
        console.log('[SW] Using cache:', request.url)
        return cached
      }
    }
    throw error
  }
}

// Network first
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok && cacheName) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    if (cacheName) {
      const cache = await caches.open(cacheName)
      const cached = await cache.match(request)
      if (cached) {
        return cached
      }
    }
    throw error
  }
}

// Stale while revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => cached)
  
  return cached || fetchPromise
}

// Message handling
self.addEventListener('message', (event) => {
  const { type } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CLEAR_ALL_CACHES':
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)))
      })
      break
  }
})

console.log('[SW] Service Worker loaded. Version:', CACHE_VERSION)
