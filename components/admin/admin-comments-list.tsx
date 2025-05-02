"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Check, Trash, AlertTriangle, Loader2 } from "lucide-react"
import { getUnapprovedComments, approveComment, deleteComment } from "@/lib/firebase/blog"
import type { BlogComment } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

export function AdminCommentsList() {
  const { user } = useAuth()
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Action states
  const [commentToDelete, setCommentToDelete] = useState<BlogComment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)
      const commentsData = await getUnapprovedComments()
      setComments(commentsData)
    } catch (err) {
      console.error("Error fetching comments:", err)
      setError("Ocurrió un error al cargar los comentarios")
    } finally {
      setLoading(false)
    }
  }

  // Handle approve comment
  const handleApprove = async (comment: BlogComment) => {
    if (!user) return

    try {
      setIsProcessing(true)
      await approveComment(comment.id, user.id)

      // Update comments list
      setComments(comments.filter((c) => c.id !== comment.id))

      toast({
        title: "Comentario aprobado",
        description: "El comentario ha sido aprobado exitosamente",
      })
    } catch (error) {
      console.error("Error approving comment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al aprobar el comentario",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle delete comment
  const handleDeleteClick = (comment: BlogComment) => {
    setCommentToDelete(comment)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!commentToDelete) return

    try {
      setIsProcessing(true)
      await deleteComment(commentToDelete.id)

      // Update comments list
      setComments(comments.filter((c) => c.id !== commentToDelete.id))

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el comentario",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Comentarios pendientes de aprobación</CardTitle>
        <Button variant="outline" onClick={fetchComments} disabled={loading}>
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Contenido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando comentarios...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-destructive">
                    <div className="flex justify-center items-center">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div className="font-medium">{comment.userName}</div>
                      <div className="text-xs text-muted-foreground">{comment.userId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <div className="line-clamp-2">{comment.content}</div>
                        <div className="text-xs text-muted-foreground mt-1">Post ID: {comment.postId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(comment.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(comment)}
                          disabled={isProcessing}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(comment)}
                          disabled={isProcessing}
                        >
                          <Trash className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No hay comentarios pendientes de aprobación
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el comentario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
