import type { Album, GalleryImage } from "@/types/gallery"

interface GallerySchemaProps {
  album: Album
  images: GalleryImage[]
}

export function GallerySchema({ album, images }: GallerySchemaProps) {
  // Crear el objeto JSON-LD para el álbum y sus imágenes
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `Galería RaveHub – ${album.name}`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/galeria/${album.slug}`,
    description: album.description,
    datePublished: album.date,
    author: {
      "@type": "Organization",
      name: "RaveHub",
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    image: images.map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.url,
      url: image.url,
      caption: image.alt,
      datePublished: new Date(image.uploadedAt).toISOString().split("T")[0],
      author: {
        "@type": "Organization",
        name: "RaveHub",
      },
      width: image.width,
      height: image.height,
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
