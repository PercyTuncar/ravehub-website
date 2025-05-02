"use client"
import { getTagBySlug, getPostsByTag } from "@/lib/firebase/blog"
import { BlogList } from "@/components/blog/BlogList"
import { notFound } from "next/navigation"
import { Breadcrumbs } from "@/components/blog/breadcrumbs"
import { TagSchema } from "@/components/blog/tag-schema"
import Image from "next/image"
import { Music, TrendingUp, Calendar, Headphones, Users } from "lucide-react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { BlogTag, BlogPost } from "@/types"

export default function TagClientPage() {
  const params = useParams()
  const [tag, setTag] = useState<BlogTag | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Log params for debugging
        console.log("TagClientPage params:", params)

        if (!params || !params.slug) {
          console.error("No slug provided to TagClientPage")
          setError(true)
          setLoading(false)
          return
        }

        // Ensure slug is a string
        const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

        console.log(`Attempting to fetch tag with slug: ${slug}`)
        const tagData = await getTagBySlug(slug)

        if (!tagData) {
          console.error(`Tag no encontrado para slug: ${slug}`)
          setError(true)
          setLoading(false)
          return
        }

        setTag(tagData)

        console.log(`Fetching posts for tag ID: ${tagData.id}, name: ${tagData.name}`)
        const postsData = await getPostsByTag(tagData.id, 1, 12)
        console.log(`Found ${postsData.posts.length} posts for tag ID: ${tagData.id}`)

        setPosts(postsData.posts)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching tag data:", err)
        setError(true)
        setLoading(false)
      }
    }

    fetchData()
  }, [params])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    )
  }

  if (error || !tag) {
    return notFound()
  }

  // Crear las rutas para el breadcrumb
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: `Etiqueta: ${tag.name}`, href: `/blog/etiquetas/${tag.slug}` },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <TagSchema tag={tag} />
      <Breadcrumbs items={breadcrumbItems} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        {tag.imageUrl && (
          <div className="relative w-full h-64 md:h-80 mb-8 rounded-xl overflow-hidden shadow-xl">
            <Image
              src={tag.imageUrl || "/placeholder.svg"}
              alt={tag.name}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(to right, ${tag.color || "#000000"}aa, rgba(0,0,0,0.5))`,
              }}
            >
              <div className="text-center px-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex justify-center mb-4"
                >
                  {tag.icon === "music" && <Music size={40} className="text-white" />}
                  {tag.icon === "trending" && <TrendingUp size={40} className="text-white" />}
                  {tag.icon === "calendar" && <Calendar size={40} className="text-white" />}
                  {tag.icon === "headphones" && <Headphones size={40} className="text-white" />}
                  {tag.icon === "users" && <Users size={40} className="text-white" />}
                  {!tag.icon && <Music size={40} className="text-white" />}
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-white mb-2"
                >
                  {tag.name}
                </motion.h1>
                {tag.featured && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: tag.color || "#ff1f1f", color: "white" }}
                  >
                    Destacado
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        )}

        {!tag.imageUrl && (
          <div className="text-center py-10 mb-8 rounded-xl" style={{ backgroundColor: `${tag.color || "#ff1f1f"}10` }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              {tag.icon === "music" && <Music size={40} style={{ color: tag.color || "#ff1f1f" }} />}
              {tag.icon === "trending" && <TrendingUp size={40} style={{ color: tag.color || "#ff1f1f" }} />}
              {tag.icon === "calendar" && <Calendar size={40} style={{ color: tag.color || "#ff1f1f" }} />}
              {tag.icon === "headphones" && <Headphones size={40} style={{ color: tag.color || "#ff1f1f" }} />}
              {tag.icon === "users" && <Users size={40} style={{ color: tag.color || "#ff1f1f" }} />}
              {!tag.icon && <Music size={40} style={{ color: tag.color || "#ff1f1f" }} />}
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-2"
            >
              Posts etiquetados con: {tag.name}
            </motion.h1>
          </div>
        )}

        {tag.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="prose prose-lg max-w-none mb-8 mx-auto bg-white p-6 rounded-xl shadow-sm"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mb-4" style={{ color: tag.color || "#ff1f1f" }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-bold mb-3" style={{ color: tag.color || "#ff1f1f" }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-bold mb-2" style={{ color: tag.color || "#ff1f1f" }} {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold" style={{ color: tag.color || "#ff1f1f" }} {...props} />
                ),
                em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                ul: ({ node, ordered, ...props }) => {
                  // Remove the ordered prop to avoid passing it to the DOM
                  return <ul className="list-disc pl-5 mb-4" {...props} />
                },
                ol: ({ node, ordered, ...props }) => {
                  // Remove the ordered prop to avoid passing it to the DOM
                  return <ol className="list-decimal pl-5 mb-4" {...props} />
                },
                li: ({ node, ordered, checked, ...props }) => {
                  // Remove the ordered and checked props to avoid passing them to the DOM
                  return <li className="mb-1" {...props} />
                },
                a: ({ node, ...props }) => (
                  <a
                    className="underline hover:no-underline transition-all"
                    style={{ color: tag.color || "#ff1f1f" }}
                    {...props}
                  />
                ),
              }}
            >
              {tag.description}
            </ReactMarkdown>
          </motion.div>
        )}

        {!tag.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-600 text-center text-lg mb-8"
          >
            Explora todos los artículos relacionados con esta etiqueta en nuestro blog.
          </motion.p>
        )}

        {tag.metaKeywords && tag.metaKeywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {Object.values(tag.metaKeywords).map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                #{keyword}
              </span>
            ))}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2" style={{ borderColor: tag.color || "#ff1f1f" }}>
          Artículos ({posts.length})
        </h2>

        {posts.length > 0 ? (
          <BlogList blog={posts} />
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-center py-16 border border-dashed border-gray-300 rounded-lg bg-gray-50"
          >
            <h3 className="text-xl font-semibold mb-2">No se encontraron artículos</h3>
            <p className="text-gray-500">No hay artículos con esta etiqueta todavía.</p>
            <p className="text-sm text-gray-400 mt-4">Intenta con otras etiquetas o vuelve más tarde.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
