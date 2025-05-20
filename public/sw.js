// RaveHub Service Worker v3.0
const CACHE_VERSION = "v3"
const CACHE_NAMES = {
  static: `ravehub-static-${CACHE_VERSION}`,
  dynamic: `ravehub-dynamic-${CACHE_VERSION}`,
  images: `ravehub-images-${CACHE_VERSION}`,
  fonts: `ravehub-fonts-${CACHE_VERSION}`,
  api: `ravehub-api-${CACHE_VERSION}`,
  pages: `ravehub-pages-${CACHE_VERSION}`,
}

// Recursos críticos que deben cachearse inmediatamente
const CRITICAL_ASSETS = [
  "/",
  "/offline",
  "/images/logo-full.png",
  "/favicon-ravehub.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
]

// Recursos que se cachearán en segundo plano
const PRECACHE_ASSETS = [
  "/blog",
  "/eventos",
  "/tienda",
  "/galeria",
  "/contacto",
  "/images/placeholder-blog.jpg",
  "/images/gallery-hero.jpg",
  "/images/electronic-music-festival-night.png",
]

// Patrones de URL para diferentes estrategias de caché
const URL_PATTERNS = {
  images: [/\.(?:png|gif|jpg|jpeg|svg|webp)$/i, /\/images\//i, /\/icons\//i],
  fonts: [/\.(?:woff|woff2|ttf|otf|eot)$/i],
  api: [/\/api\//i],
  firebase: [/firestore\.googleapis\.com/i, /firebase/i, /google-analytics/i],
  blog: [/\/blog\//i],
  events: [/\/eventos\//i],
  store: [/\/tienda\//i],
  gallery: [/\/galeria\//i],
}

// Determinar la estrategia de caché según la URL
function getCacheStrategy(url) {
  const urlObj = new URL(url)

  // Ignorar consultas a Firebase o analytics
  if (URL_PATTERNS.firebase.some((pattern) => pattern.test(urlObj.href))) {
    return "network-only"
  }

  // Estrategia para imágenes
  if (URL_PATTERNS.images.some((pattern) => pattern.test(urlObj.href))) {
    return "cache-first"
  }

  // Estrategia para fuentes
  if (URL_PATTERNS.fonts.some((pattern) => pattern.test(urlObj.href))) {
    return "cache-first"
  }

  // Estrategia para API
  if (URL_PATTERNS.api.some((pattern) => pattern.test(urlObj.href))) {
    return "network-first"
  }

  // Estrategia para páginas de blog
  if (URL_PATTERNS.blog.some((pattern) => pattern.test(urlObj.href))) {
    return "stale-while-revalidate"
  }

  // Estrategia para páginas de eventos
  if (URL_PATTERNS.events.some((pattern) => pattern.test(urlObj.href))) {
    return "stale-while-revalidate"
  }

  // Estrategia para páginas de tienda
  if (URL_PATTERNS.store.some((pattern) => pattern.test(urlObj.href))) {
    return "stale-while-revalidate"
  }

  // Estrategia para páginas de galería
  if (URL_PATTERNS.gallery.some((pattern) => pattern.test(urlObj.href))) {
    return "stale-while-revalidate"
  }

  // Estrategia por defecto para navegación
  if (urlObj.origin === self.location.origin && urlObj.pathname !== "/sw.js") {
    return "network-first"
  }

  return "network-only"
}

// Limpiar cachés antiguas
async function cleanupCaches() {
  const cacheKeys = await caches.keys()
  const oldCacheKeys = cacheKeys.filter(
    (key) => !Object.values(CACHE_NAMES).includes(key) && key.startsWith("ravehub-"),
  )

  return Promise.all(
    oldCacheKeys.map((key) => {
      console.log(`[Service Worker] Eliminando caché antigua: ${key}`)
      return caches.delete(key)
    }),
  )
}

// Precachear recursos en segundo plano
async function precacheAssets() {
  const cache = await caches.open(CACHE_NAMES.static)

  // Cachear recursos en segundo plano
  return cache.addAll(PRECACHE_ASSETS).catch((error) => {
    console.error("[Service Worker] Error al precachear recursos:", error)
  })
}

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando nueva versión")

  event.waitUntil(
    (async () => {
      // Cachear recursos críticos inmediatamente
      const cache = await caches.open(CACHE_NAMES.static)
      await cache.addAll(CRITICAL_ASSETS)

      // Activar inmediatamente sin esperar a que se cierren las pestañas
      await self.skipWaiting()

      console.log("[Service Worker] Instalación completada")
    })(),
  )
})

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activando nueva versión")

  event.waitUntil(
    (async () => {
      // Limpiar cachés antiguas
      await cleanupCaches()

      // Reclamar clientes para que el nuevo SW tome el control inmediatamente
      await self.clients.claim()

      // Precachear recursos en segundo plano
      precacheAssets()

      console.log("[Service Worker] Activación completada")
    })(),
  )
})

// Estrategia: Cache First (para imágenes y assets estáticos)
async function cacheFirst(request) {
  const cacheKey = URL_PATTERNS.fonts.some((pattern) => pattern.test(request.url))
    ? CACHE_NAMES.fonts
    : CACHE_NAMES.images

  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheKey)
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
  const cacheKey = URL_PATTERNS.api.some((pattern) => pattern.test(request.url)) ? CACHE_NAMES.api : CACHE_NAMES.pages

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheKey)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log(`[Service Worker] Fallback a caché para: ${request.url}`)
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
  const cacheKey = CACHE_NAMES.dynamic
  const cachedResponse = await caches.match(request)

  // Iniciar la actualización en segundo plano
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(cacheKey)
        await cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch((error) => {
      console.error(`[Service Worker] Error fetching: ${request.url}`, error)
      // No lanzamos el error para que no interrumpa el flujo
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
  if (URL_PATTERNS.firebase.some((pattern) => pattern.test(event.request.url))) {
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
  console.log(`[Service Worker] Sync event: ${event.tag}`)

  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions())
  } else if (event.tag.startsWith("sync-")) {
    // Manejar otros tipos de sincronización
    const actionType = event.tag.replace("sync-", "")
    event.waitUntil(syncSpecificAction(actionType))
  }
})

