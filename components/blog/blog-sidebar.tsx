import Link from "next/link"
import Image from "next/image"
import { Calendar, TrendingUp, FolderOpen } from "lucide-react"
import { NewsletterForm } from "./newsletter-form"
import { TagCloud } from "./tag-cloud"
import type { BlogPost, BlogCategory } from "@/types"

interface BlogSidebarProps {
  currentPostId?: string
  recentPosts?: BlogPost[]
  popularPosts?: BlogPost[]
  categories: BlogCategory[]
}

export function BlogSidebar({ currentPostId, recentPosts = [], popularPosts = [], categories }: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Formulario de newsletter */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Suscríbete al newsletter</h3>
        <NewsletterForm />
      </div>

      {/* Posts recientes */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar size={18} className="mr-2" />
            Posts recientes
          </h3>
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <Image
                    src={post.featuredImageUrl || "/placeholder.jpg"}
                    alt={post.title}
                    width={60}
                    height={60}
                    className="rounded object-cover"
                  />
                </div>
                <div>
                  <Link href={`/blog/${post.slug}`} className="text-sm font-medium hover:text-primary">
                    {post.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{new Date(post.publishDate).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Posts populares */}
      {popularPosts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp size={18} className="mr-2" />
            Posts populares
          </h3>
          <ul className="space-y-3">
            {popularPosts.map((post) => (
              <li key={post.id} className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <Image
                    src={post.featuredImageUrl || "/placeholder.jpg"}
                    alt={post.title}
                    width={60}
                    height={60}
                    className="rounded object-cover"
                  />
                </div>
                <div>
                  <Link href={`/blog/${post.slug}`} className="text-sm font-medium hover:text-primary">
                    {post.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">{post.viewCount || 0} visualizaciones</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Categorías */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <FolderOpen size={18} className="mr-2" />
          Categorías
        </h3>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/blog/categorias/${category.slug}`}
                className="flex items-center justify-between text-gray-700 hover:text-primary"
              >
                <span>{category.name}</span>
                {category.postsCount && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{category.postsCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Nube de etiquetas */}
      <TagCloud />
    </aside>
  )
}
