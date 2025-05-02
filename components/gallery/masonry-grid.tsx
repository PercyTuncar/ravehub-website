"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import type { GalleryImage } from "@/types/gallery"
import { cn } from "@/lib/utils"
import { useInView } from "react-intersection-observer"

interface MasonryGridProps {
  images: GalleryImage[]
  onImageClick?: (image: GalleryImage) => void
}

export function MasonryGrid({ images, onImageClick }: MasonryGridProps) {
  const [columns, setColumns] = useState(3)
  const containerRef = useRef<HTMLDivElement>(null)

  // Función para determinar el número de columnas basado en el ancho del contenedor
  const calculateColumns = () => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth

    if (containerWidth < 640) {
      setColumns(1)
    } else if (containerWidth < 768) {
      setColumns(2)
    } else if (containerWidth < 1024) {
      setColumns(3)
    } else {
      setColumns(4)
    }
  }

  // Calcular columnas al montar y cuando cambie el tamaño de la ventana
  useEffect(() => {
    calculateColumns()

    const handleResize = () => {
      calculateColumns()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Distribuir imágenes en columnas
  const getColumnImages = () => {
    const columnImages: GalleryImage[][] = Array.from({ length: columns }, () => [])

    images.forEach((image, index) => {
      const columnIndex = index % columns
      columnImages[columnIndex].push(image)
    })

    return columnImages
  }

  const columnImages = getColumnImages()

  return (
    <div ref={containerRef} className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {columnImages.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((image) => (
            <MasonryItem key={image.id} image={image} onClick={() => onImageClick?.(image)} />
          ))}
        </div>
      ))}
    </div>
  )
}

interface MasonryItemProps {
  image: GalleryImage
  onClick?: () => void
}

function MasonryItem({ image, onClick }: MasonryItemProps) {
  const [loaded, setLoaded] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  })

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-lg transition-all duration-300 cursor-pointer",
        "transform hover:scale-[1.02] hover:shadow-lg",
        !loaded && "bg-muted animate-pulse",
      )}
      onClick={onClick}
    >
      {inView && (
        <div
          className="relative"
          style={{
            paddingBottom: `${(image.height / image.width) * 100}%`,
          }}
        >
          <Image
            src={image.url || "/placeholder.svg"}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn("object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setLoaded(true)}
            priority={false}
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}
