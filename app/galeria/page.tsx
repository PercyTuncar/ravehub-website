import { Suspense } from "react"
export const dynamic = 'force-dynamic'

import { AlbumGrid } from "@/components/gallery/album-grid"
import { GalleryFilters } from "@/components/gallery/gallery-filters"
import { GalleryHero } from "@/components/gallery/gallery-hero"
import { getAllAlbums, getAlbumsByYear } from "@/lib/firebase/gallery"
import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata: Metadata = {
  title: "Galería de Eventos | Ravehub - Fotos de Música Electrónica",
  description: "Revive los mejores momentos de los eventos de música electrónica en Latinoamérica. Galería completa de fotos de festivales, raves y conciertos exclusivos.",
  keywords: "galería, fotos, imágenes, eventos, música electrónica, festivales, raves, conciertos, Latinoamérica",
  openGraph: {
    title: "Galería de Eventos | Ravehub - Fotos de Música Electrónica",
    description: "Revive los mejores momentos de los eventos de música electrónica en Latinoamérica. Galería completa de fotos de festivales, raves y conciertos exclusivos.",
    type: "website",
    url: "https://www.ravehublatam.com/galeria",
  },
  twitter: {
    card: "summary",
    title: "Galería de Eventos | Ravehub",
    description: "Revive los mejores momentos de los eventos de música electrónica en Latinoamérica.",
  },
  alternates: {
    canonical: "https://www.ravehublatam.com/galeria",
  },
}

interface GalleryPageProps {
  searchParams: {
    year?: string
    album?: string
  }
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  // Obtener todos los álbumes o filtrar por año
  const year = searchParams.year ? Number.parseInt(searchParams.year) : undefined
  const albumSlug = searchParams.album

  const albums = year ? await getAlbumsByYear(year) : await getAllAlbums()

  // Filtrar por álbum si se proporciona un slug
  const filteredAlbums = albumSlug && albumSlug !== "all" ? albums.filter((album) => album.slug === albumSlug) : albums

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <GalleryHero />
      <div className="container px-4 mt-4">
        <Breadcrumbs />
      </div>

      <div className="container px-4 py-12 space-y-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-center sm:text-left">Explora nuestra colección</h2>
          <p className="text-muted-foreground text-center sm:text-left">
            Revive los mejores momentos de nuestros eventos a través de imágenes
          </p>
        </div>

        <GalleryFilters albums={albums} />

        <Suspense fallback={<GalleryLoading />}>
          {filteredAlbums.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10.8" />
                  <path d="m21 15-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />
                  <path d="m14 10.5 3 3" />
                  <path d="M5 14v7" />
                </svg>
              </div>
              <p className="text-xl font-medium">No se encontraron álbumes</p>
              <p className="text-muted-foreground max-w-md mx-auto">
                No hay álbumes que coincidan con los filtros seleccionados. Intenta con otros criterios de búsqueda.
              </p>
            </div>
          ) : (
            <AlbumGrid albums={filteredAlbums} />
          )}
        </Suspense>
      </div>
    </div>
  )
}

function GalleryLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden bg-card border animate-pulse">
          <div className="aspect-video bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-full mt-2" />
          </div>
          <div className="px-4 py-3 border-t">
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
