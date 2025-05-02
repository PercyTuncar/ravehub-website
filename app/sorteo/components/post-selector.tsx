"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, FileText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { BlogPost } from "@/types/blog"

interface PostSelectorProps {
  posts: BlogPost[]
  selectedPost: BlogPost | null
  onSelectPost: (post: BlogPost) => void
  isLoading: boolean
}

export default function PostSelector({ posts, selectedPost, onSelectPost, isLoading }: PostSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPosts = posts.filter((post) => post.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100"
    >
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
        Seleccionar Publicación
      </h2>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar publicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 bg-indigo-50/50"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-indigo-50">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 text-indigo-600" />
            </motion.div>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPost(post)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
                selectedPost?.id === post.id
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
                  : "bg-gray-50 border border-gray-100 hover:border-indigo-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText
                  className={`h-5 w-5 mt-0.5 ${selectedPost?.id === post.id ? "text-indigo-600" : "text-gray-500"}`}
                />
                <div>
                  <h3 className={`font-medium ${selectedPost?.id === post.id ? "text-indigo-700" : "text-gray-800"}`}>
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt || "Sin descripción"}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No se encontraron publicaciones</div>
        )}
      </div>
    </motion.div>
  )
}
