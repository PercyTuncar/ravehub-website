import { AdminBannersList } from "@/components/admin/admin-banners-list"

export const metadata = {
  title: "Administrar Banners de Tienda | RaveHub Admin",
  description: "Gestiona los banners que se muestran en la página principal de la tienda",
}

export default function AdminBannersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBannersList />
    </div>
  )
}
