import { Suspense } from "react"
import { getAllPosts } from "@/lib/firebase/blog"
import BlogList from "./blog-list"
import { BlogListSkeleton } from "@/components/blog/blog-list-skeleton"

export default async function BlogListContainer() {
  // Obtener los posts iniciales en el servidor
  const { posts, lastVisible, hasMore } = await getAllPosts(1, 6)

  return (
    <Suspense fallback={<BlogListSkeleton />}>
      <BlogList initialPosts={posts} initialLastVisible={lastVisible} initialHasMore={hasMore} />
    </Suspense>
  )
}
