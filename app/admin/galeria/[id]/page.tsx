import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { getAlbum } from "@/lib/firebase/gallery"
import { GalleryImageUploader } from "@/components/admin/gallery-image-uploader"
import { GalleryImagesManager } from "@/components/admin/gallery-images-manager"
import { Edit } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface AlbumPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const album = await getAlbum(params.id)

  if (!album) {
    return {
      title: "Álbum no encontrado | RaveHub",
    }
  }

  return {
    title: `Gestionar álbum: ${album.name} | RaveHub`,
    description: `Gestiona las imágenes del álbum ${album.name} en la galería de RaveHub`,
  }
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const album = await getAlbum(params.id)

  if (!album) {
    notFound()
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-start">
        <PageHeader heading={album.name} text={`Gestiona las imágenes del álbum "${album.name}"`} />
        <Link href={`/admin/galeria/${params.id}/edit`} passHref>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar álbum
          </Button>
        </Link>
      </div>

      <div className="grid gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Subir nuevas imágenes</h3>
          <GalleryImageUploader
            album={album}
            onImageUploaded={() => {
              // Esta función se llama cuando se sube una imagen
              // No necesitamos hacer nada aquí porque el componente GalleryImagesManager
              // se volverá a renderizar con los datos actualizados
            }}
          />
        </div>

        <GalleryImagesManager album={album} />
      </div>
    </div>
  )
}
