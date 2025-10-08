import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { BlogPost } from "@/types/blog"
import { OptimizedImage } from "./optimized-image"

interface PostCardProps {
  post: BlogPost
}

export function PostCard({ post }: PostCardProps) {
  // Formatear la fecha de publicación
  const formattedDate = post.publishDate
    ? format(new Date(post.publishDate), "dd MMMM, yyyy", { locale: es })
    : "Fecha no disponible"

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Imagen destacada con dimensiones fijas para evitar CLS */}
      <div className="relative h-48 w-full">
        <Link href={`/blog/${post.slug}`} aria-label={post.title}>
          <OptimizedImage
            src={post.featuredImageUrl || post.featuredImage || "/placeholder.jpg"}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
      </div>

      {/* Contenido */}
      <div className="p-5">
        {/* Fecha */}
        <div className="text-sm text-gray-500 mb-2">{formattedDate}</div>

        {/* Título */}
        <h3 className="text-xl font-bold mb-3 line-clamp-2">
          <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
            {post.title}
          </Link>
        </h3>

        {/* Extracto */}
        <p className="text-gray-700 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <Link href={`/blog/${post.slug}`} className="text-blue-600 hover:text-blue-800 font-medium">
            Leer más
          </Link>

          {/* Stats */}
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-4">{post.viewCount || 0} vistas</span>
            <span>{post.comments?.length || 0} comentarios</span>
          </div>
        </div>
      </div>
    </div>
  )
}
