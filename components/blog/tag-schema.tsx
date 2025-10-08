import type { BlogTag } from "@/types"

interface TagSchemaProps {
  tag: BlogTag
}

export function TagSchema({ tag }: TagSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `https://ravehub.es/blog/etiquetas/${tag.slug}`,
    name: tag.seoTitle || `Posts etiquetados con ${tag.name}`,
    description: tag.seoDescription || `Explora todos los artículos relacionados con ${tag.name} en nuestro blog.`,
    url: `https://ravehub.es/blog/etiquetas/${tag.slug}`,
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://ravehub.es/#website",
      name: "Ravehub",
      url: "https://ravehub.es",
    },
    inLanguage: "es",
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
}
