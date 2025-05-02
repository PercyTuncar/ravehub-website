import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import {
  getCategoryBySlug,
  getPostsByCategory,
  getAllCategories,
  getRecentPosts,
  getPopularPosts,
  getCategoryById,
} from "@/lib/firebase/blog"
import { Breadcrumbs } from "@/components/blog/breadcrumbs"
import { PostList } from "@/components/blog/post-list"
import { PostFilters } from "@/components/blog/post-filters"
import { BlogSidebar } from "@/components/blog/blog-sidebar"
import { generateCategorySchema } from "@/components/blog/category-schema"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CategorySchema } from "@/components/blog/category-schema"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    return {
      title: "Categoría no encontrada | RaveHub Blog",
      description: "La categoría que buscas no existe o ha sido eliminada.",
    }
  }

  // URL completa para el schema
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.com"
  const categoryUrl = `${baseUrl}/blog/categorias/${category.slug}`

  // Obtener posts para esta categoría (primera página)
  const { posts } = await getPostsByCategory(category.id, 1, 9)

  // Obtener categoría padre si existe
  let parentCategory = null
  if (category.parentCategoryId) {
    parentCategory = await getCategoryById(category.parentCategoryId)
  }

  // Generar el schema para la categoría
  const categorySchema = generateCategorySchema({
    category,
    parentCategory,
    posts,
    url: categoryUrl,
    baseUrl,
  })

  // Preparar metadatos SEO
  const title = category.seoTitle || `${category.name} | RaveHub Blog`
  const description =
    category.seoDescription || category.description || `Explora artículos sobre ${category.name} en nuestro blog.`
  const keywords = Array.isArray(category.metaKeywords) ? category.metaKeywords.join(", ") : ""

  return {
    title,
    description,
    keywords: keywords,
    openGraph: {
      title,
      description,
      type: "website",
      url: categoryUrl,
      images: category.image ? [{ url: category.image }] : undefined,
      siteName: "RaveHub",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: category.image ? [category.image] : undefined,
    },
    alternates: {
      canonical: categoryUrl,
    },
    // Añadir el schema como parte de los metadatos
    other: {
      "application/ld+json": JSON.stringify(categorySchema),
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    notFound()
  }

  // Obtener posts para esta categoría (primera página)
  const { posts, lastVisible, hasMore } = await getPostsByCategory(category.id, 1, 9)

  // Obtener todas las categorías para la barra lateral y filtros
  const categories = await getAllCategories()

  // Obtener posts recientes y populares para la barra lateral
  const recentPosts = await getRecentPosts(5)
  const popularPosts = await getPopularPosts(5)

  // Construir la ruta de navegación
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: category.name, href: `/blog/categorias/${category.slug}`, active: true },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      {/* Imagen de la categoría */}
      {category.image && (
        <Card className="mb-8 overflow-hidden">
          <div className="relative w-full h-[300px]">
            <Image
              src={category.image || "/placeholder.svg"}
              alt={category.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </Card>
      )}

      {/* Encabezado de la categoría */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{category.name}</h1>
        {category.description && <p className="text-lg text-muted-foreground">{category.description}</p>}
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <PostFilters categories={categories} selectedCategory={category.id} />
            </CardContent>
          </Card>

          {/* Lista de posts */}
          <PostList initialPosts={posts} initialLastVisible={lastVisible} initialHasMore={hasMore} />
        </div>

        {/* Barra lateral */}
        <div className="lg:col-span-1">
          <BlogSidebar categories={categories} recentPosts={recentPosts} popularPosts={popularPosts} />
        </div>
      </div>

      {/* Add the CategorySchema component here */}
      <CategorySchema
        category={category}
        parentCategory={null}
        posts={posts}
        url={`${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.com"}/blog/categorias/${category.slug}`}
      />
    </div>
  )
}
