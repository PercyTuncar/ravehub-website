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
  // Format dates for schema
  const publishDate = new Date(post.publishDate).toISOString()
  const modifiedDate = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : post.updatedDate
      ? new Date(post.updatedDate).toISOString()
      : publishDate

  // Determine schema type
  const schemaType = post.schemaType || "NewsArticle"

  // Create base schema data
  const schemaData: any = {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: post.title,
    name: post.title,
    description: post.seoDescription || post.shortDescription || post.excerpt || "",
    image: [post.mainImageUrl || post.featuredImageUrl].filter(Boolean),
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: post.authorName || post.author,
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
  }

  // Add location if available
  if (post.location) {
    schemaData.locationCreated = {
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

  // Add ratings if available
  if (post.averageRating && post.ratingCount) {
    schemaData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: post.averageRating.toFixed(1),
      reviewCount: post.ratingCount,
      bestRating: "5",
      worstRating: "1",
    }
  }

  // Add comments if available
  if (comments && comments.length > 0) {
    const approvedComments = comments.filter((comment) => comment.isApproved)
    if (approvedComments.length > 0) {
      schemaData.comment = approvedComments.map((comment) => ({
        "@type": "Comment",
        author: {
          "@type": "Person",
          name: comment.name,
          ...(comment.email && { email: comment.email }),
        },
        datePublished: comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString(),
        text: comment.content,
      }))
    }
  }

  // Add reactions if available
  if (reactions && reactions.length > 0) {
    schemaData.interactionStatistic = reactions.reduce((stats: any[], reaction) => {
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
      schemaData.about = tagObjects.map((tag) => ({
        "@type": "Thing",
        name: tag.name,
        ...(tag.description && { description: tag.description }),
        ...(tag.imageUrl && { image: tag.imageUrl }),
      }))
    }
  }

  // Add social shares if available
  // Add social shares if available
  if (post.socialShares) {
    const totalShares = Object.values(post.socialShares).reduce((sum: number, count: any) => sum + (count || 0), 0)
    if (totalShares > 0) {
      schemaData.interactionStatistic = {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "ShareAction",
        },
        userInteractionCount: totalShares,
      }
    }
  }

  return (
    <Script
      id="post-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
      strategy="afterInteractive"
    />
  )
}
