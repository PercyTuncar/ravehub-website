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
import { Check, Trash, AlertTriangle, Loader2, Star } from "lucide-react"
import { getPendingProductReviews, approveProductReview, deleteProductReview } from "@/lib/firebase/reviews"
import { getProductById } from "@/lib/firebase/store"
import type { ProductReview, Product } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AdminReviewsList() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productCache, setProductCache] = useState<Record<string, Product>>({})

  // Action states
  const [reviewToDelete, setReviewToDelete] = useState<ProductReview | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch reviews
  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const reviewsData = await getPendingProductReviews()
      setReviews(reviewsData)

      // Fetch product details for each review
      const productIds = [...new Set(reviewsData.map((review) => review.productId))]
      const productPromises = productIds.map(async (productId) => {
        const product = await getProductById(productId)
        return { productId, product }
      })

      const products = await Promise.all(productPromises)
      const productMap: Record<string, Product> = {}

      products.forEach(({ productId, product }) => {
        if (product) {
          productMap[productId] = product
        }
      })

      setProductCache(productMap)
    } catch (err) {
      console.error("Error fetching reviews:", err)
      setError("Ocurrió un error al cargar las reseñas")
    } finally {
      setLoading(false)
    }
  }

  // Handle approve review
  const handleApprove = async (review: ProductReview) => {
    if (!user) return

    try {
      setIsProcessing(true)
      await approveProductReview(review.id, user.id)

      // Update reviews list
      setReviews(reviews.filter((r) => r.id !== review.id))

      toast({
        title: "Reseña aprobada",
        description: "La reseña ha sido aprobada exitosamente",
      })
    } catch (error) {
      console.error("Error approving review:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al aprobar la reseña",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle delete review
  const handleDeleteClick = (review: ProductReview) => {
    setReviewToDelete(review)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!reviewToDelete) return

    try {
      setIsProcessing(true)
      await deleteProductReview(reviewToDelete.id)

      // Update reviews list
      setReviews(reviews.filter((r) => r.id !== reviewToDelete.id))

      toast({
        title: "Reseña eliminada",
        description: "La reseña ha sido eliminada exitosamente",
      })
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la reseña",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsDeleteDialogOpen(false)
      setReviewToDelete(null)
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reseñas pendientes de aprobación</CardTitle>
        <Button variant="outline" onClick={fetchReviews} disabled={loading}>
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando reseñas...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-destructive">
                    <div className="flex justify-center items-center">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.userAvatar} alt={review.userName} />
                          <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{review.userName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{productCache[review.productId]?.name || review.productId}</TableCell>
                    <TableCell>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        {review.title && <div className="font-medium">{review.title}</div>}
                        {review.comment && <div className="line-clamp-2 text-sm">{review.comment}</div>}
                        {!review.title && !review.comment && (
                          <span className="text-muted-foreground">Sin comentario</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(review.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(review)}
                          disabled={isProcessing}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(review)}
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
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No hay reseñas pendientes de aprobación
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
              Esta acción eliminará permanentemente la reseña. Esta acción no se puede deshacer.
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
