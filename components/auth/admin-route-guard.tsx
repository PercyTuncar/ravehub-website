"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after auth is loaded and we know the user is not an admin
    if (!loading && user && !isAdmin) {
      console.log("Access denied: User is not an admin", { userId: user.id, role: user.role })
      router.push("/")
    } else if (!loading && !user) {
      console.log("Access denied: User is not authenticated")
      router.push("/login?redirect=/admin")
    }
  }, [loading, user, isAdmin, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Verificando permisos...</span>
      </div>
    )
  }

  // If user is admin, render the children
  if (isAdmin) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}
