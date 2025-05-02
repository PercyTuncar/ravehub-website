"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Upload, X, ArrowUp, ArrowDown, Edit, Eye } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

interface GalleryImage {
  url: string
  alt: string
  id: string
}

interface ImageGalleryUploaderProps {
  images: GalleryImage[]
  onImagesChange: (images: GalleryImage[]) => void
  onImageUpload: (file: File) => Promise<string>
  className?: string
}

export function ImageGalleryUploader({
  images,
  onImagesChange,
  onImageUpload,
  className = "",
}: ImageGalleryUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      await uploadMultipleFiles(files)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      await uploadMultipleFiles(files)
    }
  }

  const uploadMultipleFiles = async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        const imageUrl = await onImageUpload(file)
        const newImage: GalleryImage = {
          url: imageUrl,
          alt: file.name.split(".")[0], // Default alt text is filename without extension
          id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }
        onImagesChange([...images, newImage])
      }
    } catch (error) {
      console.error("Error uploading images:", error)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id))
  }

  const moveImage = (id: string, direction: "up" | "down") => {
    const index = images.findIndex((img) => img.id === id)
    if (index === -1) return

    const newImages = [...images]
    if (direction === "up" && index > 0) {
      ;[newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]]
    } else if (direction === "down" && index < images.length - 1) {
      ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    }

    onImagesChange(newImages)
  }

  const openEditDialog = (image: GalleryImage) => {
    setEditingImage(image)
    setIsDialogOpen(true)
  }

  const saveImageEdit = () => {
    if (!editingImage) return

    const updatedImages = images.map((img) => (img.id === editingImage.id ? editingImage : img))

    onImagesChange(updatedImages)
    setIsDialogOpen(false)
    setEditingImage(null)
  }

  const openPreviewDialog = (image: GalleryImage) => {
    setPreviewImage(image)
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onImagesChange(items)
  }

  return (
    <div className={`${className}`}>
      <div
        className={`border-2 border-dashed rounded-md mb-4 ${
          dragActive ? "border-primary bg-primary/10" : "border-gray-300"
        } p-4`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center w-full h-24 cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            {uploading ? "Subiendo imágenes..." : "Arrastra imágenes o haz clic para seleccionar"}
          </p>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            multiple
            disabled={uploading}
          />
        </label>
      </div>

      {images.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="gallery-images">
            {(provided) => (
              <div className="space-y-4" {...provided.droppableProps} ref={provided.innerRef}>
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided) => (
                      <Card
                        className="relative"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <CardContent className="p-3 flex items-center space-x-4">
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={image.url || "/placeholder.svg"}
                              alt={image.alt}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{image.alt || "Sin descripción"}</p>
                            <p className="text-xs text-gray-500 truncate mt-1">Posición: {index + 1}</p>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveImage(image.id, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveImage(image.id, "down")}
                              disabled={index === images.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(image)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openPreviewDialog(image)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeImage(image.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar imagen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative w-full h-60 mb-4">
              {editingImage && (
                <Image
                  src={editingImage.url || "/placeholder.svg"}
                  alt={editingImage.alt}
                  fill
                  className="object-contain rounded-md"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Texto alternativo</Label>
              <Textarea
                id="image-alt"
                value={editingImage?.alt || ""}
                onChange={(e) => editingImage && setEditingImage({ ...editingImage, alt: e.target.value })}
                placeholder="Describe la imagen para mejorar la accesibilidad"
                rows={3}
              />
            </div>
            <Button onClick={saveImageEdit} className="w-full">
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Vista previa</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[60vh]">
              <Image
                src={previewImage.url || "/placeholder.svg"}
                alt={previewImage.alt}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-center text-sm text-gray-500">{previewImage.alt}</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
