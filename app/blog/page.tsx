import type { Metadata } from "next"
import { Suspense } from "react"
import { PostFiltersWrapper } from "@/components/blog/post-filters-wrapper"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { BlogListSkeleton } from "@/components/blog/blog-list-skeleton"
import dynamic from "next/dynamic"

export const metadata: Metadata = {
  title: "Blog | RaveHub",
  description: "Explora nuestro blog sobre música electrónica, festivales, cultura rave y más.",
  openGraph: {
    title: "Blog | RaveHub",
    description: "Explora nuestro blog sobre música electrónica, festivales, cultura rave y más.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | RaveHub",
    description: "Explora nuestro blog sobre música electrónica, festivales, cultura rave y más.",
  },
  alternates: {
    canonical: "/blog",
  },
}

export const viewport = {
  themeColor: "#000000",
}

export const forceDynamic = "force-dynamic"
export const revalidate = 60 // Revalidar cada minuto

// Importación dinámica para el banner (que no es crítico para la carga inicial)
const FeaturedBlogBanner = dynamic(() => import("@/components/blog/featured-blog-banner"), {
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg mb-8" />,
  ssr: true,
})

// Importación dinámica para el contenido principal
const BlogListContainer = dynamic(() => import("./blog-list-container"), {
  ssr: true,
})

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Priorizar el contenido crítico */}
      <Breadcrumbs className="my-4" />
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {/* Filtros - carga rápida y crítica para la interacción */}
      <PostFiltersWrapper />

      {/* Contenido principal con suspense para streaming */}
      <Suspense fallback={<BlogListSkeleton />}>
        <BlogListContainer />
      </Suspense>

      {/* Banner cargado de forma diferida */}
      <div className="mt-8">
        <FeaturedBlogBanner />
      </div>
    </div>
  )
}
