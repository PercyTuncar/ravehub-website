"use client"

import { useEffect, useState } from "react"
import { SyncManager } from "@/lib/pwa/sync-manager"

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null)

  useEffect(() => {
    // Inicializar el SyncManager
    setSyncManager(SyncManager.getInstance())

    // Configurar listeners para el estado de la conexión
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Función para añadir una acción que se sincronizará cuando haya conexión
  const addPendingAction = (type: string, data: any) => {
    if (syncManager) {
      syncManager.addPendingAction(type, data)
    }
  }

  return {
    isOnline,
    addPendingAction,
  }
}
