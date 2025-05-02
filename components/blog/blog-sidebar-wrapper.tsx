import { getRecentPosts, getPopularPosts, getAllCategories } from "@/lib/firebase/blog"
import { BlogSidebar } from "@/components/blog/blog-sidebar"

interface BlogSidebarWrapperProps {
  postId: string
}

export async function BlogSidebarWrapper({ postId }: BlogSidebarWrapperProps) {
  // Cargar datos en paralelo
  const [recentPosts, popularPosts, categories] = await Promise.all([
    getRecentPosts(5, postId),
    getPopularPosts(5, postId),
    getAllCategories(),
  ])

  return (
    <BlogSidebar currentPostId={postId} recentPosts={recentPosts} popularPosts={popularPosts} categories={categories} />
  )
}
