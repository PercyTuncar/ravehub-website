"use client"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { BlogPost } from "@/types"

interface FeaturedPostsProps {
  posts: BlogPost[]
}

export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  if (!posts || posts.length === 0) return null

  const mainPost = posts[0]
  const secondaryPosts = posts.slice(1)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Post principal */}
      <div className="md:col-span-2">
        <Link href={`/blog/${mainPost.slug}`} className="group">
          <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
            <div className="relative h-80 overflow-hidden">
              <Image
                src={mainPost.mainImageUrl || "/placeholder.svg?width=800&height=400"}
                alt={mainPost.imageAltTexts?.[mainPost.mainImageUrl] || mainPost.title}
                fill
                priority
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <Badge className="mb-3 bg-primary hover:bg-primary-hover">Destacado</Badge>
                <h2 className="text-2xl font-bold mb-2 line-clamp-2">{mainPost.title}</h2>
                <p className="line-clamp-2 text-gray-200 mb-3">{mainPost.shortDescription}</p>
                <div className="flex items-center text-sm text-gray-300">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  <span className="mr-3">{formatDate(mainPost.publishDate)}</span>

                  {mainPost.location && mainPost.location.city && (
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span>
                        {mainPost.location.city}, {mainPost.location.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Posts secundarios */}
      <div className="md:col-span-1 flex flex-col gap-6">
        {secondaryPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group">
            <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={post.mainImageUrl || "/placeholder.svg?width=400&height=200"}
                  alt={post.imageAltTexts?.[post.mainImageUrl] || post.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <Badge className="mb-2 bg-primary hover:bg-primary-hover">Destacado</Badge>
                  <h3 className="text-lg font-bold line-clamp-2">{post.title}</h3>
                  <div className="flex items-center text-xs text-gray-300 mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(post.publishDate)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
