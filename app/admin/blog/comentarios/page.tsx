import type { Metadata } from "next"
import AdminCommentsListWrapper from "@/components/admin/admin-comments-list"
import AdminRouteGuard from "@/components/auth/admin-route-guard"

export const metadata: Metadata = {
  title: "Administrar Comentarios | RaveHub",
  description: "Panel de administración de comentarios del blog",
}

export default function AdminCommentsPage() {
  return (
    <AdminRouteGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Administrar Comentarios</h1>
        <AdminCommentsListWrapper />
      </div>
    </AdminRouteGuard>
  )
}
