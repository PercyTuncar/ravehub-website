"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { GalleryImage } from "@/types/gallery"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ImageViewerModalProps {
  images: GalleryImage[]
  currentImage: GalleryImage | null
  onClose: () => void
}

export function ImageViewerModal({ images, currentImage, onClose }: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (currentImage) {
      const index = images.findIndex((img) => img.id === currentImage.id)
      if (index !== -1) {
        setCurrentIndex(index)
        setIsOpen(true)
      }
    } else {
      setIsOpen(false)
    }
  }, [currentImage, images])

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious()
    } else if (e.key === "ArrowRight") {
      handleNext()
    } else if (e.key === "Escape") {
      handleClose()
    }
  }

  if (!isOpen || images.length === 0) {
    return null
  }

  const image = images[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-screen-lg w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-sm"
        onKeyDown={handleKeyDown}
      >
        <div className="relative h-full flex flex-col">
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 text-white hover:bg-black/40"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="relative max-h-[70vh] max-w-full">
              <Image
                src={image.url || "/placeholder.svg"}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="object-contain max-h-[70vh] max-w-full"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 rounded-full bg-black/20 text-white hover:bg-black/40"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 rounded-full bg-black/20 text-white hover:bg-black/40"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          <div className="p-4 bg-background">
            <h3 className="text-lg font-medium">{image.name}</h3>
            <p className="text-sm text-muted-foreground">{image.alt}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
