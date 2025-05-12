import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoryBySlug } from "@/lib/firebase/blog"
import { PostListWrapper } from "@/components/blog/post-list-wrapper"
import { BlogSidebarWrapper } from "@/components/blog/blog-sidebar-wrapper"
import { CategorySchema } from "@/components/blog/category-schema"
import { PageHeader } from "@/components/page-header"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return {
      title: "Categoría no encontrada",
      description: "La categoría que buscas no existe o ha sido eliminada.",
    }
  }

  return {
    title: `${category.name} - Blog`,
    description: category.description || `Explora artículos en la categoría ${category.name}`,
    openGraph: {
      title: `${category.name} - Blog`,
      description: category.description || `Explora artículos en la categoría ${category.name}`,
      images: category.imageUrl
        ? [
            {
              url: category.imageUrl,
              width: 1200,
              height: 630,
              alt: category.name,
            },
          ]
        : undefined,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={category.name}
        description={category.description || `Artículos en la categoría ${category.name}`}
        imageUrl={category.imageUrl}
      />

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <div className="w-full lg:w-3/4">
          <Suspense fallback={<div>Cargando artículos...</div>}>
            <PostListWrapper categoryId={category.id} />
          </Suspense>
        </div>

        <div className="w-full lg:w-1/4">
          <BlogSidebarWrapper />
        </div>
      </div>

      {/* Structured Data */}
      <CategorySchema category={category} />
    </div>
  )
}
