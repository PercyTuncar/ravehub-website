import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { AlbumForm } from "@/components/admin/album-form"
import { getAlbum } from "@/lib/firebase/gallery"
import type { Metadata } from "next"

interface EditAlbumPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditAlbumPageProps): Promise<Metadata> {
  const album = await getAlbum(params.id)

  if (!album) {
    return {
      title: "Álbum no encontrado | RaveHub",
    }
  }

  return {
    title: `Editar álbum: ${album.name} | RaveHub`,
    description: `Edita la información del álbum ${album.name} en la galería de RaveHub`,
  }
}

export default async function EditAlbumPage({ params }: EditAlbumPageProps) {
  const album = await getAlbum(params.id)

  if (!album) {
    notFound()
  }

  return (
    <div className="container py-6 space-y-6">
      <PageHeader heading={`Editar álbum: ${album.name}`} text="Actualiza la información del álbum" />
      <AlbumForm album={album} />
    </div>
  )
}
