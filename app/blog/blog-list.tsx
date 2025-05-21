import { Suspense } from "react"
import { getAllPosts } from "@/lib/firebase/blog"
import { BlogList } from "@/components/blog/blog-list"
import BlogListFallback from "./blog-list-fallback"
import type { BlogPost } from "@/types/blog"

// Configuración para ISR - revalidar cada 10 minutos
export const revalidate = 600

// Función para obtener los datos iniciales del servidor
async function getInitialPosts(): Promise<{
  posts: BlogPost[]
  lastVisible: string | null
  hasMore: boolean
}> {
  try {
    // Obtener los primeros 6 posts para la carga inicial
    const result = await getAllPosts(1, 6)
    return result
  } catch (error) {
    console.error("Error fetching initial posts:", error)
    return { posts: [], lastVisible: null, hasMore: false }
  }
}

export default async function BlogListContainer() {
  // Obtener datos iniciales en el servidor
  const { posts, lastVisible, hasMore } = await getInitialPosts()

  return (
    <Suspense fallback={<BlogListFallback />}>
      <BlogList initialPosts={posts} initialLastVisible={lastVisible} initialHasMore={hasMore} showLoadMore={true} />
    </Suspense>
  )
}
