"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAllTags, getPopularTags } from "@/lib/firebase/blog"
import type { BlogTag } from "@/types"
import { Badge } from "@/components/ui/badge"

interface TagCloudProps {
  limit?: number
  showCount?: boolean
  onlyPopular?: boolean
}

export function TagCloud({ limit = 20, showCount = true, onlyPopular = true }: TagCloudProps) {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const fetchedTags = onlyPopular ? await getPopularTags(limit) : await getAllTags()

        // Si no es onlyPopular, ordenar por postCount y limitar
        const sortedTags = onlyPopular
          ? fetchedTags
          : fetchedTags
              .filter((tag) => tag.isActive)
              .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
              .slice(0, limit)

        setTags(sortedTags)
      } catch (error) {
        console.error("Error fetching tags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [limit, onlyPopular])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>
    )
  }

  if (tags.length === 0) {
    return <p className="text-sm text-gray-500">No hay etiquetas disponibles.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link key={tag.id} href={`/blog/etiquetas/${tag.slug}`}>
          <Badge
            variant="outline"
            className="hover:bg-gray-100 cursor-pointer transition-colors"
            style={{ borderColor: tag.color, color: tag.color }}
          >
            {tag.name}
            {showCount && tag.postCount > 0 && <span className="ml-1 text-xs opacity-70">({tag.postCount})</span>}
          </Badge>
        </Link>
      ))}
    </div>
  )
}
