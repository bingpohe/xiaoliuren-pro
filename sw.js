/**
 * 小六壬 Pro - Service Worker
 *
 * 离线缓存策略：Cache-First (缓存优先) + Stale-While-Revalidate 变体
 *
 * 改进点：
 * - 版本号自动从 CONFIG 获取（需构建时注入）
 * - 更完善的错误处理和日志
 * - 支持 skipWaiting 和 clients.claim 快速激活
 * - 缓存清理更安全
 */

const CACHE_NAME = 'xiaoliuren-pro-v2.0.0'

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/LOGO68.png'
]

// ==================== Install 事件 ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_NAME)

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching assets')
        return cache.addAll(ASSETS).catch((error) => {
          console.warn('[SW] Pre-cache failed (partial):', error)
        })
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Install failed:', error)
      })
  )
})

// ==================== Activate 事件 ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker')

  event.waitUntil(
    caches.keys()
      .then((keys) => {
        const deletePromises = keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          })
        return Promise.all(deletePromises)
      })
      .then(() => self.clients.claim())
      .catch((error) => {
        console.error('[SW] Activate failed:', error)
      })
  )
})

// ==================== Fetch 事件 ====================
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 只处理 GET 请求
  if (request.method !== 'GET') return

  // 排除非同源请求和扩展名资源
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  event.respondWith(
    caches.match(request)
      .then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, clone))
                .catch((err) => console.warn('[SW] Cache put failed:', err))
            }
            return response
          })
          .catch((error) => {
            console.warn('[SW] Fetch failed, fallback to cache:', error)
            return cached
          })

        return cached || fetchPromise
      })
      .catch(() => {
        // 最终回退：如果缓存也没有，返回离线页面
        if (request.destination === 'document') {
          return caches.match('./index.html')
        }
        return new Response('Offline', { status: 503 })
      })
  )
})

// ==================== 消息处理 ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log('[SW] Service Worker script loaded:', CACHE_NAME)