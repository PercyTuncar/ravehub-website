import { Suspense } from "react"
import { BlogList } from "./blog-list"
import { BlogListFallback } from "./blog-list-fallback"
import { BlogListSchema } from "@/components/blog/blog-list-schema"
import { getAllPosts } from "@/lib/firebase/blog"

export const metadata = {
  title: "Blog | RaveHub - Noticias y artículos sobre música electrónica",
  description:
    "Explora nuestro blog con las últimas noticias, reseñas de eventos, entrevistas con DJs y todo sobre la escena de música electrónica en Latinoamérica.",
  keywords: ["blog música electrónica", "noticias EDM", "eventos electrónicos", "DJs latinoamérica", "festivales"],
}

export default async function BlogPage() {
  // Fetch initial posts for SEO
  const initialPostsData = await getAllPosts(1, 12)
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/blog`

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog de RaveHub</h1>

      <Suspense fallback={<BlogListFallback />}>
        <BlogList />
      </Suspense>

      {/* Add structured data */}
      <BlogListSchema
        posts={initialPostsData.posts}
        url={url}
        title="Blog | RaveHub - Noticias y artículos sobre música electrónica"
        description="Explora nuestro blog con las últimas noticias, reseñas de eventos, entrevistas con DJs y todo sobre la escena de música electrónica en Latinoamérica."
      />
    </div>
  )
}
