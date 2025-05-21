import type { Metadata } from "next"
import { Suspense } from "react"
import { Breadcrumbs } from "@/components/breadcrumbs"
import dynamic from "next/dynamic"
import BlogListFallback from "./blog-list-fallback"

// Importación dinámica con prefetch para componentes críticos
const BlogList = dynamic(() => import("./blog-list"), {
  loading: () => <BlogListFallback />,
  ssr: true,
})

// Importación dinámica con lazy loading para componentes no críticos en la vista inicial
const FeaturedBlogBanner = dynamic(() => import("@/components/blog/featured-blog-banner"), {
  loading: () => <FeaturedBlogBannerSkeleton />,
  ssr: true,
})

// Skeleton para el banner mientras carga
function FeaturedBlogBannerSkeleton() {
  return (
    <div className="w-full h-[550px] bg-gradient-to-r from-gray-900/5 to-gray-900/10 animate-pulse rounded-xl mb-8">
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

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

// Configuración para ISR - revalidar cada 10 minutos
export const revalidate = 600

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Priorizar la carga del contenido principal */}
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <Breadcrumbs className="my-4" />

      {/* Cargar el banner de forma diferida */}
      <Suspense fallback={<FeaturedBlogBannerSkeleton />}>
        <FeaturedBlogBanner />
      </Suspense>

      {/* Cargar la lista de blogs con Suspense y streaming */}
      <Suspense fallback={<BlogListFallback />}>
        <BlogList />
      </Suspense>
    </div>
  )
}
