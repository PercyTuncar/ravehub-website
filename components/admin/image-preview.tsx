"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ImagePreviewProps {
  src: string
  alt: string
  onRemove?: () => void
  className?: string
  priority?: boolean
}

export function ImagePreview({ src, alt, onRemove, className = "", priority = false }: ImagePreviewProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`relative bg-muted flex items-center justify-center rounded-md ${className}`}>
        <span className="text-sm text-muted-foreground">Error al cargar la imagen</span>
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`}>
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        onError={() => setError(true)}
      />
      {onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-80 hover:opacity-100"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
