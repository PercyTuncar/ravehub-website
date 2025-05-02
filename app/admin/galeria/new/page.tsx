import { AlbumForm } from "@/components/admin/album-form"
import { PageHeader } from "@/components/page-header"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crear nuevo álbum | RaveHub",
  description: "Crea un nuevo álbum para la galería de RaveHub",
}

export default function NewAlbumPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader heading="Crear nuevo álbum" text="Añade un nuevo álbum a la galería de RaveHub" />
      <AlbumForm />
    </div>
  )
}
