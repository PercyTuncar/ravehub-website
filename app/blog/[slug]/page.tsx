import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getPostBySlug } from "@/lib/firebase/blog"
import { Breadcrumbs } from "@/components/blog/breadcrumbs"
import { PostSchema } from "@/components/blog/post-schema"
import { PostDetailSkeleton } from "@/components/blog/post-detail-skeleton"
import { BlogSidebarSkeleton } from "@/components/blog/blog-sidebar-skeleton"
import { PostDetailWrapper } from "@/components/blog/post-detail-wrapper"
import { BlogSidebarWrapper } from "@/components/blog/blog-sidebar-wrapper"
// Importar la función getRedirectedSlug y redirect de Next.js
import { getRedirectedSlug } from "@/lib/firebase/slug-redirects"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Helper function to safely format dates for ISO string
function safeISOString(date: any): string | undefined {
  if (!date) return undefined

  // If it's already a string, return it
  if (typeof date === "string") return date

  // If it's a Date object, convert to ISO string
  if (date instanceof Date) return date.toISOString()

  // If it's a Timestamp or has seconds/nanoseconds (Firebase Timestamp structure)
  if (date.seconds !== undefined && date.nanoseconds !== undefined) {
    return new Date(date.seconds * 1000 + date.nanoseconds / 1000000).toISOString()
  }

  // Try to convert to Date if it's a number or valid date string
  try {
    return new Date(date).toISOString()
  } catch (e) {
    console.error("Failed to convert date to ISO string:", e)
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
      <PostSchema post={post} url={fullUrl} />
    </div>
  )
}
