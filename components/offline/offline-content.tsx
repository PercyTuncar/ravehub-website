"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WifiOff, Home, RefreshCw, Clock, ShoppingCart, Calendar, BookOpen, ImageIcon, Send } from "lucide-react"
import { useOfflineSync } from "@/hooks/use-offline-sync"
import { SyncPriority } from "@/lib/pwa/sync-manager"

export default function OfflineContent() {
  const { isOnline, isSyncing, pendingActionsCount, syncNow, getPendingActions, clearAllPendingActions } =
    useOfflineSync()

  const [pendingActions, setPendingActions] = useState<any[]>([])
  const [cachedPages, setCachedPages] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("status")

  // Cargar acciones pendientes
  useEffect(() => {
    const loadPendingActions = async () => {
      const actions = await getPendingActions()
      setPendingActions(actions)
    }

    loadPendingActions()

    // Actualizar periódicamente
    const interval = setInterval(loadPendingActions, 5000)
    return () => clearInterval(interval)
  }, [getPendingActions])

  // Verificar páginas en caché
  useEffect(() => {
    const checkCachedPages = async () => {
      if ("caches" in window) {
        try {
          const cache = await caches.open("ravehub-pages-v3")
          const keys = await cache.keys()
          const urls = keys
            .map((request) => request.url)
            .filter((url) => url.startsWith(window.location.origin))
            .map((url) => url.replace(window.location.origin, ""))

          setCachedPages(urls)
        } catch (error) {
          console.error("Error al verificar caché:", error)
        }
      }
    }

    checkCachedPages()
  }, [])

  // Manejar sincronización manual
  const handleSync = async () => {
    await syncNow()
    // Actualizar la lista de acciones pendientes
    const actions = await getPendingActions()
    setPendingActions(actions)
  }

  // Manejar limpieza de acciones pendientes
  const handleClearActions = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar todas las acciones pendientes?")) {
      await clearAllPendingActions()
      setPendingActions([])
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 max-w-4xl mx-auto">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <WifiOff className="h-16 w-16 text-gray-400 mb-4 mx-auto" />
          <h1 className="text-3xl font-bold mb-2">{isOnline ? "Conexión restablecida" : "Sin conexión"}</h1>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            {isOnline
              ? "Tu conexión ha sido restablecida. Puedes seguir navegando normalmente."
              : "Parece que no tienes conexión a internet. Algunas funciones pueden no estar disponibles hasta que te vuelvas a conectar."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Ir al inicio
              </Link>
            </Button>
            <Button className="flex items-center gap-2" onClick={() => window.location.reload()} disabled={!isOnline}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              Recargar página
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({pendingActionsCount})</TabsTrigger>
            <TabsTrigger value="cached">Contenido disponible</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Estado de conexión</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {isOnline ? "Conectado" : "Desconectado"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Acciones pendientes</span>
                    <span className="font-mono">{pendingActionsCount}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Páginas en caché</span>
                    <span className="font-mono">{cachedPages.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Service Worker</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${navigator.serviceWorker ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {navigator.serviceWorker ? "Activo" : "No disponible"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSync}
                disabled={!isOnline || isSyncing || pendingActionsCount === 0}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>

              <Button
                variant="outline"
                onClick={handleClearActions}
                disabled={pendingActionsCount === 0}
                className="flex-1"
              >
                Limpiar pendientes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            {pendingActions.length > 0 ? (
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <Card key={action.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <div className="flex items-center">
                          {action.type === "ADD_TO_CART" && <ShoppingCart className="h-4 w-4 mr-2 text-blue-500" />}
                          {action.type === "SUBMIT_FORM" && <Send className="h-4 w-4 mr-2 text-green-500" />}
                          {action.type === "POST_COMMENT" && <BookOpen className="h-4 w-4 mr-2 text-purple-500" />}
                          {action.type === "UPDATE_PROFILE" && <ImageIcon className="h-4 w-4 mr-2 text-orange-500" />}
                          <span className="font-medium">{action.type}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(action.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4">
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(action.data, null, 2)}
                        </pre>
                        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                          <span>
                            Prioridad:{" "}
                            {action.priority === SyncPriority.HIGH
                              ? "Alta"
                              : action.priority === SyncPriority.MEDIUM
                                ? "Media"
                                : "Baja"}
                          </span>
                          <span>Intentos: {action.retries}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay acciones pendientes de sincronización</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cached">
            {cachedPages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-4">Estas páginas están disponibles para navegar sin conexión:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cachedPages.map((url) => (
                    <Link
                      href={url}
                      key={url}
                      className="p-3 border rounded-md hover:bg-gray-50 transition-colors flex items-center"
                    >
                      {url === "/" && <Home className="h-4 w-4 mr-2 text-gray-500" />}
                      {url.includes("/blog") && <BookOpen className="h-4 w-4 mr-2 text-purple-500" />}
                      {url.includes("/eventos") && <Calendar className="h-4 w-4 mr-2 text-blue-500" />}
                      {url.includes("/tienda") && <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />}
                      {url.includes("/galeria") && <ImageIcon className="h-4 w-4 mr-2 text-orange-500" />}
                      <span className="truncate">{url || "/"}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hay páginas disponibles en caché</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
