"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import type { Album, GalleryImage } from "@/types/gallery"
import { getImagesForAlbum, updateImage, deleteImage, updateImageOrder } from "@/lib/firebase/gallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Edit, Grip, MoreVertical, Trash2 } from "lucide-react"
import { slugify } from "@/lib/utils"

interface GalleryImagesManagerProps {
  album: Album
}

export function GalleryImagesManager({ album }: GalleryImagesManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [editedName, setEditedName] = useState("")
  const [editedSlug, setEditedSlug] = useState("")
  const [editedAlt, setEditedAlt] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadImages()
  }, [album.id])

  const loadImages = async () => {
    setLoading(true)
    try {
      const loadedImages = await getImagesForAlbum(album.id)
      setImages(loadedImages)
    } catch (error) {
      console.error("Error al cargar imágenes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las imágenes del álbum",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditImage = (image: GalleryImage) => {
    setEditingImage(image)
    setEditedName(image.name)
    setEditedSlug(image.slug)
    setEditedAlt(image.alt)
    setIsDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingImage) return

    try {
      await updateImage(editingImage.id, {
        name: editedName,
        slug: editedSlug,
        alt: editedAlt,
      })

      // Actualizar la imagen en el estado local
      setImages((prev) =>
        prev.map((img) =>
          img.id === editingImage.id ? { ...img, name: editedName, slug: editedSlug, alt: editedAlt } : img,
        ),
      )

      toast({
        title: "Imagen actualizada",
        description: "La información de la imagen se ha actualizado correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar la imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la información de la imagen",
        variant: "destructive",
      })
    } finally {
      setIsDialogOpen(false)
      setEditingImage(null)
    }
  }

  const handleDeleteImage = (image: GalleryImage) => {
    setImageToDelete(image)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return

    setIsDeleting(true)
    try {
      await deleteImage(imageToDelete.id)

      // Eliminar la imagen del estado local
      setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id))

      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar la imagen:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setImageToDelete(null)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    // Crear una copia del array de imágenes
    const newImages = Array.from(images)

    // Eliminar la imagen de la posición original
    const [movedImage] = newImages.splice(sourceIndex, 1)

    // Insertar la imagen en la nueva posición
    newImages.splice(destinationIndex, 0, movedImage)

    // Actualizar el estado local inmediatamente para una UI más responsiva
    setImages(newImages)

    // Actualizar los órdenes en la base de datos
    try {
      // Actualizar el orden de cada imagen
      const updatePromises = newImages.map((image, index) => updateImageOrder(image.id, index))

      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Error al actualizar el orden de las imágenes:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las imágenes",
        variant: "destructive",
      })

      // Si hay un error, volver a cargar las imágenes
      loadImages()
    }
  }

  const handleNameChange = (value: string) => {
    setEditedName(value)
    if (!editedSlug || editedSlug === slugify(editedName)) {
      setEditedSlug(slugify(value))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Imágenes del álbum</h3>
        <div className="text-sm text-muted-foreground">
          {images.length} {images.length === 1 ? "imagen" : "imágenes"}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando imágenes...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay imágenes en este álbum. Sube algunas usando el formulario de arriba.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="gallery-images">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className="group">
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="relative aspect-square">
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt={image.alt}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              <div className="absolute top-2 right-2 flex space-x-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 bg-black/50 rounded-full text-white"
                                >
                                  <Grip className="h-4 w-4" />
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 bg-black/50 text-white rounded-full"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditImage(image)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteImage(image)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium truncate">{image.name}</h4>
                              <p className="text-sm text-muted-foreground truncate">{image.alt}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Diálogo de edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar imagen</DialogTitle>
            <DialogDescription>Actualiza la información de la imagen seleccionada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={editingImage.url || "/placeholder.svg"}
                  alt={editingImage.alt}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="image-name">Nombre</Label>
              <Input id="image-name" value={editedName} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-slug">Slug</Label>
              <Input id="image-slug" value={editedSlug} onChange={(e) => setEditedSlug(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Texto alternativo (alt)</Label>
              <Textarea id="image-alt" value={editedAlt} onChange={(e) => setEditedAlt(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {imageToDelete && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Image
                  src={imageToDelete.url || "/placeholder.svg"}
                  alt={imageToDelete.alt}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteImage} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
