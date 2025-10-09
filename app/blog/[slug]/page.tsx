import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getPostBySlug } from "@/lib/firebase/blog"
import { Breadcrumbs } from "@/components/blog/breadcrumbs"
import { PostDetailSkeleton } from "@/components/blog/post-detail-skeleton"
import { BlogSidebarSkeleton } from "@/components/blog/blog-sidebar-skeleton"
import { PostDetailWrapper } from "@/components/blog/post-detail-wrapper"
import { BlogSidebarWrapper } from "@/components/blog/blog-sidebar-wrapper"
import { getRedirectedSlug } from "@/lib/firebase/slug-redirects"
import { EnhancedPostSchema } from "@/components/blog/enhanced-post-schema"
import { RelatedPostsSection } from "@/components/blog/related-posts-section"
import Script from "next/script"
import { BlogCategory } from "@/types/blog"

export const dynamic = "force-dynamic"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

// Helper function to safely format dates for ISO string
function safeISOString(date: any): string | undefined {
  if (!date) return undefined

  try {
    // Si es una cadena, intentar convertirla a Date
    if (typeof date === "string") {
      const parsedDate = new Date(date)
      // Verificar si la fecha es válida
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // Si es un objeto Date
    if (date instanceof Date) {
      // Verificar si la fecha es válida
      return !isNaN(date.getTime()) ? date.toISOString() : undefined
    }

    // Si es un Timestamp de Firebase (tiene seconds y nanoseconds)
    if (date && typeof date === "object" && "seconds" in date && "nanoseconds" in date) {
      const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000
      const parsedDate = new Date(milliseconds)
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // Último intento: convertir a Date si es un número o una cadena válida
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
  } catch (e) {
    console.error("Error al convertir fecha a ISO string:", e)
    return undefined
  }
}

// Enhance generateMetadata to add more metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Artículo no encontrado | Ravehub Blog",
      description: "El artículo que buscas no existe o ha sido eliminado.",
    }
  }

  // Extraer los nombres de las etiquetas si son objetos
  const tagNames = post.tags ? post.tags.map((tag) => (typeof tag === "string" ? tag : tag.name)) : []

  // Build basic metadata
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ravehublatam.com"
  const postUrl = `${baseUrl}/blog/${post.slug}`

  // Get the main image URL
  const imageUrl = post.mainImageUrl || post.featuredImageUrl || `${baseUrl}/placeholder.jpg`

  // Determine content type for appropriate metadata
  const contentType =
    post.contentType ||
    (post.schemaType === "NewsArticle"
      ? "news"
      : post.schemaType === "Event"
        ? "event"
        : post.schemaType === "Review"
          ? "review"
          : post.schemaType === "HowTo"
            ? "guide"
            : "blog")

  // Set appropriate Open Graph type
  const ogType = post.ogType || (contentType === "event" ? "event" : "article")

  // Enhanced keywords for better SEO targeting
  const enhancedKeywords = [
    ...(post.seoKeywords || tagNames || []),
    // Add contextual keywords based on content type
    ...(contentType === "event" ? ["evento", "concierto", "festival", "entradas"] : []),
    ...(contentType === "news" ? ["noticia", "actualidad", "novedad"] : []),
    ...(contentType === "review" ? ["reseña", "opinión", "crítica"] : []),
    // Add location-based keywords if available (check for eventDetails location)
    ...((post as any).eventDetails?.city ? [(post as any).eventDetails.city.toLowerCase()] : []),
    ...((post as any).eventDetails?.country ? [(post as any).eventDetails.country.toLowerCase()] : []),
    // Add music genre keywords
    "música electrónica", "techno", "house", "electronic music", "rave", "festival"
  ].filter((keyword, index, arr) => arr.indexOf(keyword) === index) // Remove duplicates

  return {
    title: post.seoTitle || `${post.title} | Ravehub Blog`,
    description: post.seoDescription || post.excerpt || "",
    keywords: enhancedKeywords,
    authors: post.author ? [{ name: typeof post.author === 'string' ? post.author : post.author.name }] : undefined,
    category: post.categoryName || "Blog",
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || "",
      url: postUrl,
      siteName: "Ravehub",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "es_ES",
      type: "article",
      publishedTime: safeISOString(post.publishDate),
      modifiedTime: safeISOString(post.updatedDate),
      authors: post.author ? [typeof post.author === 'string' ? post.author : post.author.name || ''] : undefined,
      tags: tagNames,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || "",
      images: imageUrl ? [imageUrl] : undefined,
      creator: post.twitterCreator || "@ravehublatam",
      site: "@ravehublatam",
    },
    alternates: {
      canonical: post.canonicalUrl || postUrl,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  }
}

