"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { PostSchema } from "./post-schema"
import type { BlogPost, BlogCategory, BlogComment } from "@/types/blog"

interface PostReaction {
  reactionType: string
  userId: string
  userName?: string
  userImageUrl?: string
  createdAt: string | Date
  postId: string
}

interface EnhancedPostSchemaProps {
  post: BlogPost
  category?: BlogCategory | null
  url: string
}

// Define mapeos constantes para mantener la coherencia
const CONTENT_TYPE_MAPPINGS = {
  blog: {
    schemaType: "BlogPosting",
    ogType: "article",
  },
  news: {
    schemaType: "NewsArticle",
    ogType: "article",
  },
  event: {
    schemaType: "Event",
    ogType: "event",
  },
  review: {
    schemaType: "Review",
    ogType: "article",
  },
  guide: {
    schemaType: "HowTo",
    ogType: "article",
  },
}

export function EnhancedPostSchema({ post, category, url }: EnhancedPostSchemaProps) {
  const [comments, setComments] = useState<BlogComment[]>([])
  const [reactions, setReactions] = useState<PostReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPostInteractions() {
      try {
        // Enhance content type detection
        const determineContentType = () => {
          // Check if we already have a defined content type
          if (post.contentType) {
            return post.contentType
          }

          // Check if we have a defined schema type
          if (post.schemaType) {
            if (post.schemaType === "NewsArticle") return "news"
            if (post.schemaType === "Event") return "event"
            if (post.schemaType === "Review") return "review"
            if (post.schemaType === "HowTo") return "guide"
            return "blog"
          }

          // Try to determine from content and metadata
          const isNewsArticle =
            post.isNewsArticle ||
            post.categoryName?.toLowerCase().includes("noticia") ||
            post.categoryName?.toLowerCase().includes("news") ||
            post.tags?.some((tag) => {
              const tagName = typeof tag === "string" ? tag : tag.name
              return (
                tagName?.toLowerCase().includes("noticia") ||
                tagName?.toLowerCase().includes("news") ||
                tagName?.toLowerCase().includes("actualidad")
              )
            }) ||
            // Check if content has news-like patterns
            (post.content &&
              (post.content.includes("última hora") ||
                post.content.includes("breaking news") ||
                post.content.includes("comunicado oficial") ||
                post.content.includes("anunció hoy") ||
                post.content.includes("ha confirmado") ||
                post.content.includes("según fuentes")))

          if (isNewsArticle) return "news"

          // Check if it's an event
          const isEvent =
            post.isEventPost ||
            post.title?.toLowerCase().includes("evento") ||
            post.title?.toLowerCase().includes("festival") ||
            post.title?.toLowerCase().includes("concierto") ||
            post.categoryName?.toLowerCase().includes("evento") ||
            post.tags?.some((tag) => {
              const tagName = typeof tag === "string" ? tag : tag.name
              return (
                tagName?.toLowerCase().includes("evento") ||
                tagName?.toLowerCase().includes("festival") ||
                tagName?.toLowerCase().includes("concierto")
              )
            })

          if (isEvent) return "event"

          // Check if it's a review
          const isReview =
            post.title?.toLowerCase().includes("review") ||
            post.title?.toLowerCase().includes("reseña") ||
            post.categoryName?.toLowerCase().includes("review") ||
            post.categoryName?.toLowerCase().includes("reseña") ||
            post.tags?.some((tag) => {
              const tagName = typeof tag === "string" ? tag : tag.name
              return tagName?.toLowerCase().includes("review") || tagName?.toLowerCase().includes("reseña")
            })

          if (isReview) return "review"

          // Check if it's a guide
          const isGuide =
            post.title?.toLowerCase().includes("guía") ||
            post.title?.toLowerCase().includes("tutorial") ||
            post.title?.toLowerCase().includes("cómo") ||
            post.categoryName?.toLowerCase().includes("guía") ||
            post.tags?.some((tag) => {
              const tagName = typeof tag === "string" ? tag : tag.name
              return (
                tagName?.toLowerCase().includes("guía") ||
                tagName?.toLowerCase().includes("tutorial") ||
                tagName?.toLowerCase().includes("how to")
              )
            })

          if (isGuide) return "guide"

          // Default to blog
          return "blog"
        }

        // Use the determined content type and ensure all related fields are consistent
        const contentType = determineContentType()

        // Ensure schema and OG types match the content type
        if (contentType && CONTENT_TYPE_MAPPINGS[contentType]) {
          const mapping = CONTENT_TYPE_MAPPINGS[contentType]
          post.contentType = contentType

          // Only set these if they're not already set or don't match the mapping
          if (!post.schemaType || post.schemaType !== mapping.schemaType) {
            post.schemaType = mapping.schemaType
          }

          if (!post.ogType || post.ogType !== mapping.ogType) {
            post.ogType = mapping.ogType
          }
        }

        // Enhance post data with event details if it's an event-related post
        if (
          post.contentType === "event" ||
          (post.title && post.title.toLowerCase().includes("dldk")) ||
          post.title?.toLowerCase().includes("festival") ||
          post.content?.includes("evento") ||
          post.content?.includes("concierto") ||
          post.content?.includes("fiesta") ||
          post.categoryName?.toLowerCase().includes("evento")
        ) {
          // This post might be about an event, let's add event schema data
          if (!post.isEventPost) {
            post.isEventPost = true
            post.eventDetails = post.eventDetails || {
              name: post.title,
              description: post.shortDescription || post.excerpt || "",
              startDate: post.publishDate,
              venueName: post.location?.venueName || "Venue TBA",
              city: post.location?.city || "Santiago",
              country: post.location?.country || "Chile",
            }
          }
        }

        // Extract FAQ items from content if possible
        if (!post.faqItems && post.content) {
          // Try to find FAQ patterns in the content
          // Pattern 1: H2 followed by paragraph
          const faqMatches = post.content.match(/<h2[^>]*>(.*?)<\/h2>\s*<p[^>]*>(.*?)<\/p>/gs)
          if (faqMatches && faqMatches.length > 0) {
            post.faqItems = faqMatches.slice(0, 5).map((match) => {
              const questionMatch = match.match(/<h2[^>]*>(.*?)<\/h2>/)
              const answerMatch = match.match(/<p[^>]*>(.*?)<\/p>/)
              return {
                question: questionMatch ? questionMatch[1].replace(/<[^>]*>/g, "") : "",
                answer: answerMatch ? answerMatch[1].replace(/<[^>]*>/g, "") : "",
              }
            })
          }

          // Pattern 2: Strong/Bold text followed by normal text
          if (!post.faqItems || post.faqItems.length === 0) {
            const boldFaqMatches = post.content.match(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>\s*(.*?)(?=<(strong|b)|$)/gs)
            if (boldFaqMatches && boldFaqMatches.length > 0) {
              post.faqItems = boldFaqMatches
                .slice(0, 5)
                .map((match) => {
                  const questionMatch = match.match(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/)
                  const answerText = match.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/, "").trim()
                  return {
                    question: questionMatch ? questionMatch[2].replace(/<[^>]*>/g, "") : "",
                    answer: answerText.replace(/<[^>]*>/g, ""),
                  }
                })
                .filter((item) => item.question && item.answer)
            }
          }
        }

        // Fetch comments
        if (post.id) {
          const commentsQuery = query(
            collection(db, "blogComments"),
            where("postId", "==", post.id),
            where("isApproved", "==", true),
          )
          const commentsSnapshot = await getDocs(commentsQuery)
          const commentsData = commentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as BlogComment[]
          setComments(commentsData)

          // Fetch reactions
          const reactionsQuery = query(collection(db, "blogReactions"), where("postId", "==", post.id))
          const reactionsSnapshot = await getDocs(reactionsQuery)
          const reactionsData = reactionsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PostReaction[]
          setReactions(reactionsData)
        }

        // Fetch ratings if not already included in post data
        if (!post.averageRating || !post.ratingCount) {
          const ratingsQuery = query(collection(db, "blogRatings"), where("postId", "==", post.id))
          const ratingsSnapshot = await getDocs(ratingsQuery)

          if (ratingsSnapshot.size > 0) {
            let totalRating = 0
            ratingsSnapshot.docs.forEach((doc) => {
              const rating = doc.data().rating || 0
              totalRating += Number(rating)
            })

            const averageRating = totalRating / ratingsSnapshot.size
            post.averageRating = averageRating
            post.ratingCount = ratingsSnapshot.size
          }
        } else {
          // Asegúrate de que los valores existentes sean números
          post.averageRating = Number(post.averageRating)
          post.ratingCount = Number(post.ratingCount)
        }

        // Fetch video information if applicable
        if (post.content && !post.videoUrl) {
          // Check for YouTube embeds
          const youtubeRegex = /<iframe[^>]*src=["'].*youtube\.com\/embed\/([^"'?]+)[^>]*>/i
          const youtubeMatch = post.content.match(youtubeRegex)

          if (youtubeMatch && youtubeMatch[1]) {
            post.videoUrl = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`
            post.videoEmbedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`
            post.videoTitle = post.title
            post.videoDescription = post.shortDescription || post.excerpt
            post.videoThumbnail = post.mainImageUrl || post.featuredImageUrl

            // Try to estimate video duration (default to 2:30 if unknown)
            post.videoDuration = "PT2M30S"
          }

          // Check for Vimeo embeds
          const vimeoRegex = /<iframe[^>]*src=["'].*vimeo\.com\/video\/([^"'?]+)[^>]*>/i
          const vimeoMatch = post.content.match(vimeoRegex)

          if (!post.videoUrl && vimeoMatch && vimeoMatch[1]) {
            post.videoUrl = `https://vimeo.com/${vimeoMatch[1]}`
            post.videoEmbedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
            post.videoTitle = post.title
            post.videoDescription = post.shortDescription || post.excerpt
            post.videoThumbnail = post.mainImageUrl || post.featuredImageUrl
          }
        }

        // Extract author information if available
        if (post.author && !post.authorUrl) {
          // Try to construct author URL
          const authorSlug =
            post.authorSlug ||
            (typeof post.author === "string" ? post.author.toLowerCase().replace(/\s+/g, "-") : "equipo")
          post.authorUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.weareravehub.com"}/autores/${authorSlug}`
        }
      } catch (error) {
        console.error("Error fetching post interactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostInteractions()
  }, [post])

  // Always render basic schema even if we're still loading the full data
  if (isLoading) {
    // Return a minimal schema with the essential post data we already have
    return <PostSchema post={post} category={category} url={url} comments={[]} reactions={[]} />
  }

  return <PostSchema post={post} category={category} url={url} comments={comments} reactions={reactions} />
}
