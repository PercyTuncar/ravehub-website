"use client"

import { useEffect } from "react"

export function FontOptimization() {
  useEffect(() => {
    // Función para cargar fuentes de manera optimizada
    const loadFonts = () => {
      // Crear un link para precargar la fuente Inter
      const fontPreloadLink = document.createElement("link")
      fontPreloadLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      fontPreloadLink.rel = "preload"
      fontPreloadLink.as = "style"
      document.head.appendChild(fontPreloadLink)

      // Cargar la fuente después de un pequeño retraso
      setTimeout(() => {
        const fontLink = document.createElement("link")
        fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        fontLink.rel = "stylesheet"
        document.head.appendChild(fontLink)
      }, 100)
    }

    loadFonts()
  }, [])

  return null
}
