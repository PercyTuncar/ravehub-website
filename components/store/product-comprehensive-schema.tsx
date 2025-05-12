"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

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

interface ProductSchemaProps {
  product: any // Use your Product type here
  url: string
  breadcrumbs?: Array<{ name: string; item: string }>
  reviews?: any[] // Use your Review type here
}

export function ProductComprehensiveSchema({ product, url, breadcrumbs = [], reviews = [] }: ProductSchemaProps) {
  const [schemas, setSchemas] = useState<any[]>([])

  useEffect(() => {
    const schemaArray = []

    // 1. Product Schema
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: product.name,
      description: product.description || product.shortDescription || "",
      image: product.images?.map((img: string) => img) || [product.featuredImage].filter(Boolean),
      sku: product.sku || product.id,
      mpn: product.mpn || product.id,
      brand: {
        "@type": "Brand",
        name: product.brand || "RaveHub",
      },
      ...(product.price && {
        offers: {
          "@type": "Offer",
          url: url,
          priceCurrency: product.currency || "USD",
          price: product.price,
          priceValidUntil: safeISOString(new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
          availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "RaveHub",
          },
        },
      }),
    }

    // Add reviews if available
    if (reviews && reviews.length > 0) {
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

      if (averageRating > 0) {
        productSchema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number(averageRating.toFixed(1)),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        }

        productSchema.review = reviews.map((review) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: 5,
            worstRating: 1,
          },
          author: {
            "@type": "Person",
            name: review.userName || "Usuario",
          },
          datePublished: safeISOString(review.createdAt) || new Date().toISOString(),
          reviewBody: review.comment || "",
        }))
      }
    }

    // 2. BreadcrumbList Schema
    const defaultBreadcrumbs = [
      { name: "Inicio", item: "https://www.ravehublatam.com/" },
      { name: "Tienda", item: "https://www.ravehublatam.com/tienda" },
      ...(product.category
        ? [
            {
              name: product.category.name,
              item: `https://www.ravehublatam.com/tienda/categorias/${product.category.slug}`,
            },
          ]
        : []),
      { name: product.name, item: url },
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
      name: product.name,
      description: product.description || product.shortDescription || "",
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

    // Add all schemas to the array
    schemaArray.push(productSchema, breadcrumbSchema, webPageSchema)

    // Update state with all schemas
    setSchemas(schemaArray)
  }, [product, url, breadcrumbs, reviews])

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={`product-schema-${index}`}
          id={`product-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  )
}
