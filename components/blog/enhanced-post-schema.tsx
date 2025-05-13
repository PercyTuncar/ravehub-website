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

export function EnhancedPostSchema({ post, category, url }: EnhancedPostSchemaProps) {
  const [comments, setComments] = useState<BlogComment[]>([])
  const [reactions, setReactions] = useState<PostReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPostInteractions() {
      try {
        // Enhance post data with event details if it's an event-related post
        if (
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

        // Fetch reactions
        const reactionsQuery = query(collection(db, "blogReactions"), where("postId", "==", post.id))
        const reactionsSnapshot = await getDocs(reactionsQuery)
        const reactionsData = reactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PostReaction[]

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
          const authorSlug = post.authorSlug || post.author.toLowerCase().replace(/\s+/g, "-")
          post.authorUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.ravehublatam.com"}/autores/${authorSlug}`
        }

        setComments(commentsData)
        setReactions(reactionsData)
      } catch (error) {
        console.error("Error fetching post interactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (post.id) {
      fetchPostInteractions()
    }
  }, [post])

  // Don't render anything while loading to avoid flashing
  if (isLoading) return null

  return <PostSchema post={post} category={category} url={url} comments={comments} reactions={reactions} />
}
