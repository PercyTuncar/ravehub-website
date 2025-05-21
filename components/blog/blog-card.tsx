"use client"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { BlogPost, ReactionType } from "@/types"
import { Share, MessageSquare, Eye, Star } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { addOrUpdateReaction, getUserReaction, removeReaction, getPostReactions } from "@/lib/firebase/blog"
import { SmilePlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { OptimizedImage } from "./optimized-image"
import { memo } from "react"
import type { BlogCardProps } from "@/types" // Import BlogCardProps

// Reaction emoji mapping
const reactionEmojis: Record<ReactionType, string> = {
  hot: "🥵",
  crazy: "🤪",
  somos: "👌",
  excited: "😈",
  scream: "🌈",
  ono: "🌸",
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
}

// Reaction color mapping - tonos pastel suaves
const reactionColors: Record<ReactionType, string> = {
  hot: "bg-red-200",
  crazy: "bg-purple-200",
  somos: "bg-green-200",
  excited: "bg-pink-200",
  scream: "bg-indigo-200",
  ono: "bg-pink-100",
  like: "bg-blue-200",
  love: "bg-red-100",
  haha: "bg-yellow-200",
  wow: "bg-orange-200",
  sad: "bg-blue-100",
  angry: "bg-red-200",
}

// Reaction label mapping
const reactionLabels: Record<ReactionType, string> = {
  hot: "Me calienta",
  crazy: "Me aloca",
  somos: "¡Somos, Gente!",
  excited: "Me excita",
  scream: "Me hace gritar ¡Aaaahhh!",
  ono: "Oño",
  like: "Me gusta",
  love: "Me encanta",
  haha: "Me divierte",
  wow: "Me sorprende",
  sad: "Me entristece",
  angry: "Me enoja",
}

// Función para formatear números grandes con sufijo "k"
function formatCount(count: number): string {
  if (count >= 1000) {
    const formattedCount = count / 1000
    // Si es menor a 10k, mostrar un decimal (ej: 1.5k)
    // Si es 10k o más, mostrar sin decimales (ej: 10k)
    return formattedCount < 10 ? `${formattedCount.toFixed(1)}k` : `${Math.floor(formattedCount)}k`
  }
  return count.toString()
}

// Star Rating component
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center ml-auto">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-yellow-500" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-yellow-500" />
      ))}
      {rating > 0 && <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>}
    </div>
  )
}

