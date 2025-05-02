const CACHE_NAME = "ravehub-cache-v2"
const STATIC_CACHE_NAME = "ravehub-static-v2"
const DYNAMIC_CACHE_NAME = "ravehub-dynamic-v2"
const IMAGE_CACHE_NAME = "ravehub-images-v2"

// Recursos estáticos que siempre se cachean
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/images/logo-full.png",
  "/images/placeholder-blog.jpg",
  "/images/gallery-hero.jpg",
  "/manifest.json",
  "/favicon-ravehub.ico",
  "/icons/icon-192x192.png",
]

// Patrones de URL para diferentes estrategias de caché
const IMAGE_PATTERNS = [/\.(?:png|gif|jpg|jpeg|svg|webp)$/, /\/images\//, /\/icons\//]

const API_PATTERNS = [/\/api\//]

const BLOG_PATTERNS = [/\/blog\//]

// Función para determinar la estrategia de caché según la URL
function getCacheStrategy(url) {
  const urlObj = new URL(url)

  // Ignorar consultas a Firebase o analytics
  if (
    urlObj.hostname.includes("firestore.googleapis.com") ||
    urlObj.hostname.includes("firebase") ||
    urlObj.hostname.includes("google-analytics") ||
    urlObj.hostname.includes("analytics")
  ) {
    return "network-only"
  }

  // Estrategia para imágenes
  if (IMAGE_PATTERNS.some((pattern) => pattern.test(url))) {
    return "cache-first"
  }

  // Estrategia para API
  if (API_PATTERNS.some((pattern) => pattern.test(url))) {
    return "network-first"
  }

  // Estrategia para páginas de blog
  if (BLOG_PATTERNS.some((pattern) => pattern.test(url))) {
    return "stale-while-revalidate"
  }

  // Estrategia por defecto
  return "network-first"
}

// Función para limpiar cachés antiguas
async function cleanupCaches() {
  const cacheNames = await caches.keys()
  const oldCacheNames = cacheNames.filter(
    (name) =>
      name !== CACHE_NAME && name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME && name !== IMAGE_CACHE_NAME,
  )

  return Promise.all(oldCacheNames.map((name) => caches.delete(name)))
}

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // Cachear recursos estáticos
      caches
        .open(STATIC_CACHE_NAME)
        .then((cache) => {
          console.log("Cacheando recursos estáticos")
          return cache.addAll(STATIC_ASSETS)
        }),
      // Activar inmediatamente sin esperar a que se cierren las pestañas
      self.skipWaiting(),
    ]),
  )
})

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Limpiar cachés antiguas
      cleanupCaches(),
      // Reclamar clientes para que el nuevo SW tome el control inmediatamente
      self.clients.claim(),
    ]),
  )
})

// Estrategia: Cache First (para imágenes y assets estáticos)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Fallback para imágenes
    if (request.destination === "image") {
      return caches.match("/images/placeholder-blog.jpg")
    }
    throw error
  }
}

// Estrategia: Network First (para API y contenido dinámico)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fallback para navegación
    if (request.mode === "navigate") {
      return caches.match("/offline")
    }

    throw error
  }
}

// Estrategia: Stale While Revalidate (para blog y contenido que puede actualizarse)
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request)

  // Iniciar la actualización en segundo plano
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME)
        await cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch((error) => {
      console.error("Error fetching resource:", error)
    })

  // Devolver la respuesta cacheada o esperar la de red
  return cachedResponse || fetchPromise
}

// Estrategia: Network Only (para analytics y Firebase)
async function networkOnly(request) {
  return fetch(request)
}

// Interceptar peticiones fetch
self.addEventListener("fetch", (event) => {
  // Ignorar peticiones a Firebase Storage o Firestore
  if (event.request.url.includes("firestore.googleapis.com") || event.request.url.includes("firebase")) {
    return
  }

  const strategy = getCacheStrategy(event.request.url)

  switch (strategy) {
    case "cache-first":
      event.respondWith(cacheFirst(event.request))
      break
    case "stale-while-revalidate":
      event.respondWith(staleWhileRevalidate(event.request))
      break
    case "network-only":
      event.respondWith(networkOnly(event.request))
      break
    case "network-first":
    default:
      event.respondWith(networkFirst(event.request))
      break
  }
})

// Sincronización en segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions())
  }
})

// Función para sincronizar acciones pendientes
async function syncPendingActions() {
  // Aquí iría la lógica para sincronizar datos cuando se recupera la conexión
  console.log("Sincronizando acciones pendientes")
}

// Notificaciones push
self.addEventListener("push", (event) => {
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-icon.png",
    data: {
      url: data.url,
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Acción al hacer clic en una notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
