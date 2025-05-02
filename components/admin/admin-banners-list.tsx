"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Edit, Trash2, Youtube, GripVertical, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getStoreBanners, deleteStoreBanner, updateBannersOrder } from "@/lib/firebase/banners"
import { toast } from "@/components/ui/use-toast"
import type { StoreBanner } from "@/types"

export function AdminBannersList() {
  const router = useRouter()
  const [banners, setBanners] = useState<StoreBanner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null)
  const [orderChanged, setOrderChanged] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const data = await getStoreBanners()
      setBanners(data)
    } catch (error) {
      console.error("Error fetching banners:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los banners",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return

    try {
      await deleteStoreBanner(bannerToDelete)
      setBanners(banners.filter((banner) => banner.id !== bannerToDelete))
      toast({
        title: "Banner eliminado",
        description: "El banner se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting banner:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el banner",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setBannerToDelete(null)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(banners)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update the order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    setBanners(updatedItems)
    setOrderChanged(true)
  }

  const saveOrder = async () => {
    try {
      const orderData = banners.map((banner, index) => ({
        id: banner.id,
        order: index,
      }))

      await updateBannersOrder(orderData)

      toast({
        title: "Orden actualizado",
        description: "El orden de los banners se ha actualizado correctamente",
      })

      setOrderChanged(false)
    } catch (error) {
      console.error("Error updating banner order:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de los banners",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando banners...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Banners de la Tienda</h2>
        <div className="flex space-x-2">
          {orderChanged && (
            <Button onClick={saveOrder} variant="outline">
              Guardar orden
            </Button>
          )}
          <Button onClick={() => router.push("/admin/store/banners/new")}>Nuevo Banner</Button>
        </div>
      </div>

      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-md">
          <p className="text-muted-foreground mb-4">No hay banners disponibles</p>
          <Button onClick={() => router.push("/admin/store/banners/new")}>Crear primer banner</Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="banners">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {banners.map((banner, index) => (
                  <Draggable key={banner.id} draggableId={banner.id} index={index}>
                    {(provided) => (
                      <Card ref={provided.innerRef} {...provided.draggableProps} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center">
                            <div {...provided.dragHandleProps} className="p-4 cursor-grab">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                              <div className="relative aspect-video rounded-md overflow-hidden">
                                {banner.mediaType === "image" ? (
                                  <Image
                                    src={banner.mediaUrl || "/placeholder.svg"}
                                    alt={banner.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full bg-muted">
                                    <Youtube className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              <div className="md:col-span-3 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium">{banner.title}</h3>
                                    {banner.isActive ? (
                                      <Eye className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {banner.description || "Sin descripción"}
                                  </p>
                                </div>

                                <div className="flex items-center justify-end space-x-2 mt-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push(`/admin/store/banners/${banner.id}/edit`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setBannerToDelete(banner.id)
                                      setDeleteDialogOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El banner será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBanner}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
