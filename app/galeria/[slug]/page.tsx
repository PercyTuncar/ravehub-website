"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { MasonryGrid } from "@/components/gallery/masonry-grid"
import { ImageViewerModal } from "@/components/gallery/image-viewer-modal"
import { GallerySchema } from "@/components/gallery/gallery-schema"
import { getAlbumWithImagesBySlug } from "@/lib/firebase/gallery"
import type { Album, GalleryImage } from "@/types/gallery"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function AlbumPage() {
  const params = useParams()
  const slug = params.slug as string

  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    const loadAlbum = async () => {
      setLoading(true)
      try {
        const albumWithImages = await getAlbumWithImagesBySlug(slug)

        if (albumWithImages) {
          setAlbum(albumWithImages)
          setImages(albumWithImages.images)
        }
      } catch (error) {
        console.error("Error al cargar el álbum:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAlbum()
  }, [slug])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image)
  }

  const handleCloseModal = () => {
    setSelectedImage(null)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p>Cargando álbum...</p>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Álbum no encontrado</p>
          <Link href="/galeria" passHref>
            <Button variant="link" className="mt-4">
              Volver a la galería
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/galeria" passHref>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
      </div>

      <PageHeader
        heading={album.name}
        text={`${formatDate(album.date)} • ${images.length} ${images.length === 1 ? "imagen" : "imágenes"}`}
      />

      <p className="text-lg">{album.description}</p>

      {images.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay imágenes en este álbum</p>
        </div>
      ) : (
        <MasonryGrid images={images} onImageClick={handleImageClick} />
      )}

      <ImageViewerModal images={images} currentImage={selectedImage} onClose={handleCloseModal} />

      {/* Agregar el esquema JSON-LD */}
      <GallerySchema album={album} images={images} />
    </div>
  )
}
