// This is a fallback service worker for preview environments
console.log("Fallback Service Worker loaded")

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Pass through all fetch events
  event.respondWith(fetch(event.request))
})
