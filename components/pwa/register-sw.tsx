"use client"

import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

export function RegisterSW() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker no soportado en este navegador")
      return
    }

    // Determinar si estamos en producción
    const isProduction =
      window.location.hostname === "ravehub.com" || // Reemplazar con tu dominio real
      window.location.hostname === "ravehub.vercel.app" || // Dominio de producción en Vercel
      (!window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("vusercontent.net") &&
        !window.location.hostname.includes("preview")) // Excluir entornos de desarrollo/preview

    const registerServiceWorker = async () => {
      try {
        // Usar el SW completo en producción, fallback en preview/desarrollo
        const swPath = isProduction ? "/sw.js" : "/sw-fallback.js"

        console.log(`Registrando Service Worker desde: ${swPath}`)

        const reg = await navigator.serviceWorker.register(swPath, {
          scope: "/",
        })

        setRegistration(reg)
        console.log("Service Worker registrado correctamente:", reg.scope)

        // Verificar si hay una actualización disponible
        if (reg.waiting) {
          console.log("Actualización de Service Worker disponible")
          setUpdateAvailable(true)
          showUpdateToast()
        }

        // Escuchar actualizaciones
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("Nueva versión disponible")
                setUpdateAvailable(true)
                showUpdateToast()
              }
            })
          }
        })

        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log("Mensaje del Service Worker:", event.data)

          if (event.data.type === "CACHE_UPDATED") {
            // Notificar al usuario que hay contenido actualizado
            toast({
              title: "Contenido actualizado",
              description: "Se ha actualizado el contenido en segundo plano.",
              duration: 3000,
            })
          }
        })

        // Solicitar permiso para notificaciones push
        if (isProduction && "Notification" in window) {
          requestNotificationPermission()
        }
      } catch (error) {
        console.error("Error al registrar Service Worker:", error)
      }
    }

    // Registrar cuando la página esté completamente cargada
    if (document.readyState === "complete") {
      registerServiceWorker()
    } else {
      window.addEventListener("load", registerServiceWorker)
      return () => window.removeEventListener("load", registerServiceWorker)
    }

    // Escuchar eventos de controllerchange
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service Worker controller ha cambiado")
    })

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", () => {})
    }
  }, [])

  // Actualizar la función de suscripción para usar un endpoint seguro
  const registerPushSubscription = async (reg: ServiceWorkerRegistration) => {
    try {
      if ("pushManager" in reg) {
        // En lugar de usar la clave VAPID directamente, obtenemos la clave pública del servidor
        const response = await fetch("/api/push/vapid-key")

        if (!response.ok) {
          throw new Error("No se pudo obtener la clave pública VAPID")
        }

        const { publicKey } = await response.json()

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        })

        console.log("Suscripción push creada:", subscription)

        // Enviar la suscripción al servidor para almacenarla
        await fetch("/api/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        })
      }
    } catch (error) {
      console.error("Error al suscribirse a notificaciones push:", error)
    }
  }

  // Solicitar permiso para notificaciones
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        console.log("Permiso de notificaciones concedido")

        // Registrar para notificaciones push si está disponible
        if (registration) {
          await registerPushSubscription(registration)
        }
      }
    } catch (error) {
      console.error("Error al solicitar permiso de notificaciones:", error)
    }
  }

  // Mostrar toast de actualización
  const showUpdateToast = () => {
    toast({
      title: "Actualización disponible",
      description: "Hay una nueva versión de la aplicación disponible.",
      action: (
        <button onClick={updateServiceWorker} className="bg-primary text-white px-3 py-2 rounded-md text-sm">
          Actualizar
        </button>
      ),
      duration: 0, // No desaparece automáticamente
    })
  }

  // Actualizar el Service Worker
  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      // Enviar mensaje al SW en espera para que tome el control
      registration.waiting.postMessage({ action: "skipWaiting" })
    }
  }

  return null
}
