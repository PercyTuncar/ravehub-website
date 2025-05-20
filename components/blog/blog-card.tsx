"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { BlogPost, ReactionType } from "@/types"
import { getTimeAgo } from "@/lib/utils"
import { Share, MessageSquare, Eye, Star } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { addOrUpdateReaction, getUserReaction, removeReaction, getPostReactions } from "@/lib/firebase/blog"
import { SmilePlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

// Add this after all the imports but before the BlogCardProps interface
function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300">
      <div className="p-4">
        <div className="flex items-start mb-2">
          {/* Author avatar and info skeleton */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
          </div>
          {/* Rating skeleton */}
          <div className="ml-auto flex">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Post excerpt skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Image skeleton */}
        <div className="relative mb-3 rounded-lg overflow-hidden">
          <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
          <div className="bg-gray-100 p-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Reactions and stats skeleton */}
        <div className="flex justify-between items-center text-sm mb-3">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-5 w-5 rounded-full bg-gray-200 animate-pulse"></div>
              ))}
            </div>
            <div className="ml-2 h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="border-t pt-2 flex justify-between">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 py-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface BlogCardProps {
  post: BlogPost
}

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

// Reaction color mapping
const reactionColors: Record<ReactionType, string> = {
  hot: "bg-red-500",
  crazy: "bg-purple-500",
  somos: "bg-green-500",
  excited: "bg-pink-500",
  scream: "bg-indigo-500",
  ono: "bg-pink-300",
  like: "bg-blue-500",
  love: "bg-red-500",
  haha: "bg-yellow-500",
  wow: "bg-orange-500",
  sad: "bg-blue-400",
  angry: "bg-red-600",
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
  const { toast } = useToast()

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

  // Get the current reaction emoji if user has reacted
  const currentReactionEmoji = userReaction ? reactionEmojis[userReaction] : null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          ref={buttonRef}
          className={`flex-1 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 py-1 rounded transition-all duration-200 ${userReaction ? "text-primary" : ""}`}
          disabled={isLoading}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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
                className={`select-none ${userReaction ? reactionColors[userReaction].replace("bg-", "text-") : ""}`}
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
          <PopoverContent className="w-auto p-2" align="center" forceMount>
            <motion.div
              className="grid grid-cols-4 grid-rows-3 gap-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {Object.entries(reactionEmojis).map(([type, emoji]) => (
                <TooltipProvider key={type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        className={`h-10 w-10 rounded-full text-xl transition-all duration-200 hover:scale-110 hover:bg-gray-100 ${
                          userReaction === type ? "bg-primary/10 text-primary" : ""
                        }`}
                        onClick={() => handleReaction(type as ReactionType)}
                        disabled={isLoading}
                        whileHover={{
                          scale: 1.2,
                          y: -8,
                          transition: { duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
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

// Change this line:
// export default function BlogCard({ post }: BlogCardProps) {
export function BlogCard({ post }: BlogCardProps) {
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

  // Format date for display
  const timeAgo = post.publishDate ? getTimeAgo(new Date(post.publishDate)) : "Sin fecha"
  const imageUrl = post.featuredImageUrl || "/images/placeholder-blog.jpg"

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="p-4">
        <div className="flex items-start mb-2 opacity-90">
          <div className="flex-shrink-0 mr-3">
            <Image
              src={post.authorImageUrl || "/placeholder.svg?height=40&width=40"}
              alt={post.author || "Author"}
              width={40}
              height={40}
              className="rounded-full object-cover"
              loading="lazy"
              sizes="40px"
            />
          </div>
          <div>
            <h3 className="text-sm text-gray-800">{post.author || "Author"}</h3>
            <div className="text-gray-400 text-xs flex items-center gap-1">
              {timeAgo} ·{post.category && <span className="text-primary">{post.category.name}</span>}
            </div>
          </div>
          <StarRating rating={post.averageRating || 0} />
        </div>

        <Link href={`/blog/${post.slug}`}>
          <p className="text-gray-700 text-sm mb-3 line-clamp-3">
            {post.excerpt || post.content?.substring(0, 150) || "Sin descripción"}
          </p>

          <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={post.title}
              width={800}
              height={400}
              className="w-full object-cover"
              style={{ maxHeight: "400px" }}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
            <div className="bg-gray-100 p-3 text-base font-medium text-gray-800">{post.title}</div>
          </div>
        </Link>

        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            {reactions.topReactions.length > 0 && (
              <div className="flex -space-x-1">
                {reactions.topReactions.map((reaction, index) => (
                  <span
                    key={index}
                    className={`${reactionColors[reaction]} h-5 w-5 flex items-center justify-center text-xs text-white rounded-full`}
                    title={reaction}
                  >
                    {reactionEmojis[reaction]}
                  </span>
                ))}
              </div>
            )}
            {reactions.total > 0 && <span className="ml-2">{reactions.total}</span>}
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare size={14} />
              {formatCount(commentCount)}
            </span>
            <span className="flex items-center gap-1">
              <Share size={14} />
              {shareCount > 0 && ` ${formatCount(shareCount)}`}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {formatCount(viewCount)}
            </span>
          </div>
        </div>

        <div className="border-t pt-2 flex justify-between">
          <PostCardReactions post={post} />
          <Link
            href={`/blog/${post.slug}`}
            className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 py-1 rounded text-sm"
          >
            <MessageSquare size={14} />
            <span>Comenta</span>
          </Link>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1 text-gray-600 hover:bg-gray-100 py-1 rounded text-sm"
          >
            <Share size={14} />
            <span>Comparte</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// And add this at the end of the file:
export { BlogCardSkeleton }
export default BlogCard
