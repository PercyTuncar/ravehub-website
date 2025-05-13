"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import Script from "next/script"
import type { BlogPost, BlogCategory, BlogComment } from "@/types/blog"

interface PostReaction {
  reactionType: string
  userId: string
  userName?: string
  userImageUrl?: string
  createdAt: string | Date
  postId: string
}

interface EnhancedPostSchemaProps {
  post: BlogPost
  category?: BlogCategory | null
  url: string
}

// Helper function to safely format dates for ISO string
function safeISOString(date: any): string | undefined {
  if (!date) return undefined

  try {
    // If it's a string, try to convert to Date
    if (typeof date === "string") {
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined
    }

    // If it's a Date object
    if (date instanceof Date) {
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

// Function to extract tag names from various tag formats
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

export function EnhancedPostSchema({ post, category, url }: EnhancedPostSchemaProps) {
  const [comments, setComments] = useState<BlogComment[]>([])
  const [reactions, setReactions] = useState<PostReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPostInteractions() {
      try {
        // Fetch comments
        const commentsQuery = query(
          collection(db, "blogComments"),
          where("postId", "==", post.id),
          where("isApproved", "==", true),
        )
        const commentsSnapshot = await getDocs(commentsQuery)
        const commentsData = commentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BlogComment[]

        // Fetch reactions
        const reactionsQuery = query(collection(db, "blogReactions"), where("postId", "==", post.id))
        const reactionsSnapshot = await getDocs(reactionsQuery)
        const reactionsData = reactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PostReaction[]

        // Fetch ratings if not already included in post data
        if (!post.averageRating || !post.ratingCount) {
          const ratingsQuery = query(collection(db, "blogRatings"), where("postId", "==", post.id))
          const ratingsSnapshot = await getDocs(ratingsQuery)

          if (ratingsSnapshot.size > 0) {
            let totalRating = 0
            ratingsSnapshot.docs.forEach((doc) => {
              const rating = doc.data().rating || 0
              totalRating += Number(rating)
            })

            const averageRating = totalRating / ratingsSnapshot.size
            post.averageRating = averageRating
            post.ratingCount = ratingsSnapshot.size
          }
        } else {
          // Make sure existing values are numbers
          post.averageRating = Number(post.averageRating)
          post.ratingCount = Number(post.ratingCount)
        }

        setComments(commentsData)
        setReactions(reactionsData)
      } catch (error) {
        console.error("Error fetching post interactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (post.id) {
      fetchPostInteractions()
    }
  }, [post])

  // Don't render anything while loading to avoid flashing
  if (isLoading) return null

  // Format dates for schema
  const publishDate = safeISOString(post.publishDate) || new Date().toISOString()
  const modifiedDate = safeISOString(post.updatedAt) || safeISOString(post.updatedDate) || publishDate

  // Extract tag names
  const tagNames = extractTagNames(post.tags || [])

  // Create WebPage schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url: url,
    name: post.seoTitle || post.title,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/#website`,
      name: "RaveHub",
      description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
      url: process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com",
    },
    inLanguage: "es",
    potentialAction: [
      {
        "@type": "ReadAction",
        target: [url],
      },
    ],
  }

  // Create Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/#organization`,
    name: "RaveHub",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com",
    logo: {
      "@type": "ImageObject",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/images/logo-full.png`,
      width: 600,
      height: 60,
    },
    sameAs: [
      "https://www.facebook.com/ravehublatam",
      "https://www.instagram.com/ravehublatam",
      "https://twitter.com/ravehublatam",
    ],
  }

  // Create BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category?.name || "Artículo",
        item: category?.slug
          ? `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/blog/categorias/${category.slug}`
          : `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/blog`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: url,
      },
    ],
  }

  // Create Person schema for author
  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#author`,
    name: post.authorName || post.author || "RaveHub",
    ...(post.authorImageUrl && { image: post.authorImageUrl }),
    ...(post.authorEmail && { email: post.authorEmail }),
    url:
      post.authorUrl ||
      `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/autores/${post.authorSlug || "equipo"}`,
  }

  // Create ImageObject schema for featured image
  const imageSchema =
    post.mainImageUrl || post.featuredImageUrl
      ? {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "@id": `${url}#primaryimage`,
          url: post.mainImageUrl || post.featuredImageUrl,
          width: 1200,
          height: 630,
          caption: post.imageAlt || post.title,
        }
      : null

  // Create Article/BlogPosting schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": post.schemaType || "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    name: post.title,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    image: post.mainImageUrl || post.featuredImageUrl ? [post.mainImageUrl || post.featuredImageUrl] : [],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      "@id": `${url}#author`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
    },
    isPartOf: {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
    },
    articleSection: post.categoryName || category?.name || "Blog",
    keywords: tagNames.join(", "),
    inLanguage: "es",
    wordCount: post.content ? post.content.split(/\s+/).length : 0,
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
    const reactionCounts = reactions.reduce((stats: Record<string, number>, reaction) => {
      const type = reaction.reactionType
      stats[type] = (stats[type] || 0) + 1
      return stats
    }, {})

    articleSchema.interactionStatistic = Object.entries(reactionCounts).map(([type, count]) => ({
      "@type": "InteractionCounter",
      interactionType: `https://schema.org/${type}Action`,
      userInteractionCount: count,
    }))
  }

  // Add social shares if available
  if (post.socialShares) {
    const totalShares = Object.values(post.socialShares).reduce((sum: number, count: any) => sum + (count || 0), 0)
    if (totalShares > 0) {
      if (!articleSchema.interactionStatistic) {
        articleSchema.interactionStatistic = []
      }

      if (Array.isArray(articleSchema.interactionStatistic)) {
        articleSchema.interactionStatistic.push({
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ShareAction",
          userInteractionCount: totalShares,
        })
      }
    }
  }

  // Combine all schemas into a single array
  const schemas = [webPageSchema, organizationSchema, breadcrumbSchema, authorSchema, articleSchema]

  // Add image schema if it exists
  if (imageSchema) {
    schemas.push(imageSchema)
  }

  // Add FAQPage schema if the post has FAQ content
  if (post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faqs.map((faq) => ({
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

  // Add Event schema if the post is about an event
  if (post.isEvent && post.eventDetails) {
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": `${url}#event`,
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
      },
      image: post.mainImageUrl || post.featuredImageUrl || "",
      performer: {
        "@type": "PerformingGroup",
        name: post.eventDetails.performer || "Varios artistas",
      },
      organizer: {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"}/#organization`,
      },
      offers: post.eventDetails.ticketUrl
        ? {
            "@type": "Offer",
            url: post.eventDetails.ticketUrl,
            price: post.eventDetails.price || "0",
            priceCurrency: post.eventDetails.currency || "USD",
            availability: "https://schema.org/InStock",
            validFrom: publishDate,
          }
        : undefined,
    }
    schemas.push(eventSchema)
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={`schema-${index}`}
          id={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  )
}
