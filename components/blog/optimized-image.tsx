"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  lowQuality?: boolean
}

export function OptimizedImage({ src, alt, className, lowQuality = false, ...props }: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Generar un placeholder blur data URL para imágenes sin blurDataURL
  const defaultBlurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmMGYwZjAiLz48L3N2Zz4="

  // Usar una imagen de respaldo en caso de error
  const imgSrc = error ? "/images/placeholder-blog.jpg" : src

  // Optimizar la calidad de imagen según la prioridad
  const quality = props.priority ? 85 : lowQuality ? 60 : 75

  // Optimizar el tamaño de imagen según el dispositivo
  const sizes = props.sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

  return (
    <Image
      src={imgSrc || "/placeholder.svg"}
      alt={alt || ""}
      className={`${className || ""} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
      placeholder="blur"
      blurDataURL={props.blurDataURL || defaultBlurDataURL}
      quality={quality}
      sizes={sizes}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  )
}