// Modificar la función principal para manejar redirecciones
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  // Verificar si el slug actual es el definitivo o necesita redirección
  const finalSlug = await getRedirectedSlug(slug)

  // Si el slug final es diferente al original, redirigir
  if (finalSlug !== slug) {
    redirect(`/blog/${finalSlug}`)
  }

  // Continuar con la lógica existente usando el slug final
  const post = await getPostBySlug(finalSlug)

  if (!post) {
    console.log(`Post no encontrado para slug: ${finalSlug}`)
    notFound()
  }

  // URL completa para el schema
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ravehublatam.com"
  const fullUrl = `${baseUrl}/blog/${post.slug}`

  // Construir la ruta de navegación básica (sin categoría que se cargará después)
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title, href: `/blog/${post.slug}`, current: true },
  ]

  // Determine if this is a news article or a blog post
  const isNewsArticle =
    post.isNewsArticle ||
    post.categoryName?.toLowerCase().includes("noticia") ||
    post.categoryName?.toLowerCase().includes("news") ||
    post.tags?.some((tag) => {
      const tagName = typeof tag === "string" ? tag : tag.name
      return tagName?.toLowerCase().includes("noticia") || tagName?.toLowerCase().includes("news")
    })

  // Choose the appropriate schema type
  const schemaType = isNewsArticle ? "NewsArticle" : "BlogPosting"

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<PostDetailSkeleton />}>
            <PostDetailWrapper slug={finalSlug} priority={true} />
          </Suspense>
        </div>

        {/* Barra lateral */}
        <div className="lg:col-span-1">
          <Suspense fallback={<BlogSidebarSkeleton />}>
            <BlogSidebarWrapper postId={post.id} />
          </Suspense>
        </div>
      </div>

      {/* Datos estructurados para SEO */}
      <Suspense fallback={null}>
        <EnhancedPostSchema post={{ ...post, schemaType }} category={post.category as BlogCategory} url={fullUrl} />
      </Suspense>

      {/* Add WebSite schema */}
      <Script id="website-schema" type="application/ld+json" strategy="beforeInteractive">
        {`
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "${baseUrl}/#website",
          "url": "${baseUrl}",
          "name": "Ravehub",
          "description": "La plataforma líder en eventos de música electrónica en Latinoamérica",
          "publisher": {
            "@type": "Organization",
            "@id": "${baseUrl}/#organization",
            "name": "Ravehub",
            "logo": {
              "@type": "ImageObject",
              "url": "${baseUrl}/images/logo-full.png",
              "width": 330,
              "height": 60
            }
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "${baseUrl}/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }
        `}
      </Script>

      {/* Add Organization schema */}
      <Script id="organization-schema" type="application/ld+json" strategy="beforeInteractive">
        {`
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "${baseUrl}/#organization",
          "name": "Ravehub",
          "url": "${baseUrl}",
          "logo": {
            "@type": "ImageObject",
            "url": "${baseUrl}/images/logo-full.png",
            "width": 330,
            "height": 60
          },
          "sameAs": [
            "https://www.facebook.com/ravehublatam",
            "https://www.instagram.com/ravehublatam",
            "https://twitter.com/ravehublatam",
            "https://www.tiktok.com/@ravehublatam"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+51 944 784 488",
            "contactType": "customer support",
            "availableLanguage": ["Spanish", "English"]
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "Peru",
            "addressLocality": "Lima"
          }
        }
        `}
      </Script>

      {/* Add BreadcrumbList schema */}
      <Script id="breadcrumb-schema" type="application/ld+json" strategy="beforeInteractive">
        {`
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "@id": "${fullUrl}#breadcrumb",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Inicio",
              "item": "${baseUrl}"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": "${baseUrl}/blog"
            },
            ${
              post.category?.name
                ? `
            {
              "@type": "ListItem",
              "position": 3,
              "name": "${post.category.name.replace(/"/g, '\\"')}",
              "item": "${baseUrl}/blog/categorias/${post.category.slug}"
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": "${post.title.replace(/"/g, '\\"')}",
              "item": "${fullUrl}"
            }`
                : `
            {
              "@type": "ListItem",
              "position": 3,
              "name": "${post.title.replace(/"/g, '\\"')}",
              "item": "${fullUrl}"
            }`
            }
          ]
        }
        `}
      </Script>

      {/* Add WebPage schema */}
      <Script id="webpage-schema" type="application/ld+json" strategy="beforeInteractive">
        {`
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": "${fullUrl}",
          "url": "${fullUrl}",
          "name": "${post.title.replace(/"/g, '\\"')}",
          "description": "${(post.seoDescription || post.excerpt || "").replace(/"/g, '\\"')}",
          "isPartOf": {
            "@type": "WebSite",
            "@id": "${baseUrl}/#website",
            "url": "${baseUrl}",
            "name": "Ravehub",
            "description": "La plataforma líder en eventos de música electrónica en Latinoamérica"
          },
          "inLanguage": "es",
          ${
            post.mainImageUrl || post.featuredImageUrl
              ? `"primaryImageOfPage": {
                  "@type": "ImageObject",
                  "url": "${post.mainImageUrl || post.featuredImageUrl}",
                  "width": 1200,
                  "height": 630
                },`
              : ""
          }
          "datePublished": "${safeISOString(post.publishDate) || new Date().toISOString()}",
          "dateModified": "${safeISOString(post.updatedDate) || safeISOString(post.publishDate) || new Date().toISOString()}",
          "breadcrumb": {
            "@id": "${fullUrl}#breadcrumb"
          },
          "potentialAction": {
            "@type": "ReadAction",
            "target": ["${fullUrl}"]
          }
        }
        `}
      </Script>

      {/* Add Article/BlogPosting/NewsArticle schema */}
      <Script id="article-schema" type="application/ld+json" strategy="beforeInteractive">
        {`
        {
          "@context": "https://schema.org",
          "@type": "${schemaType}",
          "@id": "${fullUrl}#article",
          "headline": "${post.title.replace(/"/g, '\\"')}",
          "name": "${post.title.replace(/"/g, '\\"')}",
          "description": "${(post.seoDescription || post.excerpt || "").replace(/"/g, '\\"')}",
          "datePublished": "${safeISOString(post.publishDate) || new Date().toISOString()}",
          "dateModified": "${safeISOString(post.updatedDate) || safeISOString(post.publishDate) || new Date().toISOString()}",
          "author": {
            "@type": "Person",
            "name": "${post.authorName || post.author || "Ravehub Team"}"
          },
          "publisher": {
            "@type": "Organization",
            "@id": "${baseUrl}/#organization",
            "name": "Ravehub",
            "logo": {
              "@type": "ImageObject",
              "url": "${baseUrl}/images/logo-full.png",
              "width": 330,
              "height": 60
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${fullUrl}"
          },
          "articleSection": "${post.categoryName || post.category?.name || "Blog"}",
          "keywords": "${(post.seoKeywords || (post.tags ? post.tags.map((tag) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean) : [])).join(", ")}",
          "inLanguage": "es",
          "isAccessibleForFree": true
          ${
            post.mainImageUrl || post.featuredImageUrl
              ? `,
          "image": {
            "@type": "ImageObject",
            "url": "${post.mainImageUrl || post.featuredImageUrl}",
            "width": 1200,
            "height": 630
          }`
              : ""
          }
        }
        `}
      </Script>

      {/* Add Person schema for author if available */}
      {post.authorName && (
        <Script id="person-schema" type="application/ld+json" strategy="beforeInteractive">
          {`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": "${baseUrl}/autores/${post.authorSlug || "equipo"}#person",
            "name": "${post.authorName.replace(/"/g, '\\"')}",
            "url": "${post.authorUrl || `${baseUrl}/autores/${post.authorSlug || "equipo"}`}",
            ${post.authorImageUrl ? `"image": "${post.authorImageUrl}",` : ""}
            "jobTitle": "${post.authorJobTitle || "Escritor"}",
            "worksFor": {
              "@type": "Organization",
              "@id": "${baseUrl}/#organization",
              "name": "Ravehub"
            }
          }
          `}
        </Script>
      )}

      {/* Add FAQPage schema if FAQs are detected */}
      {post.faqItems && post.faqItems.length > 0 && (
        <Script id="faq-schema" type="application/ld+json" strategy="beforeInteractive">
          {`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ${post.faqItems
                .map(
                  (faq: any) => `{
                "@type": "Question",
                "name": "${faq.question.replace(/"/g, '\\"')}",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "${faq.answer.replace(/"/g, '\\"')}"
                }
              }`,
                )
                .join(",")}
            ]
          }
          `}
        </Script>
      )}

      {/* Add VideoObject schema if video is detected */}
      {post.videoUrl && (
        <Script id="video-schema" type="application/ld+json" strategy="beforeInteractive">
          {`
          {
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "${(post.videoTitle || post.title).replace(/"/g, '\\"')}",
            "description": "${(post.videoDescription || post.excerpt || "").replace(/"/g, '\\"')}",
            "thumbnailUrl": "${post.videoThumbnail || post.mainImageUrl || post.featuredImageUrl}",
            "uploadDate": "${safeISOString(post.publishDate) || new Date().toISOString()}",
            "contentUrl": "${post.videoUrl}",
            "embedUrl": "${post.videoEmbedUrl || post.videoUrl}",
            "duration": "${post.videoDuration || "PT2M30S"}",
            "publisher": {
              "@type": "Organization",
              "name": "Ravehub",
              "logo": {
                "@type": "ImageObject",
                "url": "${baseUrl}/images/logo-full.png"
              }
            }
          }
          `}
        </Script>
      )}

      {/* Add Event schema if event is detected */}
      {post.isEventPost && post.eventDetails && (
        <Script id="event-schema" type="application/ld+json" strategy="beforeInteractive">
          {`
          {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "${(post.eventDetails.name || post.title).replace(/"/g, '\\"')}",
            "description": "${(post.eventDetails.description || "").replace(/"/g, '\\"')}",
            "startDate": "${safeISOString(post.eventDetails.startDate) || safeISOString(post.publishDate) || new Date().toISOString()}",
            ${post.eventDetails.endDate ? `"endDate": "${safeISOString(post.eventDetails.endDate)}",` : ""}
            "location": {
              "@type": "Place",
              "name": "${post.eventDetails.venueName.replace(/"/g, '\\"')}",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "${post.eventDetails.city.replace(/"/g, '\\"')}",
                ${post.eventDetails.region ? `"addressRegion": "${post.eventDetails.region.replace(/"/g, '\\"')}",` : ""}
                "addressCountry": "${post.eventDetails.country.replace(/"/g, '\\"')}"
              }
            },
            "image": "${post.eventDetails.imageUrl || post.mainImageUrl || post.featuredImageUrl}",
            "performer": {
              "@type": "PerformingGroup",
              "name": "${(post.eventDetails.performer || "Various Artists").replace(/"/g, '\\"')}"
            },
            "organizer": {
              "@type": "Organization",
              "name": "${(post.eventDetails.organizer || "Ravehub").replace(/"/g, '\\"')}",
              "url": "${post.eventDetails.organizerUrl || baseUrl}"
            },
            "offers": {
              "@type": "Offer",
              "price": "${post.eventDetails.price || "0"}",
              "priceCurrency": "${post.eventDetails.currency || "USD"}",
              "availability": "https://schema.org/InStock",
              "url": "${post.eventDetails.ticketUrl || fullUrl}"
            },
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
          }
          `}
        </Script>
      )}

      {/* Related Posts Section */}
      <RelatedPostsSection
        currentPostId={post.id}
        categoryId={post.categoryId}
        tags={post.tags?.map(tag => typeof tag === 'string' ? tag : tag.name)}
        limit={4}
      />
    </div>
  )
}
