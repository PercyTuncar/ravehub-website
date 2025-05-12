"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import type { BlogPost, BlogCategory, BlogComment } from "@/types/blog"

interface PostReaction {
  reactionType: string
  userId: string
  userName?: string
  userImageUrl?: string
  createdAt: string | Date
  postId: string
}

interface ComprehensiveSchemaProps {
  post: BlogPost
  category?: BlogCategory | null
  url: string
  comments?: BlogComment[]
  reactions?: PostReaction[]
  breadcrumbs?: Array<{ name: string; item: string }>
}

// Helper function to safely format dates for ISO string
function safeISOString(date: any): string | undefined {
  if (!date) return undefined

  try {
    // If it's a string, try to convert it to Date
    if (typeof date === "string") {
      const parsedDate = new Date(date)
      // Check if the date is valid
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // If it's a Date object
    if (date instanceof Date) {
      // Check if the date is valid
      return !isNaN(date.getTime()) ? date.toISOString() : undefined
    }

    // If it's a Firebase Timestamp (has seconds and nanoseconds)
    if (date && typeof date === "object" && "seconds" in date && "nanoseconds" in date) {
      const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000
      const parsedDate = new Date(milliseconds)
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // Last attempt: convert to Date if it's a number or valid string
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
  } catch (e) {
    console.error("Error converting date to ISO string:", e)
    return undefined
  }
}

// Function to extract tag names from different tag formats
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

export function ComprehensiveSchema({
  post,
  category,
  url,
  comments = [],
  reactions = [],
  breadcrumbs = [],
}: ComprehensiveSchemaProps) {
  const [schemas, setSchemas] = useState<any[]>([])

  useEffect(() => {
    const schemaArray = []

    // Format dates for schema
    const publishDate = safeISOString(post.publishDate) || new Date().toISOString()
    const modifiedDate = safeISOString(post.updatedAt) || safeISOString(post.updatedDate) || publishDate

    // 1. Article/BlogPosting Schema
    const schemaType = post.schemaType || "BlogPosting"
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "@id": `${url}#${schemaType.toLowerCase()}`,
      headline: post.title,
      name: post.title,
      description: post.seoDescription || post.shortDescription || post.excerpt || "",
      image: [post.mainImageUrl || post.featuredImageUrl].filter(Boolean),
      datePublished: publishDate,
      dateModified: modifiedDate,
      author: {
        "@type": "Person",
        name: post.authorName || (typeof post.author === "string" ? post.author : "RaveHub"),
        ...(post.authorImageUrl && { image: post.authorImageUrl }),
        ...(post.authorEmail && { email: post.authorEmail }),
      },
      publisher: {
        "@type": "Organization",
        name: "RaveHub",
        logo: {
          "@type": "ImageObject",
          url: "https://www.ravehublatam.com/images/logo-full.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
      articleSection: post.categoryName || category?.name || "Blog",
      keywords: (post.seoKeywords || extractTagNames(post.tags || []) || []).join(", "),
      inLanguage: "es",
      isAccessibleForFree: post.isAccessibleForFree !== false,
    }

    // Add ratings if available
    if (post.averageRating && post.ratingCount) {
      articleSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: Number(post.averageRating.toFixed(1)),
        reviewCount: post.ratingCount,
        bestRating: 5,
        worstRating: 1,
        ratingCount: post.ratingCount,
      }
    }

    // Add location if available
    if (post.location) {
      articleSchema.locationCreated = {
        "@type": "Place",
        name: post.location.venueName,
        address: {
          "@type": "PostalAddress",
          addressLocality: post.location.city,
          addressRegion: post.location.region,
          addressCountry: {
            "@type": "Country",
            name: post.location.country,
          },
          postalCode: post.location.postalCode,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: post.location.latitude,
          longitude: post.location.longitude,
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
        articleSchema.interactionStatistic = [
          ...(articleSchema.interactionStatistic || []),
          {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/ShareAction",
            userInteractionCount: totalShares,
          },
        ]
      }
    }

    // Add FAQ if available
    if (post.faq && post.faq.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faqpage`,
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
      schemaArray.push(faqSchema)
    }

    // 2. BreadcrumbList Schema
    const defaultBreadcrumbs = [
      { name: "Inicio", item: "https://www.ravehublatam.com/" },
      { name: "Blog", item: "https://www.ravehublatam.com/blog" },
      { name: post.title, item: url },
    ]

    const breadcrumbsToUse = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumblist`,
      itemListElement: breadcrumbsToUse.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
      })),
    }

    // 3. WebPage Schema
    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": url,
      url: url,
      name: post.title,
      description: post.seoDescription || post.shortDescription || post.excerpt || "",
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://www.ravehublatam.com/#website",
        name: "RaveHub",
        description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
        url: "https://www.ravehublatam.com/",
      },
      inLanguage: "es",
      potentialAction: [
        {
          "@type": "ReadAction",
          target: [url],
        },
      ],
    }

    // 4. Organization Schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.ravehublatam.com/#organization",
      name: "RaveHub",
      url: "https://www.ravehublatam.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://www.ravehublatam.com/images/logo-full.png",
        width: 600,
        height: 60,
      },
      sameAs: [
        "https://www.facebook.com/ravehublatam",
        "https://www.instagram.com/ravehublatam",
        "https://twitter.com/ravehublatam",
      ],
    }

    // 5. WebSite Schema
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://www.ravehublatam.com/#website",
      url: "https://www.ravehublatam.com/",
      name: "RaveHub",
      description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
      publisher: {
        "@id": "https://www.ravehublatam.com/#organization",
      },
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://www.ravehublatam.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      ],
      inLanguage: "es",
    }

    // 6. Event Schema (if the post is related to an event)
    if (post.relatedEventId) {
      const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "@id": `${url}#event`,
        name: post.title.includes("DLDK") ? post.title : `Evento: ${post.title}`,
        description: post.excerpt || post.shortDescription || post.seoDescription || "",
        image: [post.mainImageUrl || post.featuredImageUrl].filter(Boolean),
        startDate: publishDate,
        endDate: modifiedDate,
        ...(post.location && {
          location: {
            "@type": "Place",
            name: post.location.venueName,
            address: {
              "@type": "PostalAddress",
              addressLocality: post.location.city,
              addressRegion: post.location.region,
              addressCountry: post.location.country,
              postalCode: post.location.postalCode,
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: post.location.latitude,
              longitude: post.location.longitude,
            },
          },
        }),
        organizer: {
          "@type": "Organization",
          name: "RaveHub",
          url: "https://www.ravehublatam.com/",
        },
        offers: {
          "@type": "AggregateOffer",
          url: url,
          availability: "https://schema.org/InStock",
          priceCurrency: "USD",
          validFrom: publishDate,
        },
        performer: {
          "@type": "PerformingGroup",
          name: "DJs y Artistas",
        },
      }
      schemaArray.push(eventSchema)
    }

    // Add all schemas to the array
    schemaArray.push(articleSchema, breadcrumbSchema, webPageSchema, organizationSchema, websiteSchema)

    // Update state with all schemas
    setSchemas(schemaArray)
  }, [post, category, url, comments, reactions, breadcrumbs])

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={`schema-${index}`}
          id={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  )
}
