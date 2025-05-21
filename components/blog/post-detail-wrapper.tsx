"use client"

import { useEffect, useState } from "react"
import { getPostBySlug, incrementPostView } from "@/lib/firebase/blog"
import { PostDetail } from "@/components/blog/post-detail"
import { PostDetailSkeleton } from "@/components/blog/post-detail-skeleton"
import { FloatingReactionButton } from "@/components/blog/floating-reaction-button"
import type { BlogPost } from "@/types"

interface PostDetailWrapperProps {
  slug: string
  priority?: boolean
}

export function PostDetailWrapper({ slug, priority = false }: PostDetailWrapperProps) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true)
        const postData = await getPostBySlug(slug)
        setPost(postData)

        // Incrementar vistas solo si el post existe
        if (postData?.id) {
          // Usar setTimeout para no bloquear la renderización
          setTimeout(() => {
            incrementPostView(postData.id).catch(console.error)
          }, 1000)
        }
      } catch (error) {
        console.error("Error cargando el post:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug])

  if (loading) {
    return <PostDetailSkeleton />
  }

  if (!post) {
    return <div className="text-center py-10">Post no encontrado</div>
  }

  return (
    <>
      <PostDetail post={post} priority={priority} />
      <FloatingReactionButton postId={post.id} />
    </>
  )
}
