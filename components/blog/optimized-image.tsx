"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  fill?: boolean
  sizes?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState(src || "/images/placeholder-blog.jpg")

  // Manejar imágenes rotas o no disponibles
  useEffect(() => {
    setImgSrc(src || "/images/placeholder-blog.jpg")
  }, [src])

  return (
    <div className={cn("overflow-hidden relative", className)} style={fill ? {} : { width, height }}>
      <Image
        src={imgSrc || "/placeholder.svg"}
        alt={alt || "Imagen"}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        className={cn(
          "object-cover transition-all duration-300",
          isLoading ? "scale-105 blur-sm" : "scale-100 blur-0",
          className,
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc("/images/placeholder-blog.jpg")
          setIsLoading(false)
        }}
      />
    </div>
  )
}
