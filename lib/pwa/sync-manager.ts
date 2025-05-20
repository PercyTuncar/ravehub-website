import { openDB, type DBSchema } from "idb"

// Definir el esquema de la base de datos IndexedDB
interface PendingActionsDB extends DBSchema {
  "pending-actions": {
    key: string
    value: {
      id: string
      type: string
      data: any
      timestamp: number
      retries: number
      priority: number
    }
    indexes: {
      "by-type": string
      "by-timestamp": number
      "by-priority": number
    }
  }
}

// Tipos de acciones soportadas
export type ActionType =
  | "ADD_TO_CART"
  | "SUBMIT_FORM"
  | "POST_COMMENT"
  | "UPDATE_PROFILE"
  | "LIKE_POST"
  | "SAVE_DRAFT"
  | "RATE_PRODUCT"
  | "BOOKMARK_EVENT"

// Prioridades de sincronización
export enum SyncPriority {
  LOW = 0,
  MEDIUM = 5,
  HIGH = 10,
}

export class SyncManager {
  private static instance: SyncManager
  private dbPromise: Promise<any>
  private isOnline: boolean
  private syncInProgress = false

  private constructor() {
    // Inicializar la base de datos IndexedDB
    this.dbPromise = openDB<PendingActionsDB>("ravehub-offline-sync", 1, {
      upgrade(db) {
        const store = db.createObjectStore("pending-actions", {
          keyPath: "id",
        })

        // Crear índices para consultas eficientes
        store.createIndex("by-type", "type")
        store.createIndex("by-timestamp", "timestamp")
        store.createIndex("by-priority", "priority")
      },
    })

    // Estado inicial de conexión
    this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true

    // Escuchar cambios en la conexión
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline.bind(this))
      window.addEventListener("offline", this.handleOffline.bind(this))
    }

    // Intentar sincronizar al iniciar
    if (this.isOnline) {
      this.scheduleSyncAttempt()
    }
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // Manejar evento online
  private handleOnline() {
    console.log("🌐 Conexión restablecida")
    this.isOnline = true
    this.scheduleSyncAttempt()
  }

  // Manejar evento offline
  private handleOffline() {
    console.log("📴 Conexión perdida")
    this.isOnline = false
  }

  // Programar un intento de sincronización con retraso para evitar múltiples intentos
  private scheduleSyncAttempt(delayMs = 1000) {
    setTimeout(() => {
      this.syncPendingActions().catch((err) => {
        console.error("Error al sincronizar acciones pendientes:", err)
      })
    }, delayMs)
  }

  // Añadir una acción pendiente
  public async addPendingAction(
    type: ActionType,
    data: any,
    priority: SyncPriority = SyncPriority.MEDIUM,
  ): Promise<string> {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const action = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      priority,
    }

    const db = await this.dbPromise
    await db.add("pending-actions", action)

    console.log(`🔄 Acción pendiente añadida: ${type}`, data)

    // Registrar una tarea de sincronización si el navegador lo soporta
    this.registerSyncTask(type)

    // Intentar sincronizar inmediatamente si estamos online
    if (this.isOnline) {
      this.scheduleSyncAttempt(100)
    }

    return id
  }

  // Registrar una tarea de sincronización con el Service Worker
  private async registerSyncTask(type: string) {
    if ("serviceWorker" in navigator && "sync" in navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready

        // Registrar sincronización general
        await registration.sync.register("sync-pending-actions")

        // Registrar sincronización específica por tipo
        await registration.sync.register(`sync-${type}`)

        console.log(`🔄 Tarea de sincronización registrada: ${type}`)
      } catch (error) {
        console.error("Error al registrar tarea de sincronización:", error)
      }
    }
  }

  // Obtener todas las acciones pendientes
  public async getPendingActions() {
    const db = await this.dbPromise
    return db.getAll("pending-actions")
  }

  // Obtener acciones pendientes por tipo
  public async getPendingActionsByType(type: ActionType) {
    const db = await this.dbPromise
    return db.getAllFromIndex("pending-actions", "by-type", type)
  }

  // Obtener el número de acciones pendientes
  public async getPendingActionsCount(): Promise<number> {
    const db = await this.dbPromise
    return db.count("pending-actions")
  }

  // Eliminar una acción pendiente
  public async removePendingAction(id: string) {
    const db = await this.dbPromise
    await db.delete("pending-actions", id)
  }

  // Sincronizar acciones pendientes cuando hay conexión
  public async syncPendingActions(): Promise<boolean> {
    // Evitar múltiples sincronizaciones simultáneas
    if (this.syncInProgress || !this.isOnline) {
      return false
    }

    this.syncInProgress = true
    console.log("🔄 Iniciando sincronización de acciones pendientes...")

    try {
      const db = await this.dbPromise

      // Obtener acciones pendientes ordenadas por prioridad (alta a baja)
      const pendingActions = await db
        .getAllFromIndex("pending-actions", "by-priority")
        .then((actions) => actions.sort((a, b) => b.priority - a.priority))

      if (pendingActions.length === 0) {
        console.log("✅ No hay acciones pendientes para sincronizar")
        this.syncInProgress = false
        return true
      }

      console.log(`🔄 Sincronizando ${pendingActions.length} acciones pendientes`)

      // Procesar cada acción pendiente
      for (const action of pendingActions) {
        try {
          await this.processAction(action)

          // Si se procesa correctamente, eliminar de la cola
          await db.delete("pending-actions", action.id)

          console.log(`✅ Acción sincronizada y eliminada: ${action.type}`)
        } catch (error) {
          console.error(`❌ Error al procesar acción ${action.type}:`, error)

          // Incrementar contador de reintentos
          action.retries += 1

          // Si ha superado el máximo de reintentos, marcar como fallida
          if (action.retries >= 5) {
            console.warn(`⚠️ Acción ${action.id} ha fallado demasiadas veces, se moverá a fallidas`)

            // En una implementación real, podríamos moverla a otra store de "fallidas"
            await db.delete("pending-actions", action.id)
          } else {
            // Actualizar el contador de reintentos
            await db.put("pending-actions", action)
          }
        }
      }

      console.log("✅ Sincronización completada")
      return true
    } catch (error) {
      console.error("❌ Error general al sincronizar acciones pendientes:", error)
      return false
    } finally {
      this.syncInProgress = false
    }
  }

  // Procesar una acción específica
  private async processAction(action: any): Promise<void> {
    console.log(`🔄 Procesando acción: ${action.type}`, action.data)

    const apiUrl = window.location.origin

    switch (action.type) {
      case "ADD_TO_CART":
        // Sincronizar con el servidor
        await fetch(`${apiUrl}/api/cart/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
          credentials: "include",
        }).then(this.checkResponse)
        break

      case "SUBMIT_FORM":
        // Sincronizar envío de formulario
        await fetch(`${apiUrl}/api/forms/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
          credentials: "include",
        }).then(this.checkResponse)
        break

      case "POST_COMMENT":
        // Sincronizar comentario
        await fetch(`${apiUrl}/api/comments/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
          credentials: "include",
        }).then(this.checkResponse)
        break

      case "UPDATE_PROFILE":
        // Sincronizar actualización de perfil
        await fetch(`${apiUrl}/api/profile/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
          credentials: "include",
        }).then(this.checkResponse)
        break

      case "LIKE_POST":
        // Sincronizar like de post
        await fetch(`${apiUrl}/api/posts/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
          credentials: "include",
        }).then(this.checkResponse)
        break

      case "RATE_PRODUCT":
        // Sincronizar calificación de producto
        await fetch(`${apiUrl}/api/products/rate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action.data),
          credentials: "include",
        }).then(this.checkResponse)
        break

      default:
        console.warn(`⚠️ Tipo de acción desconocido: ${action.type}`)
        throw new Error(`Tipo de acción no soportado: ${action.type}`)
    }
  }

  // Verificar respuesta HTTP
  private async checkResponse(response: Response) {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error en respuesta HTTP (${response.status}): ${errorText}`)
    }
    return response
  }

  // Limpiar todas las acciones pendientes (útil para depuración)
  public async clearAllPendingActions() {
    const db = await this.dbPromise
    await db.clear("pending-actions")
    console.log("🧹 Todas las acciones pendientes han sido eliminadas")
  }
}
