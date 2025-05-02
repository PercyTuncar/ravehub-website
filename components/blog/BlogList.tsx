import type React from "react"

interface BlogPost {
  id: string
  title: string
  content: string
  date: string
  slug: string
}

interface BlogListProps {
  blog: BlogPost[]
}

export const BlogList: React.FC<BlogListProps> = ({ blog }) => {
  return (
    <ul>
      {blog.map((post) => (
        <li key={post.id}>
          <a href={`/blog/${post.slug}`}>{post.title}</a>
        </li>
      ))}
    </ul>
  )
}

// También mantener la exportación por defecto para compatibilidad
export default BlogList