// Función para sincronizar acciones pendientes
async function syncPendingActions() {
  console.log("[Service Worker] Sincronizando todas las acciones pendientes")

  try {
    // Obtener acciones pendientes del IndexedDB
    const pendingActions = await getPendingActionsFromDB()

    if (pendingActions.length === 0) {
      console.log("[Service Worker] No hay acciones pendientes para sincronizar")
      return
    }

    console.log(`[Service Worker] Sincronizando ${pendingActions.length} acciones pendientes`)

    // Procesar cada acción pendiente
    for (const action of pendingActions) {
      await processAction(action)
    }

    // Limpiar acciones sincronizadas
    await clearSyncedActionsFromDB(pendingActions.map((a) => a.id))

    console.log("[Service Worker] Sincronización completada")
  } catch (error) {
    console.error("[Service Worker] Error en sincronización:", error)
  }
}

// Función para sincronizar un tipo específico de acción
async function syncSpecificAction(actionType) {
  console.log(`[Service Worker] Sincronizando acciones de tipo: ${actionType}`)

  try {
    // Obtener acciones pendientes del IndexedDB filtradas por tipo
    const pendingActions = await getPendingActionsByType(actionType)

    if (pendingActions.length === 0) {
      console.log(`[Service Worker] No hay acciones de tipo ${actionType} pendientes`)
      return
    }

    // Procesar cada acción pendiente
    for (const action of pendingActions) {
      await processAction(action)
    }

    // Limpiar acciones sincronizadas
    await clearSyncedActionsFromDB(pendingActions.map((a) => a.id))

    console.log(`[Service Worker] Sincronización de ${actionType} completada`)
  } catch (error) {
    console.error(`[Service Worker] Error en sincronización de ${actionType}:`, error)
  }
}

