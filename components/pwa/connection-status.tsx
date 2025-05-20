"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { useOfflineSync } from "@/hooks/use-offline-sync"

export function ConnectionStatus() {
  const { isOnline, pendingActionsCount, syncNow } = useOfflineSync()
  const [showStatus, setShowStatus] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Mostrar el indicador cuando cambia el estado de conexión
  useEffect(() => {
    // No mostrar nada al cargar inicialmente si estamos online
    if (isOnline && !showStatus) return

    setShowStatus(true)
    setIsVisible(true)

    // Ocultar después de 5 segundos si estamos online
    let timeout: NodeJS.Timeout
    if (isOnline) {
      timeout = setTimeout(() => {
        setIsVisible(false)
        // Esperar a que termine la animación para quitar del DOM
        setTimeout(() => setShowStatus(false), 300)
      }, 5000)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [isOnline, showStatus])

  // No renderizar nada si no hay cambios de estado
  if (!showStatus) return null

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
          isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Conectado</span>
            {pendingActionsCount > 0 && (
              <button
                onClick={() => syncNow()}
                className="ml-2 text-xs bg-green-200 hover:bg-green-300 px-2 py-0.5 rounded-full transition-colors"
              >
                Sincronizar ({pendingActionsCount})
              </button>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Sin conexión</span>
            {pendingActionsCount > 0 && (
              <span className="ml-2 text-xs bg-red-200 px-2 py-0.5 rounded-full">
                {pendingActionsCount} pendiente{pendingActionsCount !== 1 ? "s" : ""}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
