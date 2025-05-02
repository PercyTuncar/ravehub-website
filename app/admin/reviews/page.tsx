import { AdminReviewsList } from "@/components/admin/admin-reviews-list"

export const viewport = {
  themeColor: "#000000",
}

export default function AdminReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Reseñas</h1>
      <AdminReviewsList />
    </div>
  )
}
