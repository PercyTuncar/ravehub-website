"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Verificar actualizaciones del Service Worker
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setShowUpdatePrompt(true)
      })
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  if (!showUpdatePrompt) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-primary text-primary-foreground animate-slide-down">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm font-medium">¡Nueva versión disponible! Actualiza para obtener las últimas mejoras.</p>
        <Button variant="secondary" size="sm" onClick={handleUpdate} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
