"use client"

import { useEffect, useState, useCallback } from "react"
import { SyncManager, type ActionType, SyncPriority } from "@/lib/pwa/sync-manager"

interface OfflineSyncState {
  isOnline: boolean
  isSyncing: boolean
  pendingActionsCount: number
  lastSyncTime: number | null
}

export function useOfflineSync() {
  const [syncManager, setSyncManager] = useState<SyncManager | null>(null)
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingActionsCount: 0,
    lastSyncTime: null,
  })

  // Inicializar el SyncManager
  useEffect(() => {
    setSyncManager(SyncManager.getInstance())

    // Actualizar el contador de acciones pendientes periódicamente
    const interval = setInterval(async () => {
      if (syncManager) {
        try {
          const count = await syncManager.getPendingActionsCount()
          setState((prev) => ({
            ...prev,
            pendingActionsCount: count,
          }))
        } catch (error) {
          console.error("Error al obtener el contador de acciones pendientes:", error)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [syncManager])

  // Configurar listeners para el estado de la conexión
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }))

      // Mostrar notificación de reconexión
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Ravehub", {
          body: "¡Conexión restablecida! Sincronizando datos...",
          icon: "/icons/icon-192x192.png",
        })
      }
    }

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }))

      // Mostrar notificación de desconexión
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Ravehub", {
          body: "Conexión perdida. Tus acciones se guardarán y sincronizarán cuando vuelvas a estar en línea.",
          icon: "/icons/icon-192x192.png",
        })
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Función para añadir una acción que se sincronizará cuando haya conexión
  const addPendingAction = useCallback(
    async (type: ActionType, data: any, priority: SyncPriority = SyncPriority.MEDIUM) => {
      if (syncManager) {
        try {
          const actionId = await syncManager.addPendingAction(type, data, priority)

          // Actualizar el contador
          const count = await syncManager.getPendingActionsCount()
          setState((prev) => ({
            ...prev,
            pendingActionsCount: count,
          }))

          return actionId
        } catch (error) {
          console.error(`Error al añadir acción pendiente (${type}):`, error)
          throw error
        }
      }
      return null
    },
    [syncManager],
  )

  // Función para forzar la sincronización manualmente
  const syncNow = useCallback(async () => {
    if (syncManager && state.isOnline && !state.isSyncing) {
      setState((prev) => ({ ...prev, isSyncing: true }))

      try {
        await syncManager.syncPendingActions()

        // Actualizar el contador y la hora de última sincronización
        const count = await syncManager.getPendingActionsCount()
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          pendingActionsCount: count,
          lastSyncTime: Date.now(),
        }))

        return true
      } catch (error) {
        console.error("Error al sincronizar manualmente:", error)
        setState((prev) => ({ ...prev, isSyncing: false }))
        return false
      }
    }
    return false
  }, [syncManager, state.isOnline, state.isSyncing])

  // Función para obtener todas las acciones pendientes
  const getPendingActions = useCallback(async () => {
    if (syncManager) {
      try {
        return await syncManager.getPendingActions()
      } catch (error) {
        console.error("Error al obtener acciones pendientes:", error)
        return []
      }
    }
    return []
  }, [syncManager])

  // Función para limpiar todas las acciones pendientes
  const clearAllPendingActions = useCallback(async () => {
    if (syncManager) {
      try {
        await syncManager.clearAllPendingActions()
        setState((prev) => ({
          ...prev,
          pendingActionsCount: 0,
        }))
        return true
      } catch (error) {
        console.error("Error al limpiar acciones pendientes:", error)
        return false
      }
    }
    return false
  }, [syncManager])

  return {
    ...state,
    addPendingAction,
    syncNow,
    getPendingActions,
    clearAllPendingActions,
  }
}
