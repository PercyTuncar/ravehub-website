"use client"

import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

export function RegisterSW() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      setRegistration(reg)

      // Verificar si ya hay una suscripción
      const existingSubscription = await reg.pushManager.getSubscription()
      if (existingSubscription) {
        setIsSubscribed(true)
        setSubscription(existingSubscription)
      }
    } catch (error) {
      console.error("Error al registrar el Service Worker:", error)
    }
  }

  async function subscribeUser() {
    try {
      if (!registration) return

      // Obtener la clave VAPID pública desde el servidor
      const response = await fetch("/api/push/vapid-key")
      const data = await response.json()

      if (!data.vapidPublicKey) {
        throw new Error("No se pudo obtener la clave VAPID pública")
      }

      // Convertir la clave base64 a Uint8Array
      const vapidPublicKey = urlBase64ToUint8Array(data.vapidPublicKey)

      // Suscribir al usuario
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      // Guardar la suscripción en el servidor
      await fetch("/api/push/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription: pushSubscription }),
      })

      setIsSubscribed(true)
      setSubscription(pushSubscription)
      toast({
        title: "¡Notificaciones activadas!",
        description: "Ahora recibirás notificaciones de nuevos eventos y contenido.",
      })
    } catch (error) {
      console.error("Error al suscribirse a las notificaciones push:", error)
      toast({
        title: "Error al activar notificaciones",
        description: "No se pudieron activar las notificaciones. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para convertir base64 a Uint8Array
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // No renderizamos nada visible, este componente solo maneja el registro del SW
  return null
}
