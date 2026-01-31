// Service Worker - 提供离线支持和缓存管理

const CACHE_NAME = 'ar-studio-v1'
const STATIC_CACHE = 'ar-studio-static-v1'
const MODEL_CACHE = 'ar-studio-models-v1'
const IMAGE_CACHE = 'ar-studio-images-v1'

// 静态资源列表
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css'
]

// 模型资源列表（按需缓存）
const MODEL_ASSETS = [
  // 常用模型预缓存
  '/models/RaidenShogun.vrm',
  '/models/Zhongli.vrm',
  '/models/HuTao.vrm',
  '/models/KamisatoAyaka.vrm'
]

// 安装时预缓存关键资源
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker 安装中...')
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] 缓存静态资源')
        return cache.addAll(STATIC_ASSETS)
      }),
      // 缓存常用模型
      caches.open(MODEL_CACHE).then(cache => {
        console.log('[SW] 缓存常用模型')
        return cache.addAll(MODEL_ASSETS).catch(err => {
          console.warn('[SW] 部分模型缓存失败:', err)
        })
      })
    ])
    .then(() => {
      console.log('[SW] 预缓存完成')
      return self.skipWaiting()
    })
  )
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker 激活中...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本缓存
          if (cacheName !== STATIC_CACHE && 
              cacheName !== MODEL_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] 删除旧缓存:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] 激活完成')
      return self.clients.claim()
    })
  )
})

// 拦截请求并提供缓存
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return
  }
  
  // 策略1: 静态资源 - 缓存优先，网络回退
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  
  // 策略2: 模型文件 - 网络优先，缓存回退
  if (isModelFile(url)) {
    event.respondWith(networkFirst(request, MODEL_CACHE))
    return
  }
  
  // 策略3: 图片资源 - 缓存优先，网络更新
  if (isImageFile(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }
  
  // 策略4: API请求 - 网络优先
  if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, null))
    return
  }
  
  // 默认策略: 网络优先
  event.respondWith(networkFirst(request, null))
})

// 判断是否为静态资源
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.html', '.json', '.woff', '.woff2']
  return staticExtensions.some(ext => url.pathname.endsWith(ext))
}

// 判断是否为模型文件
function isModelFile(url) {
  return url.pathname.endsWith('.vrm') || 
         url.pathname.endsWith('.gltf') || 
         url.pathname.endsWith('.glb')
}

// 判断是否为图片文件
function isImageFile(url) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
  return imageExtensions.some(ext => url.pathname.endsWith(ext))
}

// 判断是否为API请求
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/')
}

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('离线模式 - 资源不可用', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// 网络优先策略
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
        console.log('[SW] 使用缓存:', request.url)
        return cached
      }
    }
    
    throw error
  }
}

// 陈旧时重新验证策略
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // 后台更新缓存
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => cached)
  
  // 立即返回缓存（如果有）
  return cached || fetchPromise
}

// 后台同步 - 用于离线操作同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-models') {
    event.waitUntil(syncModels())
  }
})

// 同步模型缓存
async function syncModels() {
  console.log('[SW] 同步模型缓存...')
  const cache = await caches.open(MODEL_CACHE)
  
  // 检查并更新模型缓存
  for (const modelUrl of MODEL_ASSETS) {
    try {
      const cached = await cache.match(modelUrl)
      if (!cached) {
        console.log('[SW] 缓存缺失的模型:', modelUrl)
        const response = await fetch(modelUrl)
        if (response.ok) {
          await cache.put(modelUrl, response)
        }
      }
    } catch (error) {
      console.error('[SW] 同步模型失败:', modelUrl, error)
    }
  }
}

// 推送通知支持
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'AR Studio 有新消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: '打开应用'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('AR Character Studio', options)
  )
})

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    )
  }
})

// 消息处理 - 与主页面通信
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size })
      })
      break
      
    case 'CLEAR_MODEL_CACHE':
      caches.delete(MODEL_CACHE).then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'CACHE_MODEL':
      cacheModel(payload.url).then(success => {
        event.ports[0].postMessage({ success })
      })
      break
  }
})

// 获取缓存大小
async function getCacheSize() {
  let totalSize = 0
  const cacheNames = [STATIC_CACHE, MODEL_CACHE, IMAGE_CACHE]
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return {
    bytes: totalSize,
    mb: (totalSize / 1024 / 1024).toFixed(2)
  }
}

// 缓存指定模型
async function cacheModel(url) {
  try {
    const cache = await caches.open(MODEL_CACHE)
    const response = await fetch(url)
    
    if (response.ok) {
      await cache.put(url, response)
      return true
    }
    return false
  } catch (error) {
    console.error('[SW] 缓存模型失败:', url, error)
    return false
  }
}

console.log('[SW] Service Worker 脚本已加载')
