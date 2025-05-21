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

      // Check for existing subscription
      const existingSubscription = await reg.pushManager.getSubscription()
      if (existingSubscription) {
        setIsSubscribed(true)
        setSubscription(existingSubscription)
      }
    } catch (error) {
      console.error("Service Worker registration error:", error)
    }
  }

  async function subscribeUser() {
    try {
      if (!registration) return

      // Get push notification key from our secure endpoint
      const response = await fetch("/api/push/key")
      const data = await response.json()

      if (!data.key) {
        throw new Error("Could not retrieve public key")
      }

      // Convert key to proper format
      const applicationServerKey = convertBase64ToUint8Array(data.key)

      // Create subscription
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // Register subscription with server
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
      console.error("Push subscription error:", error)
      toast({
        title: "Error al activar notificaciones",
        description: "No se pudieron activar las notificaciones. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Utility function to convert base64 string to Uint8Array
  function convertBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // No visible UI
  return null
}
