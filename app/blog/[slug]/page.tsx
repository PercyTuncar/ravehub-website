import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getPostBySlug } from "@/lib/firebase/blog"
import { Breadcrumbs } from "@/components/blog/breadcrumbs"
import { PostDetailSkeleton } from "@/components/blog/post-detail-skeleton"
import { BlogSidebarSkeleton } from "@/components/blog/blog-sidebar-skeleton"
import { PostDetailWrapper } from "@/components/blog/post-detail-wrapper"
import { BlogSidebarWrapper } from "@/components/blog/blog-sidebar-wrapper"
// Importar la función getRedirectedSlug y redirect de Next.js
import { getRedirectedSlug } from "@/lib/firebase/slug-redirects"
import { EnhancedPostSchema } from "@/components/blog/enhanced-post-schema"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Helper function to safely format dates for ISO string
function safeISOString(date: any): string | undefined {
  if (!date) return undefined

  try {
    // Si es una cadena, intentar convertirla a Date
    if (typeof date === "string") {
      const parsedDate = new Date(date)
      // Verificar si la fecha es válida
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // Si es un objeto Date
    if (date instanceof Date) {
      // Verificar si la fecha es válida
      return !isNaN(date.getTime()) ? date.toISOString() : undefined
    }

    // Si es un Timestamp de Firebase (tiene seconds y nanoseconds)
    if (date && typeof date === "object" && "seconds" in date && "nanoseconds" in date) {
      const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000
      const parsedDate = new Date(milliseconds)
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // Último intento: convertir a Date si es un número o una cadena válida
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
  } catch (e) {
    console.error("Error al convertir fecha a ISO string:", e)
    return undefined
  }
}

// Modificar la función generateMetadata para manejar correctamente las etiquetas que son objetos
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: "Artículo no encontrado | RaveHub Blog",
      description: "El artículo que buscas no existe o ha sido eliminado.",
    }
  }

  // Extraer los nombres de las etiquetas si son objetos
  const tagNames = post.tags ? post.tags.map((tag) => (typeof tag === "string" ? tag : tag.name)) : []

  return {
    title: post.seoTitle || `${post.title} | RaveHub Blog`,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    keywords: post.seoKeywords || tagNames || [],
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.shortDescription || post.excerpt || "",
      images:
        post.mainImageUrl || post.featuredImageUrl
          ? [{ url: post.mainImageUrl || post.featuredImageUrl || "" }]
          : undefined,
      type: "article",
      publishedTime: safeISOString(post.publishDate),
      modifiedTime: safeISOString(post.updatedAt || post.updatedDate),
      authors: post.author ? [post.author] : undefined,
      tags: tagNames,
      section: post.categoryName,
    },
    twitter: {
      card: post.twitterCardType || "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.shortDescription || post.excerpt || "",
      images:
        post.mainImageUrl || post.featuredImageUrl ? [post.mainImageUrl || post.featuredImageUrl || ""] : undefined,
    },
    alternates: {
      canonical: post.canonicalUrl || `/blog/${post.slug}`,
    },
  }
}

// Modificar la función principal para manejar redirecciones
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  // Verificar si el slug actual es el definitivo o necesita redirección
  const finalSlug = await getRedirectedSlug(params.slug)

  // Si el slug final es diferente al original, redirigir
  if (finalSlug !== params.slug) {
    redirect(`/blog/${finalSlug}`)
  }

  // Continuar con la lógica existente usando el slug final
  const post = await getPostBySlug(finalSlug)

  if (!post) {
    console.log(`Post no encontrado para slug: ${finalSlug}`)
    notFound()
  }

  // URL completa para el schema
  const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.com"}/blog/${post.slug}`

  // Construir la ruta de navegación básica (sin categoría que se cargará después)
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title, href: `/blog/${post.slug}`, current: true },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<PostDetailSkeleton />}>
            <PostDetailWrapper slug={finalSlug} priority={true} />
          </Suspense>
        </div>

        {/* Barra lateral */}
        <div className="lg:col-span-1">
          <Suspense fallback={<BlogSidebarSkeleton />}>
            <BlogSidebarWrapper postId={post.id} />
          </Suspense>
        </div>
      </div>

      {/* Datos estructurados para SEO */}
      <Suspense fallback={null}>
        <EnhancedPostSchema post={post} category={post.category} url={fullUrl} />
      </Suspense>
    </div>
  )
}
