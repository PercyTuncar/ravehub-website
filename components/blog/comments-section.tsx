"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { formatTimeAgo } from "@/lib/utils"
import {
  getComments,
  addComment,
  likeComment,
  unlikeComment,
  editComment,
  deleteComment,
  getCommentReactionCounts,
  getUserCommentReaction,
  addCommentReaction,
  removeCommentReaction,
  pinComment,
  unpinComment,
} from "@/lib/firebase/blog"
import { getUserById } from "@/lib/firebase/users"
import {
  Loader2,
  MessageCircle,
  AlertCircle,
  Reply,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X,
  Smile,
  Pin,
  PinOff,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { BlogComment } from "@/types/blog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CommentReactionsModal } from "./comment-reactions-modal"

interface CommentsSectionProps {
  postId: string
}

type CommentReactionType =
  | "hot"
  | "crazy"
  | "people"
  | "excited"
  | "scream"
  | "ono"
  | "like"
  | "heart"
  | "funny"
  | "surprise"
  | "sad"
  | "angry"

// Add these fields to the BlogComment interface
interface ExtendedBlogComment extends BlogComment {
  isPinned?: boolean
  pinnedAt?: Date
  pinnedBy?: string
}

// Add this function after the imports
function renderTextWithLinks(text: string) {
  if (!text) return ""

  // Regular expression to match URLs starting with http://, https://, or www.
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g

  // Find all URLs in the text
  const urls = text.match(urlRegex) || []

  if (urls.length === 0) {
    // If no URLs found, return the original text
    return text
  }

  // Create an array to hold the result
  const result = []

  // Split the text by URLs and process each part
  let lastIndex = 0
  let index = 0

  for (const url of urls) {
    // Find the position of this URL in the text
    const urlIndex = text.indexOf(url, lastIndex)

    // Add the text before the URL
    if (urlIndex > lastIndex) {
      result.push(<span key={`text-${index}`}>{text.substring(lastIndex, urlIndex)}</span>)
      index++
    }

    // Add the URL as a link
    const href = url.startsWith("www.") ? `https://${url}` : url
    result.push(
      <a
        key={`link-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {url}
      </a>,
    )
    index++

    // Update lastIndex to after this URL
    lastIndex = urlIndex + url.length
  }

  // Add any remaining text after the last URL
  if (lastIndex < text.length) {
    result.push(<span key={`text-${index}`}>{text.substring(lastIndex)}</span>)
  }

  return result
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<BlogComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [commentSubmitted, setCommentSubmitted] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [replyCharCount, setReplyCharCount] = useState(0)
  const [userStats, setUserStats] = useState({
    commentCount: 0,
    replyCount: 0,
    lastCommentTime: null as Date | null,
  })
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({})
  const [commentReactions, setCommentReactions] = useState<Record<string, Record<CommentReactionType, number>>>({})
  const [userReactions, setUserReactions] = useState<Record<string, CommentReactionType | null>>({})
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null)
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false)
  const [reactionsSummary, setReactionsSummary] = useState<{
    total: number
    types: Record<CommentReactionType, number>
    topReactions: CommentReactionType[]
  }>({
    total: 0,
    types: {} as Record<CommentReactionType, number>,
    topReactions: [],
  })
  const [pinnedComments, setPinnedComments] = useState<ExtendedBlogComment[]>([])

  const getReactionInfo = (type: CommentReactionType) => {
    const reactionInfo: Record<CommentReactionType, { emoji: string; label: string }> = {
      hot: { emoji: "🥵", label: "Me calienta" },
      crazy: { emoji: "🤪", label: "Me aloca" },
      people: { emoji: "👌", label: "¡Somos, Gente!" },
      excited: { emoji: "😈", label: "Me excita" },
      scream: { emoji: "🌈", label: "Me hace gritar ¡Aaaahhh!" },
      ono: { emoji: "🌸", label: "Oño" },
      like: { emoji: "👍", label: "Me gusta" },
      heart: { emoji: "❤️", label: "Me encanta" },
      funny: { emoji: "😂", label: "Me divierte" },
      surprise: { emoji: "😮", label: "Me sorprende" },
      sad: { emoji: "😢", label: "Me entristece" },
      angry: { emoji: "😡", label: "Me enoja" },
    }
    return reactionInfo[type]
  }

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true)
      const commentsData = await getComments(postId)

      // Collect unique user IDs from comments
      const userIds = new Set<string>()
      commentsData.forEach((comment) => {
        if (comment.userId) userIds.add(comment.userId)
      })

      // Fetch user photos
      const photoPromises = Array.from(userIds).map(async (userId) => {
        try {
          const userData = await getUserById(userId)
          return { userId, photoURL: userData?.photoURL || "" }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error)
          return { userId, photoURL: "" }
        }
      })

      const userPhotoResults = await Promise.all(photoPromises)
      const photoMap: Record<string, string> = {}
      userPhotoResults.forEach((result) => {
        photoMap[result.userId] = result.photoURL
      })
      setUserPhotos(photoMap)

      // Separate pinned comments from regular comments
      const pinned: ExtendedBlogComment[] = []
      const regular: BlogComment[] = []

      commentsData.forEach((comment) => {
        if (comment.isPinned) {
          pinned.push(comment as ExtendedBlogComment)
        } else if (!comment.parentCommentId) {
          regular.push(comment)
        }
      })

      // Sort pinned comments by pinnedAt (newest first)
      pinned.sort((a, b) => {
        const dateA = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0
        const dateB = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0
        return dateB - dateA
      })

      setPinnedComments(pinned)

      // Organize comments into a hierarchical structure
      const parentComments: BlogComment[] = []
      const commentMap = new Map<string, BlogComment>()

      // First pass: create a map of all comments by ID
      commentsData.forEach((comment) => {
        // Ensure likedBy is always an array
        const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : []
        commentMap.set(comment.id, { ...comment, replies: [], likedBy })
      })

      // Second pass: organize into parent-child relationships
      commentsData.forEach((comment) => {
        if (comment.parentCommentId) {
          const parent = commentMap.get(comment.parentCommentId)
          if (parent && parent.replies) {
            parent.replies.push(
              commentMap.get(comment.id) || {
                ...comment,
                likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
              },
            )
          }
        } else if (!comment.isPinned) {
          parentComments.push(
            commentMap.get(comment.id) || {
              ...comment,
              likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
            },
          )
        }
      })

      // Sort parent comments by date (newest first)
      parentComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Sort replies by date (oldest first) within each parent
      parentComments.forEach((comment) => {
        if (comment.replies) {
          comment.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        }
      })

      setComments(parentComments)

      // Load reactions for each comment
      const reactionsPromises = [...pinned, ...parentComments].map(async (comment) => {
        const reactionCounts = await getCommentReactionCounts(comment.id)
        return { commentId: comment.id, reactionCounts }
      })

      const reactionsResults = await Promise.all(reactionsPromises)

      const newCommentReactions: Record<string, Record<CommentReactionType, number>> = {}
      reactionsResults.forEach(({ commentId, reactionCounts }) => {
        newCommentReactions[commentId] = reactionCounts
      })

      setCommentReactions(newCommentReactions)

      // Load reactions for replies too
      const replyReactionsPromises: Promise<{
        commentId: string
        reactionCounts: Record<CommentReactionType, number>
      }>[] = []

      parentComments.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach((reply) => {
            replyReactionsPromises.push(
              getCommentReactionCounts(reply.id).then((reactionCounts) => ({
                commentId: reply.id,
                reactionCounts,
              })),
            )
          })
        }
      })

      const replyReactionsResults = await Promise.all(replyReactionsPromises)
      replyReactionsResults.forEach(({ commentId, reactionCounts }) => {
        newCommentReactions[commentId] = reactionCounts
      })

      // Load user reactions if user is logged in
      if (user) {
        const userReactionsPromises = [...pinned, ...parentComments].map(async (comment) => {
          if (!comment.id || !user.id) {
            return { commentId: comment.id || "unknown", reactionType: null }
          }
          const userReaction = await getUserCommentReaction(comment.id, user.id)
          return { commentId: comment.id, reactionType: userReaction?.reactionType || null }
        })

        const userReactionsResults = await Promise.all(userReactionsPromises)

        const newUserReactions: Record<string, CommentReactionType | null> = {}
        userReactionsResults.forEach(({ commentId, reactionType }) => {
          if (commentId) {
            newUserReactions[commentId] = reactionType
          }
        })

        setUserReactions(newUserReactions)
      }

      // Load user reactions for replies if user is logged in
      if (user) {
        const userReplyReactionsPromises: Promise<{ commentId: string; reactionType: CommentReactionType | null }>[] =
          []

        parentComments.forEach((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach((reply) => {
              if (reply.id && user.id) {
                userReplyReactionsPromises.push(
                  getUserCommentReaction(reply.id, user.id).then((userReaction) => ({
                    commentId: reply.id,
                    reactionType: userReaction?.reactionType || null,
                  })),
                )
              } else {
                userReplyReactionsPromises.push(
                  Promise.resolve({
                    commentId: reply.id || "unknown",
                    reactionType: null,
                  }),
                )
              }
            })
          }
        })

        const userReplyReactionsResults = await Promise.all(userReplyReactionsPromises)
        const newUserReactions: Record<string, CommentReactionType | null> = {}
        userReplyReactionsResults.forEach(({ commentId, reactionType }) => {
          if (commentId) {
            newUserReactions[commentId] = reactionType
          }
        })
        setUserReactions(newUserReactions)
      }

      // Calculate user stats if user is logged in
      if (user) {
        const userComments = commentsData.filter((c) => c.userId === user.id && !c.parentCommentId)
        const userReplies = commentsData.filter((c) => c.userId === user.id && c.parentCommentId)

        const lastComment = [...userComments, ...userReplies].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]

        setUserStats({
          commentCount: userComments.length,
          replyCount: userReplies.length,
          lastCommentTime: lastComment ? new Date(lastComment.createdAt) : null,
        })
      }
    } catch (error) {
      console.error("Error loading comments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [postId, user, toast])

  const handlePinComment = async (commentId: string) => {
    if (!user || user.role !== "admin") return

    try {
      await pinComment(commentId, user.id)
      toast({
        title: "Comentario fijado",
        description: "El comentario ha sido fijado correctamente",
      })
      loadComments()
    } catch (error) {
      console.error("Error pinning comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al fijar el comentario. Inténtalo nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleUnpinComment = async (commentId: string) => {
    if (!user || user.role !== "admin") return

    try {
      await unpinComment(commentId)
      toast({
        title: "Comentario desfijado",
        description: "El comentario ha sido desfijado correctamente",
      })
      loadComments()
    } catch (error) {
      console.error("Error unpinning comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al desfijar el comentario. Inténtalo nuevamente.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewComment(value)
    setCharCount(value.length)
  }

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setReplyContent(value)
    setReplyCharCount(value.length)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value)
  }

  const canUserComment = () => {
    if (!user) return false

    // Check if user has reached the comment limit
    if (userStats.commentCount >= 3) {
      // Check if the user needs to wait
      if (userStats.lastCommentTime) {
        const waitTime = 30 * 60 * 1000 // 30 minutes in milliseconds
        const timeSinceLastComment = Date.now() - userStats.lastCommentTime.getTime()

        if (timeSinceLastComment < waitTime) {
          const minutesRemaining = Math.ceil((waitTime - timeSinceLastComment) / (60 * 1000))
          toast({
            title: "Límite de comentarios alcanzado",
            description: `Has alcanzado el límite de comentarios. Por favor, espera ${minutesRemaining} minutos antes de comentar nuevamente.`,
            variant: "destructive",
          })
          return false
        }
      }
    }

    return true
  }

  const canUserReply = () => {
    if (!user) return false

    // Check if user has reached the reply limit
    if (userStats.replyCount >= 5) {
      // Check if the user needs to wait
      if (userStats.lastCommentTime) {
        const waitTime = 30 * 60 * 1000 // 30 minutes in milliseconds
        const timeSinceLastComment = Date.now() - userStats.lastCommentTime.getTime()

        if (timeSinceLastComment < waitTime) {
          const minutesRemaining = Math.ceil((waitTime - timeSinceLastComment) / (60 * 1000))
          toast({
            title: "Límite de respuestas alcanzado",
            description: `Has alcanzado el límite de respuestas. Por favor, espera ${minutesRemaining} minutos antes de responder nuevamente.`,
            variant: "destructive",
          })
          return false
        }
      }
    }

    return true
  }

  // Modificar la función handleSubmitComment para obtener la foto de perfil del usuario
  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión para comentar",
        description: "Debes iniciar sesión para poder dejar un comentario",
        variant: "destructive",
      })
      return
    }

    if (!newComment.trim()) return

    if (!canUserComment()) return

    setIsSubmitting(true)

    try {
      // Obtener la información actualizada del usuario para asegurar que tenemos la foto de perfil más reciente
      const userData = await getUserById(user.id)
      const userPhotoURL = userData?.photoURL || ""

      await addComment({
        postId,
        userId: user.id,
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        userImageUrl: userPhotoURL, // Usar la foto de perfil del usuario obtenida de la colección users
        content: newComment.trim(),
        createdAt: new Date(),
        isApproved: true, // Auto-approve comments
        likes: 0,
        likedBy: [], // Ensure likedBy is an array
      })

      setNewComment("")
      setCommentSubmitted(true)

      // Update user stats
      setUserStats((prev) => ({
        ...prev,
        commentCount: prev.commentCount + 1,
        lastCommentTime: new Date(),
      }))

      toast({
        title: "Comentario publicado",
        description: "Tu comentario ha sido publicado correctamente",
      })

      // Reload comments to show the new one
      loadComments()
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu comentario. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modificar la función handleSubmitReply para obtener la foto de perfil del usuario
  const handleSubmitReply = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión para responder",
        description: "Debes iniciar sesión para poder responder a un comentario",
        variant: "destructive",
      })
      return
    }

    if (!replyContent.trim() || !replyToId) return

    if (!canUserReply()) return

    setIsSubmitting(true)

    try {
      // Obtener la información actualizada del usuario para asegurar que tenemos la foto de perfil más reciente
      const userData = await getUserById(user.id)
      const userPhotoURL = userData?.photoURL || ""

      await addComment({
        postId,
        userId: user.id,
        userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        userImageUrl: userPhotoURL, // Usar la foto de perfil del usuario obtenida de la colección users
        parentCommentId: replyToId,
        content: replyContent.trim(),
        createdAt: new Date(),
        isApproved: true, // Auto-approve replies
        likes: 0,
        likedBy: [], // Ensure likedBy is an array
      })

      setReplyContent("")
      setReplyToId(null)

      // Update user stats
      setUserStats((prev) => ({
        ...prev,
        replyCount: prev.replyCount + 1,
        lastCommentTime: new Date(),
      }))

      toast({
        title: "Respuesta publicada",
        description: "Tu respuesta ha sido publicada correctamente",
      })

      // Reload comments to show the new reply
      loadComments()
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu respuesta. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión para dar like",
        description: "Debes iniciar sesión para poder dar like a un comentario",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the comment
      let commentToLike: BlogComment | undefined

      // Search in parent comments
      for (const comment of comments) {
        if (comment.id === commentId) {
          commentToLike = comment
          break
        }

        // Search in replies
        if (comment.replies) {
          const reply = comment.replies.find((r) => r.id === commentId)
          if (reply) {
            commentToLike = reply
            break
          }
        }
      }

      if (!commentToLike) return

      // Check if user already liked this comment
      // Ensure likedBy is an array before using includes
      const likedBy = Array.isArray(commentToLike.likedBy) ? commentToLike.likedBy : []
      const alreadyLiked = likedBy.includes(user.id)

      if (alreadyLiked) {
        await unlikeComment(commentId, user.id)
      } else {
        await likeComment(commentId, user.id)
      }

      // Reload comments to update likes
      loadComments()
    } catch (error) {
      console.error("Error liking comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al dar like al comentario. Inténtalo nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditComment = async () => {
    if (!user || !editingId || !editContent.trim()) return

    try {
      await editComment(editingId, editContent.trim())

      setEditingId(null)
      setEditContent("")

      toast({
        title: "Comentario actualizado",
        description: "Tu comentario ha sido actualizado correctamente",
      })

      // Reload comments to show the updated comment
      loadComments()
    } catch (error) {
      console.error("Error editing comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al editar el comentario. Inténtalo nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    try {
      await deleteComment(commentId)

      toast({
        title: "Comentario eliminado",
        description: "El comentario ha sido eliminado correctamente",
      })

      // Reload comments to update the list
      loadComments()
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al eliminar el comentario. Inténtalo nuevamente.",
        variant: "destructive",
      })
    }
  }

  const startEditing = (comment: BlogComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent("")
  }

  const handleReactionComment = async (commentId: string, reactionType: CommentReactionType) => {
    if (!user) {
      toast({
        title: "Inicia sesión para reaccionar",
        description: "Debes iniciar sesión para poder reaccionar a un comentario",
      })
      return
    }

    try {
      const currentUserReaction = userReactions[commentId]

      // If user already has this reaction, remove it
      if (currentUserReaction === reactionType) {
        await removeCommentReaction(commentId, user.id)

        // Update local state
        setUserReactions((prev) => ({
          ...prev,
          [commentId]: null,
        }))

        // Update reaction counts
        setCommentReactions((prev) => {
          const newCounts = { ...prev }
          if (newCounts[commentId]) {
            newCounts[commentId] = {
              ...newCounts[commentId],
              [reactionType]: Math.max(0, (newCounts[commentId][reactionType] || 1) - 1),
            }
          }
          return newCounts
        })

        toast({
          title: "Reacción eliminada",
          description: `Has eliminado tu reacción al comentario`,
        })
      } else {
        // Add new reaction
        const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim()
        await addCommentReaction(commentId, user.id, userName, user.photoURL, reactionType)

        // Update local state
        setUserReactions((prev) => ({
          ...prev,
          [commentId]: reactionType,
        }))

        // Update reaction counts
        setCommentReactions((prev) => {
          const newCounts = { ...prev }
          if (!newCounts[commentId]) {
            newCounts[commentId] = {} as Record<CommentReactionType, number>
          }

          // If user had a previous reaction, decrement it
          if (currentUserReaction) {
            newCounts[commentId][currentUserReaction] = Math.max(
              0,
              (newCounts[commentId][currentUserReaction] || 1) - 1,
            )
          }

          // Increment the new reaction
          newCounts[commentId][reactionType] = (newCounts[commentId][reactionType] || 0) + 1

          return newCounts
        })

        toast({
          title: "Reacción registrada",
          description: `Has reaccionado con ${getReactionInfo(reactionType).label} al comentario`,
        })
      }
    } catch (error) {
      console.error("Error reacting to comment:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al reaccionar al comentario. Inténtalo nuevamente.",
      })
    }
  }

  const openReactionsModal = async (commentId: string) => {
    try {
      setSelectedCommentId(commentId)

      // Get reaction counts for this comment
      const reactionCounts = commentReactions[commentId] || ({} as Record<CommentReactionType, number>)

      // Calculate total reactions
      const total = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)

      // Get top reactions (sorted by count)
      const topReactions = Object.entries(reactionCounts)
        .sort(([, countA], [, countB]) => (countB || 0) - (countA || 0))
        .slice(0, 3)
        .map(([type]) => type as CommentReactionType)

      setReactionsSummary({
        total,
        types: reactionCounts,
        topReactions,
      })

      setIsReactionsModalOpen(true)
    } catch (error) {
      console.error("Error opening reactions modal:", error)
    }
  }

  // Note: This is a simplified implementation of the reaction system.
  // For a complete implementation, you would need to:
  // 1. Create new functions in lib/firebase/blog.ts to handle different reaction types
  // 2. Create a new collection in Firestore to store comment reactions
  // 3. Update the UI to show all reaction types and counts
  // 4. Add functionality to remove reactions

  const renderComment = (comment: BlogComment, isReply = false, isPinned = false) => {
    const isEditing = editingId === comment.id
    const isAuthor = user && user.id === comment.userId
    const isAdmin = user && user.role === "admin"
    const canEdit = isAuthor && !isReply
    const canDelete = isAuthor || isAdmin
    const canPin = isAdmin && !isReply && !isPinned
    const canUnpin = isAdmin && isPinned

    // Ensure likedBy is an array before using includes
    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : []
    const hasLiked = user && likedBy.includes(user.id)

    // Get user photo from our map
    const userPhoto = comment.userId ? userPhotos[comment.userId] : ""

    return (
      <div key={comment.id} className={`relative ${isReply ? "pl-6 md:pl-12 mt-4" : "mt-6"}`}>
        {/* Thread line for replies */}
        {isReply && (
          <div
            className="absolute left-0 md:left-[-24px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/60 to-primary/20"
            aria-hidden="true"
          />
        )}

        <div className="flex gap-3">
          <div className="relative">
            <Avatar
              className={`${isReply ? "h-8 w-8" : "h-10 w-10"} flex-shrink-0 border-2 border-background shadow-md`}
            >
              <AvatarImage src={userPhoto || comment.userImageUrl || ""} alt={comment.userName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {comment.userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isReply && (
              <div
                className="absolute -left-[12px] md:-left-[22px] top-4 h-[2px] w-3 md:w-5 bg-primary/50"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div
              className={`${
                isPinned
                  ? "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/50 shadow-md"
                  : "bg-muted/30 hover:bg-muted/40 border-border/30"
              } transition-colors rounded-lg p-3 md:p-4 border shadow-sm relative`}
            >
              {isPinned && (
                <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 rotate-12">
                  <Pin className="h-5 w-5 text-amber-500 drop-shadow-md" />
                </div>
              )}

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-foreground truncate">{comment.userName}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    {comment.isEdited && (
                      <span className="text-xs text-muted-foreground italic whitespace-nowrap">(editado)</span>
                    )}
                    {isPinned && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap flex items-center gap-0.5">
                        <Pin className="h-3 w-3" /> Fijado
                      </span>
                    )}
                  </div>
                </div>

                {(canEdit || canDelete || canPin || canUnpin) && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => startEditing(comment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canPin && (
                        <DropdownMenuItem onClick={() => handlePinComment(comment.id)}>
                          <Pin className="h-4 w-4 mr-2" />
                          Fijar comentario
                        </DropdownMenuItem>
                      )}
                      {canUnpin && (
                        <DropdownMenuItem onClick={() => handleUnpinComment(comment.id)}>
                          <PinOff className="h-4 w-4 mr-2" />
                          Desfijar comentario
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={handleEditChange}
                    className="resize-none focus-visible:ring-primary/30"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleEditComment} className="bg-primary hover:bg-primary/90">
                      <Check className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground">{renderTextWithLinks(comment.content)}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center gap-1 h-7 px-2.5 rounded-full transition-colors ${
                      userReactions[comment.id]
                        ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
                        : "hover:bg-muted border border-transparent hover:border-border/50"
                    }`}
                  >
                    {userReactions[comment.id] ? (
                      <span className="text-base mr-1">{getReactionInfo(userReactions[comment.id]).emoji}</span>
                    ) : (
                      <>
                        {Object.values(commentReactions[comment.id] || {}).reduce((sum, count) => sum + count, 0) >
                        0 ? (
                          <div className="flex -space-x-1 mr-1">
                            {Object.entries(commentReactions[comment.id] || {})
                              .filter(([, count]) => count > 0)
                              .sort(([, countA], [, countB]) => (countB || 0) - (countA || 0))
                              .slice(0, 3)
                              .map(([type]) => (
                                <span key={type} className="text-base">
                                  {getReactionInfo(type as CommentReactionType).emoji}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <Smile className="h-3.5 w-3.5 mr-1" />
                        )}
                      </>
                    )}
                    <span className="font-medium text-xs">
                      {Object.values(commentReactions[comment.id] || {}).reduce((sum, count) => sum + count, 0) || 0}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 shadow-lg border-border/60">
                  {user ? (
                    <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
                      {[
                        { type: "hot", emoji: "🥵", title: "Me calienta" },
                        { type: "crazy", emoji: "🤪", title: "Me aloca" },
                        { type: "people", emoji: "👌", title: "¡Somos, Gente!" },
                        { type: "excited", emoji: "😈", title: "Me excita" },
                        { type: "scream", emoji: "🌈", title: "Me hace gritar ¡Aaaahhh!" },
                        { type: "ono", emoji: "🌸", title: "Oño" },
                        { type: "like", emoji: "👍", title: "Me gusta" },
                        { type: "heart", emoji: "❤️", title: "Me encanta" },
                        { type: "funny", emoji: "😂", title: "Me divierte" },
                        { type: "surprise", emoji: "😮", title: "Me sorprende" },
                        { type: "sad", emoji: "😢", title: "Me entristece" },
                        { type: "angry", emoji: "😡", title: "Me enoja" },
                      ].map((reaction) => (
                        <Button
                          key={reaction.type}
                          variant="ghost"
                          size="sm"
                          className={`p-1.5 rounded-full transition-transform hover:scale-110 ${
                            userReactions[comment.id] === reaction.type
                              ? "bg-primary/15 text-primary"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => handleReactionComment(comment.id, reaction.type as CommentReactionType)}
                          title={reaction.title}
                        >
                          <span className="text-lg">{reaction.emoji}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Inicia sesión para reaccionar</p>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/login">Iniciar sesión</Link>
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {Object.values(commentReactions[comment.id] || {}).reduce((sum, count) => sum + count, 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline h-7 px-2"
                  onClick={() => openReactionsModal(comment.id)}
                >
                  Reacciones
                </Button>
              )}

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-1 h-7 px-2.5 rounded-full transition-colors ${
                    replyToId === comment.id
                      ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
                      : "hover:bg-muted border border-transparent hover:border-border/50"
                  }`}
                  onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                >
                  <Reply className="h-3.5 w-3.5 mr-1" />
                  <span className="font-medium text-xs">Responder</span>
                </Button>
              )}
            </div>

            {replyToId === comment.id && (
              <div className="mt-3 relative pl-4 border-l-2 border-primary/30">
                {/* Thread line for reply form */}
                <div
                  className="absolute left-0 md:left-[-24px] top-0 bottom-0 w-[2px] bg-primary/40"
                  aria-hidden="true"
                />
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  className="resize-none border-primary/20 focus-visible:ring-primary/30 bg-background/80 text-sm"
                  rows={2}
                  value={replyContent}
                  onChange={handleReplyChange}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${replyCharCount > 450 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {replyCharCount}/500 caracteres
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReplyToId(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Responder"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Render replies with thread line connecting them to parent */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4 relative">
                {/* Thread line for all replies */}
                <div
                  className="absolute left-0 md:left-[-24px] top-0 bottom-0 w-[2px] bg-primary/20"
                  aria-hidden="true"
                />
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-3 mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">
          Comentarios ({comments.reduce((count, comment) => count + 1 + (comment.replies?.length || 0), 0)})
        </h2>
      </div>

      {/* Comment Form */}
      <Card className="border border-border/40 shadow-sm bg-background/80 overflow-hidden">
        <CardHeader className="pb-2 bg-muted/20">
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Deja tu comentario
          </CardTitle>
          <CardDescription>Comparte tu opinión sobre este artículo</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {user ? (
            <>
              {commentSubmitted ? (
                <Alert className="bg-primary/10 border-primary/20 text-primary">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tu comentario ha sido publicado. ¡Gracias por compartir tu opinión!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-1">
                  <Textarea
                    placeholder="Escribe tu comentario aquí..."
                    className="resize-none focus-visible:ring-primary/30 min-h-[100px]"
                    rows={4}
                    value={newComment}
                    onChange={handleCommentChange}
                    maxLength={500}
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${charCount > 450 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {charCount}/500 caracteres
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Alert className="bg-muted/50 border-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Inicia sesión
                </Link>{" "}
                para dejar un comentario
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {user && !commentSubmitted && (
          <CardFooter className="flex justify-between border-t bg-muted/10 pt-4">
            <p className="text-xs text-muted-foreground">
              Sé respetuoso con los demás usuarios y evita lenguaje ofensivo
            </p>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Comentar"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Separator className="my-6" />

      {/* Comments List */}
      <div className="space-y-6">
        {/* Pinned Comments Section */}
        {pinnedComments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Pin className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">Comentarios destacados</h3>
            </div>
            <div className="space-y-4 px-1">{pinnedComments.map((comment) => renderComment(comment, false, true))}</div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-8 bg-muted/10 rounded-lg border border-border/20 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando comentarios...</p>
            </div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6 px-1">{comments.map((comment) => renderComment(comment))}</div>
        ) : (
          <div className="text-center py-10 bg-muted/10 rounded-lg border border-border/20 shadow-sm">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-muted-foreground">No hay comentarios todavía. ¡Sé el primero en comentar!</p>
          </div>
        )}
      </div>
      {/* Reactions Modal */}
      {selectedCommentId && (
        <CommentReactionsModal
          commentId={selectedCommentId}
          isOpen={isReactionsModalOpen}
          onOpenChange={setIsReactionsModalOpen}
          reactionsSummary={reactionsSummary}
        />
      )}
    </div>
  )
}
