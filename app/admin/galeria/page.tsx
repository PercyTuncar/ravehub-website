import { AdminAlbumsList } from "@/components/admin/admin-albums-list"
import { PageHeader } from "@/components/page-header"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Administración de Galería | Ravehub",
  description: "Gestiona los álbumes e imágenes de la galería de Ravehub",
}

export default function AdminGalleryPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader heading="Galería de imágenes" text="Gestiona los álbumes e imágenes de la galería de Ravehub" />
      <AdminAlbumsList />
    </div>
  )
}
