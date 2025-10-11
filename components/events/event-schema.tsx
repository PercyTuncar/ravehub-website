"use client"

import Script from "next/script"
import type { Event } from "@/types"

interface EventSchemaProps {
  event: Event
}

export function EventSchema({ event }: EventSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"

  // Función para asegurarse de que la URL tiene el protocolo 'https://'
  const ensureHttpsProtocol = (url: string) => {
    if (!url) return undefined
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  // Función para combinar fecha y hora
  const combineDateTime = (date: Date | string, time: string): string => {
    const d = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)
    d.setHours(hours || 0, minutes || 0, 0, 0)
    return d.toISOString()
  }

  // Formatear fechas para el esquema
  const startDateISO = event.startDate ? combineDateTime(event.startDate, event.startTime || '00:00') : undefined
  const endDateISO = event.endDate ? combineDateTime(event.endDate, event.endTime || '23:59') : undefined

  // Helper function to safely get price
  const getPrice = () => {
    try {
      if (
        event.salesPhases &&
        event.salesPhases.length > 0 &&
        event.salesPhases[0].zonesPricing &&
        event.salesPhases[0].zonesPricing.length > 0
      ) {
        return event.salesPhases[0].zonesPricing[0].price
      }
      return undefined
    } catch (error) {
      console.error("Error al obtener el precio del evento:", error)
      return undefined
    }
  }
  const price = getPrice()

  // Crear el objeto JSON-LD
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#webpage`),
        url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
        inLanguage: event.inLanguage || "es",
        name: `Entradas para ${event.name} - RAVEHUB`,
        datePublished: startDateISO,
        dateModified: startDateISO,
        description: event.shortDescription,
        isPartOf: {
          "@type": "WebSite",
          "@id": ensureHttpsProtocol(`${baseUrl}/#website`),
          url: ensureHttpsProtocol(baseUrl),
          name: "RAVEHUB",
          publisher: {
            "@type": "Organization",
            "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
            name: "RAVEHUB",
            url: ensureHttpsProtocol(baseUrl),
            logo: {
              "@type": "ImageObject",
              "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
              url: ensureHttpsProtocol(`${baseUrl}/logo.png`),
              width: 261,
              height: 60,
              caption: "RAVEHUB",
            },
            image: {
              "@type": "ImageObject",
              "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
              url: ensureHttpsProtocol(`${baseUrl}/logo.png`),
              width: 261,
              height: 60,
              caption: "RAVEHUB",
            },
          },
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: ensureHttpsProtocol(`${baseUrl}/?s={search_term_string}`),
          },
          "query-input": {
            "@type": "PropertyValueSpecification",
            valueRequired: "http://schema.org/True",
            valueName: "search_term_string",
          },
        },
      },
      {
        "@type": "MusicEvent",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#event`),
        name: event.name,
        description: event.descriptionText || event.shortDescription,
        url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
        startDate: startDateISO,
        endDate: endDateISO || startDateISO, // Usar startDate como fallback si no hay endDate
        eventStatus: event.eventStatus || "https://schema.org/EventScheduled",
        eventAttendanceMode: event.eventAttendanceMode || "https://schema.org/OfflineEventAttendanceMode",
        organizer: {
          "@type": "Organization",
          name: event.organizer?.name || "RAVEHUB",
          url: ensureHttpsProtocol(event.organizer?.url || baseUrl),
        },
        location: event.location
          ? {
              "@type": "Place",
              name: event.location.venueName,
              address: {
                "@type": "PostalAddress",
                streetAddress: event.location.streetAddress || event.location.address,
                addressLocality: event.location.city,
                addressRegion: event.location.region || event.location.city,
                postalCode: event.location.postalCode,
                addressCountry: {
                  "@type": "Country",
                  name: event.location.country,
                },
              },
              geo:
                event.location.latitude && event.location.longitude
                  ? {
                      "@type": "GeoCoordinates",
                      latitude: event.location.latitude,
                      longitude: event.location.longitude,
                    }
                  : undefined,
            }
          : undefined,
        performer:
          Array.isArray(event.artistLineup) && event.artistLineup.length > 0
            ? event.artistLineup.map((artist) => ({
                "@type": "MusicGroup",
                "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#performer-${artist.id}`),
                name: artist.name,
                image: artist.imageUrl ? {
                  "@type": "ImageObject",
                  url: artist.imageUrl,
                  width: 400,
                  height: 400,
                } : undefined,
                ...(artist.description && { description: artist.description }),
                sameAs: [
                  ...(artist.instagramHandle ? [`https://instagram.com/${artist.instagramHandle.replace("@", "")}`] : []),
                  ...(artist.spotifyUrl ? [artist.spotifyUrl] : []),
                  ...(artist.soundcloudUrl ? [artist.soundcloudUrl] : []),
                ].filter(Boolean),
              }))
            : undefined,
        offers:
          Array.isArray(event.salesPhases) && event.salesPhases.length > 0
            ? event.salesPhases.map((phase) => ({
                "@type": "Offer",
                name: phase.name,
                availability: "https://schema.org/LimitedAvailability",
                url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
                price: phase.zonesPricing && phase.zonesPricing.length > 0 ? phase.zonesPricing[0].price : undefined,
                priceCurrency: event.currency || "USD",
                validFrom: phase.startDate ? new Date(phase.startDate).toISOString() : startDateISO,
                validThrough: phase.endDate ? new Date(phase.endDate).toISOString() : endDateISO,
              }))
            : price
              ? [
                  {
                    "@type": "Offer",
                    availability: "https://schema.org/LimitedAvailability",
                    url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
                    price: price,
                    priceCurrency: event.currency || "USD",
                    validFrom: startDateISO,
                    validThrough: endDateISO,
                  },
                ]
              : undefined,
        ...(event.subEvents &&
          event.subEvents.length > 0 && {
            subEvent: event.subEvents.map((subEvent) => ({
              "@type": "Event",
              name: subEvent.name,
              description: subEvent.description,
              startDate: subEvent.startDate ? new Date(subEvent.startDate).toISOString() : undefined,
              endDate: subEvent.endDate ? new Date(subEvent.endDate).toISOString() : undefined,
              location: {
                "@type": "Place",
                name: event.location?.venueName,
              },
            })),
          }),
        ...(event.mainImageUrl && {
          image: {
            "@type": "ImageObject",
            url: event.mainImageUrl,
            width: 1200,
            height: 630,
            caption: event.name,
          },
        }),
        // Add aggregateRating if reviews exist
        ...(event.reviews && event.reviews.length > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length,
            reviewCount: event.reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }),
        // Add additional properties for better SEO
        keywords: event.tags?.join(", "),
        ...(event.isHighlighted && {
          superEvent: {
            "@type": "Festival",
            name: "RAVEHUB Music Festival Series",
          },
        }),
      },
      // Remove the BreadcrumbList from here as it's already handled by the Breadcrumbs component
      ...(Array.isArray(event.faqSection) && event.faqSection.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#faq`),
              mainEntity: event.faqSection.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  }

  return (
    <Script
      id="event-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
    />
  )
}
