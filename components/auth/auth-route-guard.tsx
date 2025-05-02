"use client"

import type React from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect after auth is loaded and we know the user is not authenticated
    if (!loading && !user) {
      console.log("Access denied: User is not authenticated")
      // Encode the current path to redirect back after login
      const encodedRedirect = encodeURIComponent(pathname)
      router.push(`/login?redirect=${encodedRedirect}`)
    }
  }, [loading, user, router, pathname])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Verificando autenticación...</span>
      </div>
    )
  }

  // If user is authenticated, render the children
  if (user) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}
