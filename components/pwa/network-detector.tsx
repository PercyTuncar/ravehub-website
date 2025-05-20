"use client"

import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

export function NetworkDetector() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [connectionType, setConnectionType] = useState<string>("unknown")
  const [connectionQuality, setConnectionQuality] = useState<string>("unknown")

  useEffect(() => {
    // Función para actualizar el estado de conexión
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      if (online) {
        toast({
          title: "Conexión restablecida",
          description: "Tu conexión a internet ha sido restablecida.",
          variant: "default",
          duration: 3000,
        })
      } else {
        toast({
          title: "Sin conexión",
          description: "Has perdido la conexión a internet. Algunas funciones pueden no estar disponibles.",
          variant: "destructive",
          duration: 5000,
        })
      }
    }

    // Función para detectar el tipo y calidad de conexión
    const updateConnectionInfo = () => {
      if ("connection" in navigator) {
        // @ts-ignore - TypeScript no reconoce navigator.connection
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

        if (connection) {
          const type = connection.type || "unknown"
          setConnectionType(type)

          // Determinar calidad de conexión
          let quality = "unknown"

          if (connection.effectiveType) {
            switch (connection.effectiveType) {
              case "slow-2g":
              case "2g":
                quality = "poor"
                break
              case "3g":
                quality = "fair"
                break
              case "4g":
                quality = "good"
                break
              default:
                quality = "unknown"
            }
          }

          setConnectionQuality(quality)

          // Si la conexión es de baja calidad, mostrar sugerencia
          if (quality === "poor" && isOnline) {
            toast({
              title: "Conexión lenta detectada",
              description: "Tu conexión a internet es lenta. La experiencia puede verse afectada.",
              duration: 5000,
            })
          }
        }
      }
    }

    // Configurar listeners para el estado de la conexión
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Configurar listener para cambios en la conexión
    if ("connection" in navigator) {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection) {
        connection.addEventListener("change", updateConnectionInfo)
      }
    }

    // Ejecutar al montar para obtener el estado inicial
    updateOnlineStatus()
    updateConnectionInfo()

    // Limpiar listeners al desmontar
    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)

      if ("connection" in navigator) {
        // @ts-ignore
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
        if (connection) {
          connection.removeEventListener("change", updateConnectionInfo)
        }
      }
    }
  }, [isOnline])

  // Este componente no renderiza nada visible, solo maneja la detección
  return null
}
