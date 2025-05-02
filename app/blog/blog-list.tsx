"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getAllPosts } from "@/lib/firebase/blog"
import BlogCard from "@/components/blog/blog-card"
import type { BlogPost } from "@/types"

export default function BlogList() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  const page = Number.parseInt(searchParams.get("page") || "1")
  const categoryId = searchParams.get("category") || undefined
  const tagName = searchParams.get("tag") || undefined

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        const result = await getAllPosts(page, 9, categoryId, tagName)
        setPosts(result.posts)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page, categoryId, tagName])

  if (loading) {
    return null // El Suspense mostrará el fallback
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">No se encontraron artículos</h2>
        <p className="text-gray-600">Intenta con otra categoría o etiqueta.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  )
}
