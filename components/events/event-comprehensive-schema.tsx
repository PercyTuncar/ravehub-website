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

interface EventSchemaProps {
  event: any // Use your Event type here
  url: string
  breadcrumbs?: Array<{ name: string; item: string }>
}

export function EventComprehensiveSchema({ event, url, breadcrumbs = [] }: EventSchemaProps) {
  const [schemas, setSchemas] = useState<any[]>([])

  useEffect(() => {
    const schemaArray = []

    // Format dates for schema
    const startDate = safeISOString(event.startDate) || new Date().toISOString()
    const endDate = safeISOString(event.endDate) || startDate

    // 1. Event Schema
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": `${url}#event`,
      name: event.title,
      description: event.description || event.shortDescription || "",
      image: [event.imageUrl || event.featuredImage].filter(Boolean),
      startDate,
      endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      ...(event.location && {
        location: {
          "@type": "Place",
          name: event.location.venueName,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.location.address,
            addressLocality: event.location.city,
            addressRegion: event.location.region,
            addressCountry: event.location.country,
            postalCode: event.location.postalCode,
          },
          ...(event.location.latitude &&
            event.location.longitude && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: event.location.latitude,
                longitude: event.location.longitude,
              },
            }),
        },
      }),
      organizer: {
        "@type": "Organization",
        name: "RaveHub",
        url: "https://www.ravehublatam.com/",
      },
      ...(event.tickets && {
        offers: {
          "@type": "AggregateOffer",
          url: url,
          priceCurrency: event.tickets.currency || "USD",
          lowPrice: event.tickets.minPrice || 0,
          highPrice: event.tickets.maxPrice || 0,
          availability: "https://schema.org/InStock",
          validFrom: startDate,
        },
      }),
      ...(event.performers && {
        performer: event.performers.map((performer: any) => ({
          "@type": "PerformingGroup",
          name: performer.name,
        })),
      }),
    }

    // 2. BreadcrumbList Schema
    const defaultBreadcrumbs = [
      { name: "Inicio", item: "https://www.ravehublatam.com/" },
      { name: "Eventos", item: "https://www.ravehublatam.com/eventos" },
      { name: event.title, item: url },
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
      name: event.title,
      description: event.description || event.shortDescription || "",
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
    schemaArray.push(eventSchema, breadcrumbSchema, webPageSchema)

    // Update state with all schemas
    setSchemas(schemaArray)
  }, [event, url, breadcrumbs])

  return (
    <>
      {schemas.map((schema, index) => (
        <Script
          key={`event-schema-${index}`}
          id={`event-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
          strategy="afterInteractive"
        />
      ))}
    </>
  )
}
