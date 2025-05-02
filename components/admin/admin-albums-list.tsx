"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Album } from "@/types/gallery"
import { getAllAlbums, deleteAlbum } from "@/lib/firebase/gallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
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
import { Edit, MoreVertical, Plus, Trash2 } from "lucide-react"

export function AdminAlbumsList() {
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadAlbums()
  }, [])

  const loadAlbums = async () => {
    setLoading(true)
    try {
      const loadedAlbums = await getAllAlbums()
      setAlbums(loadedAlbums)
    } catch (error) {
      console.error("Error al cargar álbumes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los álbumes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAlbum = (album: Album) => {
    setAlbumToDelete(album)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return

    setIsDeleting(true)
    try {
      await deleteAlbum(albumToDelete.id)

      // Eliminar el álbum del estado local
      setAlbums((prev) => prev.filter((album) => album.id !== albumToDelete.id))

      toast({
        title: "Álbum eliminado",
        description: "El álbum y todas sus imágenes se han eliminado correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar el álbum:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el álbum",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setAlbumToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Álbumes de la galería</h2>
        <Button onClick={() => router.push("/admin/galeria/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo álbum
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando álbumes...</div>
      ) : albums.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground mb-4">No hay álbumes creados todavía</p>
          <Button onClick={() => router.push("/admin/galeria/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primer álbum
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.id} className="overflow-hidden">
              <div className="relative aspect-video">
                {album.coverImage ? (
                  <Image src={album.coverImage || "/placeholder.svg"} alt={album.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">Sin imágenes</p>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 text-white rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/galeria/${album.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar álbum
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteAlbum(album)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar álbum
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{album.name}</h3>
                <p className="text-sm text-muted-foreground">{formatDate(album.date)}</p>
                <p className="text-sm mt-2 line-clamp-2">{album.description}</p>
              </CardContent>
              <CardFooter className="px-4 py-3 border-t flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {album.imageCount || 0} {(album.imageCount || 0) === 1 ? "imagen" : "imágenes"}
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/galeria/${album.id}`)}>
                  Gestionar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar álbum</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el álbum &quot;{albumToDelete?.name}&quot;? Esta acción eliminará
              todas las imágenes asociadas y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAlbum} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
