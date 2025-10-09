"use client"

import Script from "next/script"
import type { BlogPost, BlogCategory, BlogComment } from "@/types/blog"

// Añadir esta función auxiliar al principio del archivo
function extractTagNames(tags: any[]): string[] {
  if (!tags || !Array.isArray(tags)) return []

  return tags
    .map((tag) => {
      if (typeof tag === "string") return tag
      if (typeof tag === "object" && tag !== null && "name" in tag) return tag.name
      return ""
    })
    .filter(Boolean)
}

// Función para formatear fechas de manera segura
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

// Update the PostSchemaProps interface to include comments and reactions
interface PostSchemaProps {
  post: BlogPost
  category?: BlogCategory | null
  url: string
  comments?: BlogComment[]
  reactions?: PostReaction[]
}

// Define PostReaction type (or import it if it exists in your types)
interface PostReaction {
  reactionType: string
  userId: string
  userName?: string
  userImageUrl?: string
  createdAt: string | Date
  postId: string
}

export function PostSchema({ post, category, url, comments = [], reactions = [] }: PostSchemaProps) {
  // Format dates for schema - usar la función segura
  const publishDate = safeISOString(post.publishDate) || new Date().toISOString()
  const modifiedDate = safeISOString(post.updatedAt) || safeISOString(post.updatedDate) || publishDate

  // Get the base URL for the website
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ravehublatam.com"

  // Generate multiple schemas for better SEO coverage
  const schemas = []

  // 1. Website schema (define the website the article belongs to)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "Ravehub",
    description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Ravehub",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo-full.png`,
        width: 330,
        height: 60,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
  schemas.push(websiteSchema)

  // 2. Organization schema (enhance the existing one)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Ravehub",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/images/logo-full.png`,
      width: 330,
      height: 60,
    },
    sameAs: [
      "https://www.facebook.com/ravehublatam",
      "https://www.instagram.com/ravehublatam",
      "https://twitter.com/ravehublatam",
      "https://www.tiktok.com/@ravehublatam",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+51 944 784 488",
      contactType: "customer support",
      availableLanguage: ["Spanish", "English"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "Peru",
      addressLocality: "Lima",
    },
    foundingDate: "2020",
    founders: [
      {
        "@type": "Person",
        name: "Ravehub Founder",
      },
    ],
    description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
  }
  schemas.push(organizationSchema)

  // 3. BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category?.name || "Artículo",
        item: category?.slug ? `${baseUrl}/blog/categorias/${category.slug}` : `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: url,
      },
    ],
  }
  schemas.push(breadcrumbSchema)

  // 4. Main Article/BlogPosting/NewsArticle schema (comprehensive version)
  const articleSchema: any = {
    "@context": "https://schema.org",
    "@type": post.schemaType || "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: post.title,
    name: post.title,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: post.authorName || post.author || "Ravehub Team",
      ...(post.authorImageUrl && { image: post.authorImageUrl }),
      ...(post.authorUrl && { url: post.authorUrl }),
      ...(post.authorEmail && { email: post.authorEmail }),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Ravehub",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo-full.png`,
        width: 330,
        height: 60,
      },
    },
    articleSection: post.categoryName || category?.name || "Blog",
    keywords: (post.seoKeywords || extractTagNames(post.tags || []) || []).join(", "),
    inLanguage: "es",
    wordCount: post.content ? post.content.split(/\s+/).length : undefined,
    isAccessibleForFree: true,
    copyrightYear: new Date(publishDate).getFullYear(),
    copyrightHolder: {
      "@type": "Organization",
      name: "Ravehub",
    },
    ...(post.averageRating &&
      post.ratingCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          itemReviewed: {
            "@type": post.schemaType || "BlogPosting",
            name: post.title,
          },
          ratingValue: Number(post.averageRating.toFixed(1)),
          reviewCount: post.ratingCount,
          bestRating: 5,
          worstRating: 1,
          ratingCount: post.ratingCount,
        },
      }),
  }

  // Add NewsArticle specific properties if applicable
  if (post.schemaType === "NewsArticle") {
    articleSchema.dateline = post.location?.city ? `${post.location.city}, ${post.location.country}` : undefined
    articleSchema.printSection = post.categoryName || category?.name || "News"
    articleSchema.printEdition = "Online Edition"
    articleSchema.newUpdates = post.updatedAt ? "Updated with latest information" : undefined

    // Add NewsArticle specific properties for better Google News inclusion
    articleSchema.dateCreated = publishDate
    articleSchema.datePublished = publishDate
    articleSchema.dateModified = modifiedDate

    // Add NewsArticle specific properties for better Google News inclusion
    articleSchema.reportingPrinciples = `${baseUrl}/politica-editorial`
    articleSchema.diversityPolicy = `${baseUrl}/politica-diversidad`
    articleSchema.ethicsPolicy = `${baseUrl}/codigo-etico`
    articleSchema.correctionsPolicy = `${baseUrl}/politica-correcciones`

    // Add NewsArticle specific properties for better Google News inclusion
    if (post.isBreakingNews) {
      articleSchema.isBreakingNews = true
    }

    if (post.isLiveBlogPosting) {
      articleSchema["@type"] = "LiveBlogPosting"
      articleSchema.coverageStartTime = publishDate
      articleSchema.coverageEndTime = modifiedDate
    }
  }

  // Add Review specific properties if applicable
  if (post.schemaType === "Review") {
    articleSchema.reviewRating = {
      "@type": "Rating",
      ratingValue: post.rating || 5,
      bestRating: 5,
      worstRating: 1,
    }

    articleSchema.itemReviewed = {
      "@type": post.reviewItemType || "Product",
      name: post.reviewItemName || post.title,
      ...(post.reviewItemImage && {
        image: post.reviewItemImage,
      }),
    }
  }

  // Add HowTo specific properties if applicable
  if (post.schemaType === "HowTo") {
    articleSchema["@type"] = "HowTo"
    articleSchema.step = post.howToSteps || []
    articleSchema.tool = post.howToTools || []
    articleSchema.supply = post.howToSupplies || []
    articleSchema.totalTime = post.howToDuration || "PT30M"
  }

  // Add Event specific properties if applicable
  if (post.schemaType === "Event") {
    articleSchema["@type"] = "Event"
    articleSchema.startDate = post.eventDate || publishDate
    articleSchema.endDate = post.eventEndDate
    articleSchema.location = {
      "@type": "Place",
      name: post.location?.venueName || "",
      address: {
        "@type": "PostalAddress",
        addressLocality: post.location?.city || "",
        addressCountry: post.location?.country || "",
      },
    }
    articleSchema.performer = {
      "@type": "PerformingGroup",
      name: post.eventPerformer || "Various Artists",
    }
    articleSchema.offers = post.eventPrice
      ? {
          "@type": "Offer",
          price: post.eventPrice,
          priceCurrency: post.eventCurrency || "USD",
          availability: "https://schema.org/InStock",
          url: post.eventUrl || url,
          validFrom: post.eventTicketsDate || publishDate,
        }
      : undefined
  }

  // Add images with proper formatting
  if (post.mainImageUrl || post.featuredImageUrl) {
    articleSchema.image = [
      {
        "@type": "ImageObject",
        url: post.mainImageUrl || post.featuredImageUrl,
        width: 1200,
        height: 630,
        caption: post.imageCaption || post.title,
      },
    ]
  }

  // Add location if available
  if (post.location) {
    articleSchema.locationCreated = {
      "@type": "Place",
      name: post.location.venueName,
      address: {
        "@type": "PostalAddress",
        addressLocality: post.location.city,
        addressCountry: {
          "@type": "Country",
          name: post.location.country,
        },
      },
    }
  }

  // Add comments if available
  if (comments && comments.length > 0) {
    const approvedComments = comments.filter((comment) => comment.isApproved)
    if (approvedComments.length > 0) {
      articleSchema.comment = approvedComments.map((comment) => ({
        "@type": "Comment",
        author: {
          "@type": "Person",
          name: comment.name,
          ...(comment.email && { email: comment.email }),
        },
        datePublished: safeISOString(comment.createdAt) || new Date().toISOString(),
        text: comment.content,
      }))
    }
  }

  // Add reviews if there are ratings with comments
  if (post.averageRating && post.ratingCount) {
    // Check if we have any ratings with comments in the comments array
    const ratingComments = comments.filter((comment) => comment.isRating && comment.rating)

    if (ratingComments.length > 0) {
      articleSchema.review = ratingComments.map((comment) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: comment.rating,
          bestRating: 5,
          worstRating: 1,
        },
        author: {
          "@type": "Person",
          name: comment.name || "Usuario",
        },
        datePublished: safeISOString(comment.createdAt) || new Date().toISOString(),
        reviewBody: comment.content,
      }))
    }
  }

  // Add reactions if available
  if (reactions && reactions.length > 0) {
    articleSchema.interactionStatistic = reactions.reduce((stats: any[], reaction) => {
      // Find if we already have a counter for this reaction type
      const existingIndex = stats.findIndex(
        (stat) => stat.interactionType === `https://schema.org/${reaction.reactionType}Action`,
      )

      if (existingIndex >= 0) {
        // Increment existing counter
        stats[existingIndex].userInteractionCount += 1
      } else {
        // Add new counter
        stats.push({
          "@type": "InteractionCounter",
          interactionType: `https://schema.org/${reaction.reactionType}Action`,
          userInteractionCount: 1,
        })
      }

      return stats
    }, [])
  }

  // Add tags if available
  if (post.tags && post.tags.length > 0) {
    const tagObjects = post.tags.filter((tag) => typeof tag === "object" && tag !== null)
    if (tagObjects.length > 0) {
      articleSchema.about = tagObjects.map((tag) => ({
        "@type": "Thing",
        name: tag.name,
        ...(tag.description && { description: tag.description }),
        ...(tag.imageUrl && { image: tag.imageUrl }),
      }))
    }
  }

  // Add social shares if available
  if (post.socialShares) {
    const totalShares = Object.values(post.socialShares).reduce((sum: number, count: any) => sum + (count || 0), 0)
    if (totalShares > 0) {
      articleSchema.interactionStatistic = {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "ShareAction",
        },
        userInteractionCount: totalShares,
      }
    }
  }

  schemas.push(articleSchema)

  // 5. VideoObject schema if post has video
  if (post.videoUrl) {
    const videoSchema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: post.videoTitle || post.title,
      description: post.videoDescription || post.shortDescription || post.excerpt || "",
      thumbnailUrl: post.videoThumbnail || post.mainImageUrl || post.featuredImageUrl,
      uploadDate: publishDate,
      contentUrl: post.videoUrl,
      embedUrl: post.videoEmbedUrl || post.videoUrl,
      duration: post.videoDuration || "PT2M30S", // Default 2min 30sec in ISO 8601 duration format
      publisher: {
        "@type": "Organization",
        name: "Ravehub",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/images/logo-full.png`,
          width: 330,
          height: 60,
        },
      },
      inLanguage: "es",
      potentialAction: {
        "@type": "WatchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: post.videoUrl,
        },
      },
    }
    schemas.push(videoSchema)
  }

  // 6. FAQPage schema if post has FAQ sections
  if (post.faqItems && post.faqItems.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqItems.map((faq: any) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    }
    schemas.push(faqSchema)
  }

  // 7. Event schema if post is about an event
  if (post.isEventPost && post.eventDetails) {
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: post.eventDetails.name || post.title,
      description: post.eventDetails.description || post.shortDescription || "",
      startDate: safeISOString(post.eventDetails.startDate) || publishDate,
      endDate: safeISOString(post.eventDetails.endDate),
      location: {
        "@type": "Place",
        name: post.eventDetails.venueName,
        address: {
          "@type": "PostalAddress",
          addressLocality: post.eventDetails.city,
          addressRegion: post.eventDetails.region,
          addressCountry: post.eventDetails.country,
        },
        geo: post.eventDetails.coordinates
          ? {
              "@type": "GeoCoordinates",
              latitude: post.eventDetails.coordinates.latitude,
              longitude: post.eventDetails.coordinates.longitude,
            }
          : undefined,
      },
      image: post.eventDetails.imageUrl || post.mainImageUrl || post.featuredImageUrl,
      performer: {
        "@type": "PerformingGroup",
        name: post.eventDetails.performer || "Various Artists",
      },
      organizer: {
        "@type": "Organization",
        name: post.eventDetails.organizer || "Ravehub",
        url: post.eventDetails.organizerUrl || baseUrl,
      },
      offers: {
        "@type": "Offer",
        price: post.eventDetails.price || "0",
        priceCurrency: post.eventDetails.currency || "USD",
        availability: "https://schema.org/InStock",
        url: post.eventDetails.ticketUrl || url,
        validFrom: safeISOString(post.eventDetails.ticketSaleDate) || publishDate,
      },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    }
    schemas.push(eventSchema)
  }

  // 8. Person schema for author
  if (post.authorName) {
    const personSchema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${baseUrl}/autores/${post.authorSlug || "equipo"}#person`,
      name: post.authorName,
      url: post.authorUrl || `${baseUrl}/autores/${post.authorSlug || "equipo"}`,
      ...(post.authorImageUrl && { image: post.authorImageUrl }),
      ...(post.authorEmail && { email: post.authorEmail }),
      jobTitle: post.authorJobTitle || "Escritor",
      worksFor: {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "Ravehub",
      },
      description: post.authorBio || `Autor en Ravehub especializado en música electrónica y eventos.`,
      sameAs: post.authorSocialLinks || [],
    }
    schemas.push(personSchema)
  }

  // 9. WebPage schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    url: url,
    name: post.title,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "Ravehub",
      description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
    },
    inLanguage: "es",
    primaryImageOfPage:
      post.mainImageUrl || post.featuredImageUrl
        ? {
            "@type": "ImageObject",
            url: post.mainImageUrl || post.featuredImageUrl,
            width: 1200,
            height: 630,
          }
        : undefined,
    datePublished: publishDate,
    dateModified: modifiedDate,
    potentialAction: {
      "@type": "ReadAction",
      target: [url],
    },
    breadcrumb: {
      "@id": `${url}#breadcrumb`,
    },
    mainEntity: {
      "@id": `${url}#article`,
    },
  }
  schemas.push(webPageSchema)

  // Return the schemas as a <script> element
  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={`schema-${index}`}
          id={`post-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
          strategy="beforeInteractive"
        />
      ))}
    </>
  )
}
