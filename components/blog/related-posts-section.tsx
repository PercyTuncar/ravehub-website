"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { BlogPost } from "@/types/blog"

interface RelatedPostsSectionProps {
  currentPostId: string
  categoryId?: string
  tags?: string[]
  limit?: number
}

interface PostRecommendation {
  id: string
  title: string
  slug: string
  excerpt: string
  mainImageUrl?: string
  publishDate: Date | string
  category?: any
  tags?: any[]
}

export function RelatedPostsSection({
  currentPostId,
  categoryId,
  tags = [],
  limit = 4
}: RelatedPostsSectionProps) {
  const [relatedPosts, setRelatedPosts] = useState<PostRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelatedPosts() {
      try {
        const params = new URLSearchParams({
          postId: currentPostId,
          limit: limit.toString(),
        })

        if (categoryId) {
          params.set("categoryId", categoryId)
        }

        const response = await fetch(`/api/recommendations?${params}`)
        const data = await response.json()

        if (data.recommendations) {
          setRelatedPosts(data.recommendations)
        }
      } catch (error) {
        console.error("Error fetching related posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedPosts()
  }, [currentPostId, categoryId, limit])

  if (loading) {
    return (
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">Artículos relacionados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Artículos relacionados</h3>
        <Link
          href="/blog"
          className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium"
        >
          Ver todos los artículos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatedPosts.map((post) => (
          <Card key={post.id} className="group hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <Image
                    src={post.mainImageUrl || "/placeholder.svg"}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>
              </Link>

              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.category && (
                    <Badge variant="outline" className="text-xs">
                      {typeof post.category === 'string' ? post.category : post.category.name}
                    </Badge>
                  )}
                  {post.tags && post.tags.slice(0, 2).map((tag: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{typeof tag === 'string' ? tag : tag.name}
                    </Badge>
                  ))}
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <h4 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                </Link>

                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <time dateTime={new Date(post.publishDate).toISOString()}>
                      {formatDate(post.publishDate)}
                    </time>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}