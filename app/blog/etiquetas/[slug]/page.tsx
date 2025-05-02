import type { Metadata } from "next"
import { getTagBySlug } from "@/lib/firebase/blog"
import TagClientPage from "./TagClientPage"

interface TagPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    return {
      title: "Etiqueta no encontrada",
    }
  }

  return {
    title: tag.seoTitle || `Posts etiquetados con ${tag.name} | RaveHub Blog`,
    description: tag.seoDescription || `Explora todos los artículos relacionados con ${tag.name} en nuestro blog.`,
    keywords: tag.metaKeywords ? Object.values(tag.metaKeywords).join(", ") : undefined,
    openGraph: {
      title: tag.seoTitle || `Posts etiquetados con ${tag.name} | RaveHub Blog`,
      description: tag.seoDescription || `Explora todos los artículos relacionados con ${tag.name} en nuestro blog.`,
      type: "website",
      images: tag.imageUrl ? [{ url: tag.imageUrl, width: 1200, height: 630 }] : [],
    },
  }
}

export default async function TagPage({ params }: TagPageProps) {
  return <TagClientPage params={params} />
}
