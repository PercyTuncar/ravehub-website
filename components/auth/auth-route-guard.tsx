"use client"

import type React from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  // Verificar si tenemos información de autenticación en localStorage
  useEffect(() => {
    // Solo mostrar el loader después de un breve retraso para evitar parpadeos
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoading(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    // Verificar si hay un usuario en localStorage para mostrar contenido inmediatamente
    if (typeof window !== "undefined") {
      const cachedUserData = localStorage.getItem("userData")
      if (cachedUserData) {
        // Tenemos datos en caché, no necesitamos redirigir inmediatamente
        return
      }
    }

    // Solo redirigir después de que la autenticación se haya cargado completamente
    // y confirmemos que el usuario no está autenticado
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true)
      console.log("Access denied: User is not authenticated")
      // Encode the current path to redirect back after login
      const encodedRedirect = encodeURIComponent(pathname)
      router.push(`/login?redirect=${encodedRedirect}`)
    }
  }, [loading, user, router, pathname, isRedirecting])

  // Mostrar un indicador de carga más amigable
  if (loading && showLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <span className="mt-4 block text-lg">Verificando autenticación...</span>
          <p className="mt-2 text-sm text-gray-500">Esto solo tomará un momento</p>
        </div>
      </div>
    )
  }

  // Si el usuario está autenticado o tenemos datos en caché, renderizar los hijos
  if (user || (typeof window !== "undefined" && localStorage.getItem("userData"))) {
    return <>{children}</>
  }

  // Mostrar un esqueleto de carga mientras se redirige
  if (isRedirecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <span className="mt-4 block text-lg">Redirigiendo al inicio de sesión...</span>
        </div>
      </div>
    )
  }

  // Mostrar un esqueleto de carga mientras se verifica la autenticación
  return (
    <div className="animate-pulse">
      <div className="h-screen bg-gray-100"></div>
    </div>
  )
}
