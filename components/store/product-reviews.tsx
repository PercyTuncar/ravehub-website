"use client"

import { useEffect, useState, useCallback } from "react"
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, AlertTriangle, ThumbsUp, Flag, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/utils"
import {
  getApprovedProductReviews,
  getUserProductReviews,
  createProductReview,
  updateProductReview,
} from "@/lib/firebase/reviews"
import type { ProductReview } from "@/types"

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [userReviews, setUserReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)

  // Review form state
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  // Stats
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0], // 5, 4, 3, 2, 1 stars
  })

  // Función para generar un ID único basado en la información del navegador y la IP
  const generateVisitorId = useCallback(async () => {
    try {
      // Obtener información del navegador
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      // Intentar obtener la IP del usuario (esto es una aproximación, ya que no podemos obtener la IP directamente desde el cliente)
      const ipResponse = await fetch("https://api.ipify.org?format=json")
      const ipData = await ipResponse.json()
      const ip = ipData.ip

      // Crear un hash simple combinando la información
      const dataToHash = JSON.stringify({ ...browserInfo, ip })
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataToHash))
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

      return hashHex
    } catch (error) {
      console.error("Error generating visitor ID:", error)
      // Fallback a un ID aleatorio si hay un error
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
  }, [])

  // Estado para almacenar el ID del visitante
  const [visitorId, setVisitorId] = useState<string | null>(null)
  // Estado para almacenar los IDs de las reseñas que el usuario ha marcado como útiles
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set())

  // Obtener el ID del visitante al cargar el componente
  useEffect(() => {
    const getVisitorId = async () => {
      const id = await generateVisitorId()
      setVisitorId(id)

      // Cargar las reseñas que el usuario ya ha marcado como útiles
      try {
        const visitorRef = doc(db, "visitorProfiles", id)
        const visitorDoc = await getDoc(visitorRef)

        if (visitorDoc.exists() && visitorDoc.data().likedReviews) {
          setLikedReviews(new Set(visitorDoc.data().likedReviews))
        }
      } catch (err) {
        console.error("Error loading liked reviews:", err)
      }
    }

    getVisitorId()
  }, [generateVisitorId])

  // Función para marcar una reseña como útil
  const markReviewAsHelpful = async (reviewId: string) => {
    if (!visitorId) return

    try {
      // Verificar si el usuario ya ha marcado esta reseña como útil
      if (likedReviews.has(reviewId)) {
        toast({
          title: "Ya marcada",
          description: "Ya has marcado esta reseña como útil anteriormente",
        })
        return
      }

      // Actualizar el contador de "útil" en la reseña
      const reviewRef = doc(db, "productReviews", reviewId)
      await updateDoc(reviewRef, {
        helpfulCount: increment(1),
      })

      // Actualizar el perfil del visitante
      const visitorRef = doc(db, "visitorProfiles", visitorId)
      const visitorDoc = await getDoc(visitorRef)

      if (visitorDoc.exists()) {
        // Actualizar el documento existente
        const currentLikedReviews = visitorDoc.data().likedReviews || []
        await updateDoc(visitorRef, {
          likedReviews: [...currentLikedReviews, reviewId],
          lastActive: new Date(),
          productViews: increment(1),
        })
      } else {
        // Crear un nuevo documento para este visitante
        await setDoc(visitorRef, {
          id: visitorId,
          likedReviews: [reviewId],
          firstSeen: new Date(),
          lastActive: new Date(),
          productViews: 1,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        })
      }

      // Actualizar el estado local
      setLikedReviews((prev) => new Set([...prev, reviewId]))

      // Actualizar la lista de reseñas para reflejar el nuevo contador
      setReviews(
        reviews.map((review) =>
          review.id === reviewId ? { ...review, helpfulCount: (review.helpfulCount || 0) + 1 } : review,
        ),
      )

      toast({
        title: "¡Gracias!",
        description: "Has marcado esta reseña como útil",
      })
    } catch (err) {
      console.error("Error marking review as helpful:", err)
      toast({
        title: "Error",
        description: "No se pudo marcar la reseña como útil",
        variant: "destructive",
      })
    }
  }

  // Reset editing state when dialog is closed
  useEffect(() => {
    if (!dialogOpen) {
      setIsEditing(false)
      setEditingReviewId(null)
      setRating(5)
      setTitle("")
      setComment("")
    }
  }, [dialogOpen])

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)

        const approvedReviews = await getApprovedProductReviews(productId)
        setReviews(approvedReviews)

        // Calculate stats
        if (approvedReviews.length > 0) {
          const total = approvedReviews.length
          const sum = approvedReviews.reduce((acc, review) => acc + review.rating, 0)
          const avg = sum / total

          // Calculate distribution
          const dist = [0, 0, 0, 0, 0]
          approvedReviews.forEach((review) => {
            dist[5 - review.rating]++
          })

          setStats({
            average: avg,
            total,
            distribution: dist,
          })
        }

        // If user is logged in, fetch their reviews for this product
        if (user && user.id) {
          const userProductReviews = await getUserProductReviews(user.id, productId)
          setUserReviews(userProductReviews)
        } else {
          // Reset user reviews if no valid user
          setUserReviews([])
        }
      } catch (err) {
        console.error("Error fetching reviews:", err)
        setError("No se pudieron cargar las reseñas")
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [productId, user])

  // Handle submit review
  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para dejar una reseña",
        variant: "destructive",
      })
      return
    }

    if (!isEditing && userReviews.length >= 3) {
      toast({
        title: "Límite alcanzado",
        description: "Ya has dejado 3 reseñas para este producto",
        variant: "destructive",
      })
      return
    }

    if (rating < 1 || rating > 5) {
      toast({
        title: "Calificación inválida",
        description: "Por favor selecciona una calificación entre 1 y 5 estrellas",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const reviewData = {
        productId,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        rating,
        title,
        comment,
        purchaseVerified: true, // Esto podría verificarse contra órdenes reales
        helpfulCount: 0,
        reportCount: 0,
      }

      // Only add userAvatar if it exists
      if (user.avatar) {
        reviewData.userAvatar = user.avatar
      }

      if (isEditing && editingReviewId) {
        // Actualizar reseña existente
        await updateProductReview(editingReviewId, reviewData)
        toast({
          title: "Reseña actualizada",
          description: "Tu reseña ha sido actualizada correctamente",
        })
      } else {
        // Crear nueva reseña
        await createProductReview(reviewData)
        toast({
          title: "Reseña enviada",
          description: "Tu reseña ha sido enviada y está pendiente de aprobación",
        })
      }

      // Update user reviews
      const updatedUserReviews = await getUserProductReviews(user.id, productId)
      setUserReviews(updatedUserReviews)

      // Reset form and editing state
      setRating(5)
      setTitle("")
      setComment("")
      setIsEditing(false)
      setEditingReviewId(null)

      // Close dialog
      setDialogOpen(false)
    } catch (err) {
      console.error("Error submitting review:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo enviar la reseña",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const startEditingReview = (review: ProductReview) => {
    setIsEditing(true)
    setEditingReviewId(review.id)
    setRating(review.rating)
    setTitle(review.title || "")
    setComment(review.comment || "")
    setDialogOpen(true)
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

  // Calculate percentage for rating distribution
  const getPercentage = (count: number) => {
    if (stats.total === 0) return 0
    return (count / stats.total) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Rating Summary */}
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle>Valoraciones</CardTitle>
            <CardDescription>
              Basado en {stats.total} {stats.total === 1 ? "reseña" : "reseñas"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl font-bold">{stats.average.toFixed(1)}</div>
              <div className="flex mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(stats.average) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.total} {stats.total === 1 ? "valoración" : "valoraciones"}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star, index) => (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium">{star}</span>
                    <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-400 h-2.5 rounded-full"
                      style={{ width: `${getPercentage(stats.distribution[5 - star])}%` }}
                    ></div>
                  </div>
                  <div className="w-10 text-xs text-right">{stats.distribution[5 - star]}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!user || (!isEditing && userReviews.length >= 3)}>
                  Escribir una reseña
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Editar reseña" : `Valorar ${productName}`}</DialogTitle>
                  <DialogDescription>Comparte tu opinión sobre este producto con otros compradores.</DialogDescription>
                </DialogHeader>

                {/* Rating Selection */}
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Calificación</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none"
                          aria-label={`${star} estrellas`}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoverRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la reseña</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Resume tu experiencia en una frase"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Comentario (opcional)</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="¿Qué te gustó o no te gustó? ¿Para qué usaste este producto?"
                      rows={4}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitReview} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : isEditing ? (
                      "Actualizar reseña"
                    ) : (
                      "Enviar reseña"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* Reviews List */}
        <div className="w-full md:w-2/3 space-y-4">
          <h3 className="text-lg font-semibold">Reseñas de clientes</h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8 text-destructive">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <span>{error}</span>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={review.userAvatar} alt={review.userName} />
                          <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{review.userName}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</div>
                        </div>
                      </div>
                      {review.purchaseVerified && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Compra verificada
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center mb-2">
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
                      {review.title && <span className="ml-2 font-medium">{review.title}</span>}
                    </div>
                    {review.comment && <p className="text-sm">{review.comment}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${likedReviews.has(review.id) ? "text-primary" : ""}`}
                              onClick={() => markReviewAsHelpful(review.id)}
                              disabled={!visitorId || likedReviews.has(review.id)}
                            >
                              <ThumbsUp
                                className={`h-4 w-4 mr-1 ${likedReviews.has(review.id) ? "fill-primary" : ""}`}
                              />
                              <span>{review.helpfulCount || 0}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {likedReviews.has(review.id)
                                ? "Ya has marcado esta reseña como útil"
                                : "Marcar como útil"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Flag className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reportar reseña</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay reseñas para este producto todavía.</div>
          )}

          {/* User's Reviews */}
          {user && userReviews.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Tus reseñas</h3>
              <div className="space-y-4">
                {userReviews.map((review) => (
                  <Card
                    key={review.id}
                    className={review.approved ? "border-solid border-green-500" : "border-dashed border-yellow-500"}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={review.userAvatar} alt={review.userName} />
                            <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{review.userName}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</div>
                          </div>
                        </div>
                        {review.approved ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            Aprobada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Pendiente de aprobación
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center mb-2">
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
                        {review.title && <span className="ml-2 font-medium">{review.title}</span>}
                      </div>
                      {review.comment && <p className="text-sm">{review.comment}</p>}
                    </CardContent>
                    <CardFooter className="pt-2">
                      {review.approved && (
                        <div className="flex justify-end w-full">
                          <Button variant="outline" size="sm" onClick={() => startEditingReview(review)}>
                            Editar reseña
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
