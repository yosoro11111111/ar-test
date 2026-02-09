const CACHE_VERSION = 'v7-20260209-2'
const STATIC_CACHE = `ar-studio-static-${CACHE_VERSION}`
const MODEL_CACHE = `ar-studio-models-${CACHE_VERSION}`
const IMAGE_CACHE = `ar-studio-images-${CACHE_VERSION}`

// Static assets list - 使用相对路径支持子目录部署
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets.json'
]

// Model assets list - 动态从 assets.json 加载
let MODEL_ASSETS = []

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing... Version:', CACHE_VERSION)
  
  event.waitUntil(
    (async () => {
      // 首先缓存静态资源
      const staticCache = await caches.open(STATIC_CACHE)
      console.log('[SW] Caching static assets')
      await staticCache.addAll(STATIC_ASSETS)
      
      // 尝试从 assets.json 加载模型列表
      try {
        const assetsResponse = await fetch('./assets.json')
        if (assetsResponse.ok) {
          const assets = await assetsResponse.json()
          MODEL_ASSETS = extractModelPaths(assets)
          console.log('[SW] Loaded model list from assets.json:', MODEL_ASSETS.length, 'models')
          
          // 缓存模型文件
          if (MODEL_ASSETS.length > 0) {
            const modelCache = await caches.open(MODEL_CACHE)
            console.log('[SW] Caching models')
            await Promise.all(
              MODEL_ASSETS.map(async (modelPath) => {
                try {
                  await modelCache.add(modelPath)
                } catch (err) {
                  console.warn('[SW] Failed to cache model:', modelPath, err)
                }
              })
            )
          }
        }
      } catch (err) {
        console.warn('[SW] Failed to load assets.json:', err)
      }
      
      console.log('[SW] Pre-cache complete')
      await self.skipWaiting()
    })()
  )
})

// 从 assets.json 提取模型路径
function extractModelPaths(assets) {
  const paths = []
  if (!assets.categories) return paths
  
  // 提取角色模型
  if (assets.categories.characters?.subCategories) {
    Object.values(assets.categories.characters.subCategories).forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (item.path) {
            // 转换为相对路径
            const relativePath = item.path.startsWith('/') ? item.path.substring(1) : item.path
            paths.push(relativePath)
          }
        })
      }
    })
  }
  
  // 提取道具模型
  if (assets.categories.props?.subCategories) {
    Object.values(assets.categories.props.subCategories).forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (item.path) {
            const relativePath = item.path.startsWith('/') ? item.path.substring(1) : item.path
            paths.push(relativePath)
          }
        })
      }
    })
  }
  
  // 提取场景模型
  if (assets.categories.scenes?.subCategories) {
    Object.values(assets.categories.scenes.subCategories).forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (item.path) {
            const relativePath = item.path.startsWith('/') ? item.path.substring(1) : item.path
            paths.push(relativePath)
          }
        })
      }
    })
  }
  
  // 提取动作文件
  if (assets.categories.motions?.subCategories) {
    Object.values(assets.categories.motions.subCategories).forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (item.path) {
            const relativePath = item.path.startsWith('/') ? item.path.substring(1) : item.path
            paths.push(relativePath)
          }
        })
      }
    })
  }
  
  return paths
}

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
