import Link from "next/link"
import Image from "next/image"
import { Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { BlogPost } from "@/types"

interface RelatedPostsProps {
  posts: BlogPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`} className="group">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
            {post.featuredImage && (
              <div className="relative h-48 w-full">
                <Image
                  src={post.featuredImage || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(post.publishDate)}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>

              {/* Este es probablemente el origen del error - post.tags podría ser undefined */}
              <div className="mt-2 text-xs text-muted-foreground">
                {post.tags && Array.isArray(post.tags) && post.tags.length > 0 ? post.tags.join(", ") : ""}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
