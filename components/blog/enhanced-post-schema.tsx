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
  }, [post.id])

  // Don't render anything while loading to avoid flashing
  if (isLoading) return null

  return <PostSchema post={post} category={category} url={url} comments={comments} reactions={reactions} />
}
