export class SyncManager {
  private static instance: SyncManager
  private pendingActions: Array<{ type: string; data: any }> = []

  private constructor() {
    // Cargar acciones pendientes del localStorage
    this.loadPendingActions()

    // Escuchar cambios en la conexión
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.syncPendingActions.bind(this))
    }
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // Añadir una acción pendiente
  public addPendingAction(type: string, data: any): void {
    this.pendingActions.push({ type, data })
    this.savePendingActions()

    // Registrar una tarea de sincronización si el navegador lo soporta
    if ("serviceWorker" in navigator && "sync" in window.registration) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register("sync-pending-actions")
      })
    }
  }

  // Sincronizar acciones pendientes cuando hay conexión
  private async syncPendingActions(): Promise<void> {
    if (this.pendingActions.length === 0) return

    const actionsToSync = [...this.pendingActions]

    try {
      for (const action of actionsToSync) {
        await this.processAction(action)
        // Eliminar la acción de la lista de pendientes
        this.pendingActions = this.pendingActions.filter((a) => a !== action)
      }

      // Guardar el estado actualizado
      this.savePendingActions()
    } catch (error) {
      console.error("Error al sincronizar acciones pendientes:", error)
    }
  }

  // Procesar una acción específica
  private async processAction(action: { type: string; data: any }): Promise<void> {
    switch (action.type) {
      case "ADD_TO_CART":
        // Lógica para sincronizar añadir al carrito
        await this.syncAddToCart(action.data)
        break
      case "SUBMIT_FORM":
        // Lógica para sincronizar envío de formulario
        await this.syncFormSubmission(action.data)
        break
      // Añadir más casos según sea necesario
      default:
        console.warn(`Tipo de acción desconocido: ${action.type}`)
    }
  }

  // Implementaciones específicas de sincronización
  private async syncAddToCart(data: any): Promise<void> {
    // Implementar lógica para sincronizar con el servidor
    console.log("Sincronizando añadir al carrito:", data)
  }

  private async syncFormSubmission(data: any): Promise<void> {
    // Implementar lógica para sincronizar con el servidor
    console.log("Sincronizando envío de formulario:", data)
  }

  // Guardar acciones pendientes en localStorage
  private savePendingActions(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingActions", JSON.stringify(this.pendingActions))
    }
  }

  // Cargar acciones pendientes desde localStorage
  private loadPendingActions(): void {
    if (typeof window !== "undefined") {
      const savedActions = localStorage.getItem("pendingActions")
      if (savedActions) {
        try {
          this.pendingActions = JSON.parse(savedActions)
        } catch (error) {
          console.error("Error al cargar acciones pendientes:", error)
          this.pendingActions = []
        }
      }
    }
  }
}
