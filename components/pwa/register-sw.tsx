"use client"

import { useEffect } from "react"

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported in this browser")
      return
    }

    // Check if we're in a production environment
    const isProduction =
      window.location.hostname === "your-production-domain.com" || // Replace with your actual domain
      window.location.hostname === "ravehub.vercel.app" || // Add your Vercel production domain
      (!window.location.hostname.includes("localhost") && !window.location.hostname.includes("vusercontent.net")) // Skip Vercel preview URLs

    const registerServiceWorker = async () => {
      try {
        // Use the full SW in production, fallback in preview/development
        const swPath = isProduction ? "/sw.js" : "/sw-fallback.js"

        console.log(`Registering Service Worker from: ${swPath}`)

        const registration = await navigator.serviceWorker.register(swPath, {
          scope: "/",
        })

        console.log("Service Worker registered successfully:", registration.scope)

        // Only check for updates in production
        if (isProduction) {
          // Check for updates
          if (registration.waiting) {
            console.log("Service Worker update available")
          }

          // Listen for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("New version available")
                  // We could show a message to the user here
                }
              })
            }
          })
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }

    // Register when page is fully loaded
    if (document.readyState === "complete") {
      registerServiceWorker()
    } else {
      window.addEventListener("load", registerServiceWorker)
      return () => window.removeEventListener("load", registerServiceWorker)
    }
  }, [])

  return null
}
