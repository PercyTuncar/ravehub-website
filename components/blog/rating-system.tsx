"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getUserRating, ratePost, updatePostRating } from "@/lib/firebase/blog"

interface RatingSystemProps {
  postId: string
  initialRating?: number
  initialCount?: number
  onRatingChange?: (newRating: number, newCount: number) => void
}

export function RatingSystem({ postId, initialRating = 0, initialCount = 0, onRatingChange }: RatingSystemProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [averageRating, setAverageRating] = useState(initialRating)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRated, setHasRated] = useState(false)

  useEffect(() => {
    if (user && user.id) {
      const fetchUserRating = async () => {
        try {
          const rating = await getUserRating(postId, user.id)
          if (rating) {
            setUserRating(rating.rating)
            setComment(rating.comment || "")
            setHasRated(true)
          }
        } catch (error) {
          console.error("Error fetching user rating:", error)
        }
      }

      fetchUserRating()
    }
  }, [postId, user])

  const handleRatingClick = (rating: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión para calificar",
        description: "Debes iniciar sesión para poder calificar este artículo",
        variant: "destructive",
      })
      return
    }

    setUserRating(rating)
    setIsRatingDialogOpen(true)
  }

  // Modificar la función handleRatingSubmit para asegurar que todos los datos necesarios estén presentes
  const handleRatingSubmit = async () => {
    if (!user || !user.id || !postId || !userRating) {
      toast({
        title: "Error",
        description: "Falta información necesaria para calificar el post",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Submit the rating
      await ratePost({
        postId,
        userId: user.id,
        rating: userRating,
        comment,
        createdAt: new Date(),
      })

      // Update the post's average rating
      const newRatingData = await updatePostRating(postId)

      // Update local state
      setAverageRating(newRatingData.averageRating)
      setRatingCount(newRatingData.ratingCount)
      setHasRated(true)

      // Notify parent component
      if (onRatingChange) {
        onRatingChange(newRatingData.averageRating, newRatingData.ratingCount)
      }

      setIsRatingDialogOpen(false)

      toast({
        title: hasRated ? "Calificación actualizada" : "¡Gracias por tu calificación!",
        description: hasRated
          ? "Tu calificación ha sido actualizada correctamente"
          : "Tu calificación ha sido registrada correctamente",
      })
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu calificación. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (count: number, filled: number, hover: number, interactive = false) => {
    return Array.from({ length: count }).map((_, index) => {
      const starValue = index + 1
      const isFilled = starValue <= (hover || filled)

      return (
        <Star
          key={index}
          className={`h-6 w-6 ${
            isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          } ${interactive ? "cursor-pointer transition-colors" : ""}`}
          onClick={interactive ? () => handleRatingClick(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      )
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex">{renderStars(5, userRating || averageRating, hoverRating, !hasRated)}</div>
        <span className="text-sm text-muted-foreground">
          {averageRating > 0 ? (
            <>
              <span className="font-medium">{averageRating.toFixed(1)}</span> ({ratingCount}{" "}
              {ratingCount === 1 ? "valoración" : "valoraciones"})
            </>
          ) : (
            "Sin valoraciones"
          )}
        </span>
      </div>

      {hasRated && (
        <div className="text-sm">
          <span className="text-primary font-medium">Tu valoración: {userRating}/5</span>
          <Button variant="link" className="p-0 h-auto text-sm ml-2" onClick={() => setIsRatingDialogOpen(true)}>
            Editar
          </Button>
        </div>
      )}

      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasRated ? "Editar valoración" : "Valorar artículo"}</DialogTitle>
            <DialogDescription>
              {hasRated
                ? "Puedes modificar tu valoración y comentario"
                : "¿Qué te ha parecido este artículo? Tu opinión nos ayuda a mejorar."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center my-4">
            <div className="flex gap-1">{renderStars(5, userRating, hoverRating, true)}</div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rating-comment" className="text-sm font-medium">
              Comentario (opcional)
            </label>
            <Textarea
              id="rating-comment"
              placeholder="Comparte tu opinión sobre este artículo..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRatingSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : hasRated ? "Actualizar" : "Enviar valoración"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
