"use client"

import { useEffect, useState } from "react"
import { getTagBySlug } from "@/lib/firebase/blog"
import { PostListWrapper } from "@/components/blog/post-list-wrapper"
import { BlogSidebarWrapper } from "@/components/blog/blog-sidebar-wrapper"
import { PageHeader } from "@/components/page-header"
import { TagSchema } from "@/components/blog/tag-schema"
import type { BlogTag } from "@/types/blog"

interface TagClientPageProps {
  slug: string
}

export default function TagClientPage({ slug }: TagClientPageProps) {
  const [tag, setTag] = useState<BlogTag | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTag() {
      try {
        const tagData = await getTagBySlug(slug)
        setTag(tagData)
      } catch (error) {
        console.error("Error cargando etiqueta:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTag()
  }, [slug])

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  if (!tag) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Etiqueta no encontrada</h1>
        <p>La etiqueta que buscas no existe o ha sido eliminada.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={`#${tag.name}`}
        description={tag.description || `Artículos con la etiqueta #${tag.name}`}
        imageUrl={tag.imageUrl}
      />

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        <div className="w-full lg:w-3/4">
          <PostListWrapper tagSlug={slug} />
        </div>

        <div className="w-full lg:w-1/4">
          <BlogSidebarWrapper />
        </div>
      </div>

      {/* Structured Data */}
      {tag && <TagSchema tag={tag} />}
    </div>
  )
}
