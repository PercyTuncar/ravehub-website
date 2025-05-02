import type { BlogCategory, BlogPost } from "@/types/blog"

interface CategorySchemaProps {
  category: BlogCategory
  parentCategory?: BlogCategory | null
  posts?: BlogPost[]
  url: string
  baseUrl?: string
}

// Función auxiliar para formatear fechas de manera segura
const formatDate = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString()

  try {
    // Si ya es un objeto Date
    if (dateValue instanceof Date) {
      return dateValue.toISOString()
    }

    // Si es un timestamp de Firestore
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toISOString()
    }

    // Si es un string o número, intentar crear un Date
    return new Date(dateValue).toISOString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return new Date().toISOString() // Fecha actual como fallback
  }
}

export function generateCategorySchema(props: CategorySchemaProps): Record<string, any> {
  const { category, parentCategory, posts = [], url } = props
  const baseUrl = props.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.com"

  // Format dates for schema safely
  const createdDate = category.createdAt ? formatDate(category.createdAt) : new Date().toISOString()
  const modifiedDate = category.updatedAt ? formatDate(category.updatedAt) : createdDate

  // Get the image from the category.image field first, then fallback to imageUrl
  const categoryImage = category.image || category.imageUrl || ""

  // Create base schema data
  const schemaData: any = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url: url,
    name: category.seoTitle || category.name,
    headline: category.seoTitle || `${category.name} | RaveHub Blog`,
    description: category.seoDescription || category.description || "",
    keywords: Array.isArray(category.metaKeywords) ? category.metaKeywords.join(", ") : "",
    inLanguage: "es",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "RaveHub",
      description: "Festivales y eventos de música electrónica en Latinoamérica",
      publisher: {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "RaveHub",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/images/logo-full.png`,
        },
      },
    },
    image: categoryImage
      ? {
          "@type": "ImageObject",
          url: categoryImage,
          width: 1200,
          height: 630,
        }
      : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    datePublished: createdDate,
    dateModified: modifiedDate,
  }

  // Add parent category if available
  if (parentCategory) {
    schemaData.parentItem = {
      "@type": "CollectionPage",
      name: parentCategory.name,
      url: `${baseUrl}/blog/categorias/${parentCategory.slug}`,
    }
  }

  // Add posts if available as itemListElement
  if (posts.length > 0) {
    schemaData.mainEntity = {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => {
        // Manejar fechas de publicación y modificación de manera segura
        const publishDate = post.publishDate ? formatDate(post.publishDate) : formatDate(new Date())
        const modifyDate = post.updatedAt ? formatDate(post.updatedAt) : publishDate
        const postUrl = `${baseUrl}/blog/${post.slug}`

        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": post.schemaType || "BlogPosting",
            "@id": `${postUrl}#article`,
            headline: post.title,
            name: post.title,
            url: postUrl,
            datePublished: publishDate,
            dateModified: modifyDate,
            author: {
              "@type": "Person",
              name: post.author || post.authorName || "RaveHub",
              url: post.authorId ? `${baseUrl}/autores/${post.authorId}` : undefined,
            },
            publisher: {
              "@type": "Organization",
              name: "RaveHub",
              logo: {
                "@type": "ImageObject",
                url: `${baseUrl}/images/logo-full.png`,
              },
            },
            image: post.featuredImageUrl || post.mainImageUrl || post.featuredImage || "",
            description: post.excerpt || post.shortDescription || "",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": postUrl,
            },
          },
        }
      }),
    }

    // Add breadcrumb list
    schemaData.breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@id": baseUrl,
            name: "Inicio",
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@id": `${baseUrl}/blog`,
            name: "Blog",
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@id": url,
            name: category.name,
          },
        },
      ],
    }
  }

  // Remove undefined values
  return JSON.parse(JSON.stringify(schemaData))
}

// Replace the CategorySchema component with this implementation that actually renders the schema
export function CategorySchema({ category, parentCategory, posts = [], url }: CategorySchemaProps) {
  const schemaData = generateCategorySchema({ category, parentCategory, posts, url })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
}
