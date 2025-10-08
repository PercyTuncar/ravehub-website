"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detectar si es iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Verificar si ya está instalada
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches

    // No mostrar el prompt si ya está instalada
    if (isStandalone) return

    // Guardar el evento beforeinstallprompt para usarlo después
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Verificar si el usuario ha cerrado el prompt antes
      const hasClosedPrompt = localStorage.getItem("installPromptClosed")
      const lastPromptTime = localStorage.getItem("lastPromptTime")

      // Si no lo ha cerrado o han pasado más de 7 días, mostrar el prompt
      if (
        !hasClosedPrompt ||
        (lastPromptTime && Date.now() - Number.parseInt(lastPromptTime) > 7 * 24 * 60 * 60 * 1000)
      ) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000) // Mostrar después de 3 segundos
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Mostrar instrucciones para iOS después de 3 segundos si no ha cerrado el prompt antes
    if (isIOSDevice) {
      const hasClosedPrompt = localStorage.getItem("installPromptClosed")
      const lastPromptTime = localStorage.getItem("lastPromptTime")

      if (
        !hasClosedPrompt ||
        (lastPromptTime && Date.now() - Number.parseInt(lastPromptTime) > 7 * 24 * 60 * 60 * 1000)
      ) {
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Mostrar el prompt de instalación
    deferredPrompt.prompt()

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice

    // Limpiar el prompt guardado
    setDeferredPrompt(null)
    setShowPrompt(false)

    // Registrar la decisión del usuario
    if (outcome === "accepted") {
      console.log("Usuario aceptó instalar la app")
    } else {
      console.log("Usuario rechazó instalar la app")
      // Guardar que el usuario cerró el prompt
      localStorage.setItem("installPromptClosed", "true")
      localStorage.setItem("lastPromptTime", Date.now().toString())
    }
  }

  const closePrompt = () => {
    setShowPrompt(false)
    // Guardar que el usuario cerró el prompt
    localStorage.setItem("installPromptClosed", "true")
    localStorage.setItem("lastPromptTime", Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg animate-slide-up">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block bg-primary/10 p-2 rounded-full">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Instala Ravehub</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isIOS
                ? "Añade esta app a tu pantalla de inicio para acceder más rápido"
                : "Instala nuestra app para una mejor experiencia"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isIOS ? (
            <Button variant="default" size="sm" onClick={closePrompt}>
              Entendido
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleInstall}>
              Instalar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={closePrompt}>
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
