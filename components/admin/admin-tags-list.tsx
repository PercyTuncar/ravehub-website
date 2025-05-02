"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAllTags, deleteTag } from "@/lib/firebase/blog"
import type { BlogTag } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function AdminTagsList() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [tagToDelete, setTagToDelete] = useState<BlogTag | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const fetchedTags = await getAllTags()
        setTags(fetchedTags)
      } catch (error) {
        console.error("Error fetching tags:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las etiquetas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleDeleteTag = async () => {
    if (!tagToDelete) return

    setIsDeleting(true)
    try {
      await deleteTag(tagToDelete.id)
      setTags(tags.filter((tag) => tag.id !== tagToDelete.id))
      toast({
        title: "Etiqueta eliminada",
        description: `La etiqueta "${tagToDelete.name}" ha sido eliminada correctamente.`,
      })
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la etiqueta",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setTagToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Etiquetas del Blog</h2>
        <Link href="/admin/blog/etiquetas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Etiqueta
          </Button>
        </Link>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No hay etiquetas</h3>
          <p className="text-gray-500 mb-4">Aún no se han creado etiquetas para el blog.</p>
          <Link href="/admin/blog/etiquetas/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera etiqueta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Destacada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>{tag.slug}</TableCell>
                  <TableCell>{tag.postCount || 0}</TableCell>
                  <TableCell>
                    {tag.isActive ? (
                      <Badge variant="default" className="bg-green-500">
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tag.featured ? (
                      <Badge variant="default" className="bg-blue-500">
                        Destacada
                      </Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/blog/etiquetas/${tag.slug}`} target="_blank">
                        <Button variant="outline" size="icon">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Button>
                      </Link>
                      <Link href={`/admin/blog/etiquetas/${tag.id}/edit`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTagToDelete(tag)}
                        disabled={tag.postCount > 0}
                        className={tag.postCount > 0 ? "cursor-not-allowed opacity-50" : ""}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la etiqueta &quot;{tagToDelete?.name}&quot;.
              {tagToDelete?.postCount > 0 && (
                <p className="mt-2 text-red-500 font-semibold">
                  No se puede eliminar esta etiqueta porque está asociada a {tagToDelete.postCount} posts.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              disabled={isDeleting || (tagToDelete?.postCount || 0) > 0}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
