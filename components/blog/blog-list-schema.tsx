"use client"

import Script from "next/script"
import type { BlogPost } from "@/types/blog"

interface BlogListSchemaProps {
  posts: BlogPost[]
  url: string
  title: string
  description: string
}

export function BlogListSchema({ posts, url, title, description }: BlogListSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"

  // Create CollectionPage schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url: url,
    name: title,
    description: description,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
    },
    inLanguage: "es",
  }

  // Create ItemList schema for the blog posts
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        "@id": `${baseUrl}/blog/${post.slug}#article`,
        url: `${baseUrl}/blog/${post.slug}`,
        name: post.title,
        headline: post.title,
        description: post.shortDescription || post.excerpt || "",
        datePublished: post.publishDate ? new Date(post.publishDate).toISOString() : new Date().toISOString(),
        dateModified: post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : post.publishDate
            ? new Date(post.publishDate).toISOString()
            : new Date().toISOString(),
        author: {
          "@type": "Person",
          name: post.authorName || post.author || "RaveHub",
        },
        publisher: {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          name: "RaveHub",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/images/logo-full.png`,
          },
        },
        image: post.mainImageUrl || post.featuredImageUrl || "",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${baseUrl}/blog/${post.slug}#webpage`,
        },
      },
    })),
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
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
    ],
  }

  return (
    <>
      <Script
        id="collection-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
        strategy="afterInteractive"
      />
      <Script
        id="item-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        strategy="afterInteractive"
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        strategy="afterInteractive"
      />
    </>
  )
}