// This component will handle the reaction functionality
function PostCardReactions({ post }: { post: BlogPost }) {
  const { user } = useAuth()
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const [isHoveringPopover, setIsHoveringPopover] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Función para limpiar cualquier timeout pendiente
  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  // Mantener abierto mientras el cursor esté sobre el botón
  const handleButtonMouseEnter = useCallback(() => {
    clearCloseTimeout()
    setIsHoveringButton(true)
    setIsOpen(true)
  }, [clearCloseTimeout])

  const handleButtonMouseLeave = useCallback(() => {
    setIsHoveringButton(false)

    // Solo programar el cierre si el cursor no está sobre el popover
    if (!isHoveringPopover) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 300)
    }
  }, [isHoveringPopover, clearCloseTimeout])

  // Mantener abierto mientras el cursor esté sobre el popover
  const handlePopoverMouseEnter = useCallback(() => {
    clearCloseTimeout()
    setIsHoveringPopover(true)
  }, [clearCloseTimeout])

  const handlePopoverMouseLeave = useCallback(() => {
    setIsHoveringPopover(false)

    // Solo programar el cierre si el cursor no está sobre el botón
    if (!isHoveringButton) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 300)
    }
  }, [isHoveringButton, clearCloseTimeout])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const [hoverTimeoutRef, setHoverTimeoutRef] = useState<NodeJS.Timeout | null>(null)
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleLongPress = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const handleMouseDown = useCallback(() => {
    longPressTimeoutRef.current = setTimeout(handleLongPress, 500) // 500ms for long press
  }, [handleLongPress])

  const handleMouseUp = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback(() => {
    longPressTimeoutRef.current = setTimeout(handleLongPress, 500)
  }, [handleLongPress])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }, [])

  // Load the user's current reaction when the component mounts
  useEffect(() => {
    const loadUserReaction = async () => {
      if (!user?.id || !post.id) return

      try {
        setIsLoading(true)
        const reaction = await getUserReaction(post.id, user.id)
        setUserReaction(reaction ? reaction.reactionType : null)
      } catch (error) {
        console.error("Error loading user reaction:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserReaction()
  }, [user?.id, post.id])

  // Handle reaction selection
  const handleReaction = async (type: ReactionType) => {
    if (!user?.id) {
      toast({
        title: "Inicia sesión para reaccionar",
        description: "Debes iniciar sesión para poder reaccionar a este post",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // If user clicks the same reaction, remove it
      if (userReaction === type) {
        await removeReaction(post.id, user.id)
        setUserReaction(null)
        toast({
          title: "Reacción eliminada",
          description: "Tu reacción ha sido eliminada correctamente",
        })
      } else {
        // Add or update reaction
        const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario"
        await addOrUpdateReaction(post.id, user.id, userName, user.photoURL, type)
        setUserReaction(type)
        toast({
          title: userReaction ? "Reacción actualizada" : "Reacción añadida",
          description: `Has reaccionado con "${reactionEmojis[type]} ${type}"`,
        })
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu reacción",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  // Get the current reaction emoji if user has reacted
  const currentReactionEmoji = userReaction ? reactionEmojis[userReaction] : null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          ref={buttonRef}
          className={`flex-1 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 py-1 rounded transition-all duration-200 ${userReaction ? "text-primary" : ""} px-1`}
          disabled={isLoading}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
        >
          {isLoading ? (
            <div className="animate-pulse flex items-center gap-1">
              <SmilePlus size={18} />
              <span>Cargando...</span>
            </div>
          ) : (
            <>
              {currentReactionEmoji ? <span className="text-lg">{currentReactionEmoji}</span> : <SmilePlus size={18} />}
              <span
                className={`select-none truncate max-w-[80px] sm:max-w-none ${
                  userReaction
                    ? `font-medium ${reactionColors[userReaction].replace("bg-", "text-").replace("200", "600").replace("100", "500")}`
                    : ""
                }`}
              >
                {userReaction ? reactionLabels[userReaction] : "Reacciona"}
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>

      {/* Replace the PopoverContent with this animated version */}
      <AnimatePresence>
        {isOpen && (
          <PopoverContent
            className="w-auto p-2"
            align="center"
            forceMount
            sideOffset={5}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2 max-w-md mx-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {Object.entries(reactionEmojis).map(([type, emoji]) => (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          userReaction === type ? "bg-primary/10 ring-2 ring-primary/30" : "hover:bg-gray-100/80"
                        }`}
                        onClick={() => handleReaction(type as ReactionType)}
                        whileHover={{
                          scale: 1.05,
                          y: -2,
                          transition: { duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          className="text-xl sm:text-2xl mb-1"
                          whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
                        >
                          {emoji}
                        </motion.span>
                        <span className="text-[10px] sm:text-xs font-medium text-center text-gray-700 leading-tight">
                          {reactionLabels[type as ReactionType]}
                        </span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{reactionLabels[type as ReactionType]}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>
  )
}

// Usar memo para evitar re-renders innecesarios
export const BlogCard = memo(function BlogCard({ post, priority = false }: BlogCardProps) {
  // Formatear la fecha de publicación
  const formattedDate = post.publishDate
    ? format(new Date(post.publishDate), "dd MMMM, yyyy", { locale: es })
    : "Fecha no disponible"

  const { user } = useAuth()
  const [commentCount, setCommentCount] = useState(0)
  const [reactions, setReactions] = useState<{
    total: number
    topReactions: ReactionType[]
    lastReactor?: string
  }>({
    total: 0,
    topReactions: [],
  })
  const [shareCount, setShareCount] = useState(post.socialShares?.total || 0)
  const [viewCount, setViewCount] = useState(post.viewCount || 0)

  // Fetch reaction and comment data
  useEffect(() => {
    const fetchReactionsAndComments = async () => {
      try {
        // Fetch reactions
        const reactionsData = await getPostReactions(post.id)

        // Actualizar el estado con los datos de reacciones
        setReactions({
          total: reactionsData.summary.total,
          topReactions: reactionsData.summary.topReactions,
          lastReactor: reactionsData.reactions.length > 0 ? reactionsData.reactions[0].userName : undefined,
        })

        // Fetch comments
        const commentsRef = collection(db, "blogComments")
        const commentsQuery = query(commentsRef, where("postId", "==", post.id))
        const commentsSnapshot = await getDocs(commentsQuery)
        setCommentCount(commentsSnapshot.size)
      } catch (error) {
        console.error("Error fetching reactions and comments:", error)
      }
    }

    fetchReactionsAndComments()
  }, [post.id])

  const handleShare = async () => {
    try {
      // Basic sharing functionality
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: `${window.location.origin}/blog/${post.slug}`,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`)
        alert("Link copiado al portapapeles")
      }

      // Track share count
      // We'd ideally check for duplicates using IP + fingerprinting
      // This is a simplified implementation
      const postRef = doc(db, "blog", post.id)
      await updateDoc(postRef, {
        "socialShares.total": increment(1),
      })

      setShareCount((prev) => prev + 1)
    } catch (error) {
      console.error("Error sharing post:", error)
    }
  }

  const imageUrl = post.featuredImageUrl || "/images/placeholder-blog.jpg"

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Imagen destacada con dimensiones fijas para evitar CLS */}
      <div className="relative h-48 w-full">
        <Link href={`/blog/${post.slug}`} aria-label={post.title}>
          <OptimizedImage
            src={imageUrl || "/placeholder.svg"}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
            quality={priority ? 85 : 75}
            loading={priority ? "eager" : "lazy"}
          />
        </Link>
      </div>

      {/* Contenido */}
      <div className="p-5">
        {/* Fecha */}
        <div className="text-sm text-gray-500 mb-2">{formattedDate}</div>

        {/* Título */}
        <h3 className="text-xl font-bold mb-3 line-clamp-2">
          <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
            {post.title}
          </Link>
        </h3>

        {/* Extracto */}
        <p className="text-gray-700 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <Link href={`/blog/${post.slug}`} className="text-blue-600 hover:text-blue-800 font-medium">
            Leer más
          </Link>

          {/* Stats */}
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-4">{viewCount} vistas</span>
            <span>{commentCount} comentarios</span>
          </div>
        </div>
      </div>

      {/* Reactions */}
      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          {reactions.topReactions.length > 0 && (
            <div className="flex -space-x-2">
              {reactions.topReactions.map((reaction, index) => (
                <span
                  key={index}
                  className={`${reactionColors[reaction]} h-6 w-6 flex items-center justify-center text-base rounded-full shadow-sm border border-white transform transition-transform hover:scale-110 hover:-translate-y-1`}
                  title={reactionLabels[reaction]}
                >
                  {reactionEmojis[reaction]}
                </span>
              ))}
            </div>
          )}
          {reactions.total > 0 && (
            <span className="ml-2 font-medium bg-gray-50 px-2 py-0.5 rounded-full text-gray-600 border border-gray-100">
              {reactions.total}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <MessageSquare size={14} />
            {formatCount(commentCount)}
          </span>
          <span className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <Share size={14} />
            {shareCount > 0 && ` ${formatCount(shareCount)}`}
          </span>
          <span className="flex items-center gap-1 hover:text-gray-700 transition-colors">
            <Eye size={14} />
            {formatCount(viewCount)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t pt-2 flex justify-between text-xs sm:text-sm">
        <PostCardReactions post={post} />
        <Link
          href={`/blog/${post.slug}`}
          className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 py-1 rounded px-1"
        >
          <MessageSquare size={14} />
          <span className="truncate">Comenta</span>
        </Link>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 py-1 rounded px-1"
        >
          <Share size={14} />
          <span className="truncate">Comparte</span>
        </button>
      </div>
    </div>
  )
})

// Skeleton para BlogCard
export function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="h-48 bg-gray-200"></div>

      {/* Contenido skeleton */}
      <div className="p-5 space-y-3">
        {/* Fecha skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>

        {/* Título skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>

        {/* Extracto skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Footer skeleton */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  )
}