// Función para procesar una acción específica
async function processAction(action) {
  console.log(`[Service Worker] Procesando acción: ${action.type}`, action.data)

  const apiUrl = self.location.origin

  switch (action.type) {
    case "ADD_TO_CART":
      // Sincronizar con el servidor
      await fetch(`${apiUrl}/api/cart/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action.data),
      })
      break

    case "SUBMIT_FORM":
      // Sincronizar envío de formulario
      await fetch(`${apiUrl}/api/forms/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action.data),
      })
      break

    case "POST_COMMENT":
      // Sincronizar comentario
      await fetch(`${apiUrl}/api/comments/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action.data),
      })
      break

    case "UPDATE_PROFILE":
      // Sincronizar actualización de perfil
      await fetch(`${apiUrl}/api/profile/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action.data),
      })
      break

    default:
      console.warn(`[Service Worker] Tipo de acción desconocido: ${action.type}`)
  }
}

// Funciones auxiliares para trabajar con IndexedDB
// Estas son simuladas ya que no tenemos acceso directo a IndexedDB en este contexto
async function getPendingActionsFromDB() {
  // En una implementación real, esto obtendría datos de IndexedDB
  return []
}

async function getPendingActionsByType(actionType) {
  // En una implementación real, esto filtraría por tipo
  return []
}

async function clearSyncedActionsFromDB(actionIds) {
  // En una implementación real, esto eliminaría las acciones sincronizadas
  return true
}

// Notificaciones push
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push recibido")

  if (!event.data) {
    console.log("[Service Worker] Push recibido pero sin datos")
    return
  }

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "Notificación de RaveHub",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/badge-icon.png",
      vibrate: data.vibrate || [100, 50, 100],
      data: {
        url: data.url || "/",
        actionData: data.actionData || {},
      },
      actions: data.actions || [],
    }

    event.waitUntil(self.registration.showNotification(data.title || "RaveHub", options))
  } catch (error) {
    console.error("[Service Worker] Error al procesar notificación push:", error)

    // Fallback para notificaciones que no son JSON
    const text = event.data.text()

    event.waitUntil(
      self.registration.showNotification("RaveHub", {
        body: text,
        icon: "/icons/icon-192x192.png",
      }),
    )
  }
})

// Acción al hacer clic en una notificación
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notificación clickeada")

  event.notification.close()

  // Extraer URL y datos de acción de la notificación
  const url = event.notification.data?.url || "/"
  const actionData = event.notification.data?.actionData || {}

  // Manejar acciones específicas de la notificación
  if (event.action) {
    console.log(`[Service Worker] Acción de notificación: ${event.action}`)
    // Aquí se pueden manejar acciones específicas
  }

  // Abrir o enfocar una ventana existente
  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })

      // Buscar una ventana abierta que coincida con la URL
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          await client.focus()
          return
        }
      }

      // Si no hay ventana abierta, abrir una nueva
      await self.clients.openWindow(url)
    })(),
  )
})

// Evento de mensaje para comunicación con la página
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Mensaje recibido:", event.data)

  if (event.data.action === "skipWaiting") {
    self.skipWaiting()
  }
})

// Evento de periodical sync (si está disponible)
if ("periodicsync" in self.registration) {
  self.addEventListener("periodicsync", (event) => {
    console.log(`[Service Worker] Periodic Sync: ${event.tag}`)

    if (event.tag === "update-content") {
      event.waitUntil(updateContent())
    }
  })
}

// Función para actualizar contenido periódicamente
async function updateContent() {
  console.log("[Service Worker] Actualizando contenido en segundo plano")

  try {
    // Actualizar contenido del blog
    const blogResponse = await fetch("/api/blog/latest")
    if (blogResponse.ok) {
      const blogData = await blogResponse.json()
      // Almacenar en caché para uso offline
      const cache = await caches.open(CACHE_NAMES.dynamic)
      await cache.put("/api/blog/latest", new Response(JSON.stringify(blogData)))
    }

    // Actualizar contenido de eventos
    const eventsResponse = await fetch("/api/events/upcoming")
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json()
      // Almacenar en caché para uso offline
      const cache = await caches.open(CACHE_NAMES.dynamic)
      await cache.put("/api/events/upcoming", new Response(JSON.stringify(eventsData)))
    }

    console.log("[Service Worker] Actualización de contenido completada")
  } catch (error) {
    console.error("[Service Worker] Error al actualizar contenido:", error)
  }
}
