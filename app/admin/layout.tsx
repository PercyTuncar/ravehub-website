import type React from "react"
import AdminRouteGuard from "@/components/auth/admin-route-guard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Administración | Ravehub",
  description: "Panel de administración de Ravehub",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-background">{children}</div>
    </AdminRouteGuard>
  )
}
