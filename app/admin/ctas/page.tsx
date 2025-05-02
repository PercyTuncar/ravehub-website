import { AdminCTAsList } from "@/components/admin/admin-ctas-list"

export const metadata = {
  title: "Administrar CTAs | RaveHub",
  description: "Gestiona los Call to Actions personalizados para eventos",
}

export default function AdminCTAsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administrar CTAs</h1>
      <AdminCTAsList />
    </div>
  )
}
