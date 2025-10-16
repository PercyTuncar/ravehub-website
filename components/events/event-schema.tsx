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

  // Función para combinar fecha y hora con zona horaria correcta
  const combineDateTime = (date: Date | string, time: string, country?: string): string => {
    const d = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)

    // Mapa de zonas horarias por país (desfase desde UTC en horas)
    const timezones: Record<string, number> = {
      "Argentina": -3,
      "Bolivia": -4,
      "Brasil": -3, // São Paulo
      "Chile": -4, // Santiago
      "Colombia": -5,
      "Costa Rica": -6,
      "Cuba": -5,
      "Ecuador": -5,
      "El Salvador": -6,
      "Guatemala": -6,
      "Honduras": -6,
      "México": -6, // Ciudad de México
      "Nicaragua": -6,
      "Panamá": -5,
      "Paraguay": -4,
      "Perú": -5,
      "Puerto Rico": -4,
      "República Dominicana": -4,
      "Uruguay": -3,
      "Venezuela": -4
    }

    const offsetHours = timezones[country || ""] || -5 // Default Lima

    // Establecer la hora UTC directamente (los inputs dan la hora deseada en zona local del evento)
    d.setUTCHours(hours, minutes || 0, 0, 0)

    // Formatear el offset como string
    const offsetString = `${offsetHours >= 0 ? '+' : ''}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`

    // Obtener ISO string sin milisegundos y reemplazar Z con el offset
    const isoString = d.toISOString()
    const dateTimeWithoutMs = isoString.replace(/\.\d{3}Z$/, 'Z')

    return dateTimeWithoutMs.replace('Z', offsetString)
  }

  // Formatear fechas para el esquema con zona horaria correcta
  const startDateISO = event.startDate ? combineDateTime(event.startDate, event.startTime || '00:00', event.country) : undefined
  let endDateISO = event.endDate ? combineDateTime(event.endDate, event.endTime || '23:59', event.country) : undefined

  // Asegurar que endDate sea posterior a startDate
  if (startDateISO && endDateISO) {
    const start = new Date(startDateISO)
    const end = new Date(endDateISO)
    if (end <= start) {
      // Si endDate es anterior o igual a startDate, ajustar endDate
      // Asumir que el evento dura al menos 6 horas por defecto
      end.setHours(start.getHours() + 6)
      endDateISO = end.toISOString()
    }
  }

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
        "@type": event.eventType === "festival" ? "Festival" :
                event.eventType === "concert" ? "MusicEvent" :
                event.eventType === "dj_set" ? "MusicEvent" : "MusicEvent",
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
                streetAddress: (event.location.streetAddress || event.location.address || "").replace(/^(Exacta \(para SEO\):?\s*)/i, "").trim(),
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
                "@type": artist.name.toLowerCase().includes('duo') ||
                        artist.name.toLowerCase().includes('&') ||
                        artist.name.toLowerCase().includes('y ') ? "MusicGroup" : "Person",
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
                  ...(artist.spotifyUrl ? [
                    // Convertir URLs de Spotify a formato público si es necesario
                    artist.spotifyUrl.startsWith('https://open.spotify.com')
                      ? artist.spotifyUrl
                      : artist.spotifyUrl.includes('spotify.com/artist/')
                        ? `https://open.spotify.com/artist/${artist.spotifyUrl.split('/artist/')[1]?.split('?')[0]}`
                        : undefined
                  ].filter(Boolean) : []),
                  ...(artist.soundcloudUrl ? [artist.soundcloudUrl] : []),
                ].filter(Boolean),
              }))
            : undefined,
        offers:
          Array.isArray(event.salesPhases) && event.salesPhases.length > 0
            ? event.salesPhases.flatMap((phase) =>
                phase.zonesPricing && phase.zonesPricing.length > 0
                  ? phase.zonesPricing.map((pricing) => ({
                      "@type": "Offer",
                      name: `${phase.name} - ${event.zones?.find(z => z.id === pricing.zoneId)?.name || 'Zona'}`,
                      availability: "https://schema.org/LimitedAvailability",
                      url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
                      price: pricing.price,
                      priceCurrency: event.currency || "USD",
                      validFrom: phase.startDate ? combineDateTime(phase.startDate, '00:00', event.country) : startDateISO,
                      validThrough: phase.endDate ? combineDateTime(phase.endDate, '23:59', event.country) : endDateISO,
                      inventoryLevel: pricing.available,
                    }))
                  : []
              )
            : price
              ? [
                  {
                    "@type": "Offer",
                    availability: "https://schema.org/LimitedAvailability",
                    url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
                    price: price,
                    priceCurrency: event.currency || "USD",
                    validFrom: startDateISO,
                    validThrough: endDateISO || startDateISO,
                  },
                ]
              : undefined,
        ...(event.subEvents &&
          event.subEvents.length > 0 && {
            subEvent: event.subEvents.map((subEvent) => ({
              "@type": "Event",
              name: subEvent.name,
              description: subEvent.description,
              startDate: subEvent.startDate ? combineDateTime(subEvent.startDate, '00:00', event.country) : undefined,
              endDate: subEvent.endDate ? combineDateTime(subEvent.endDate, '23:59', event.country) : undefined,
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
      },
      {
        "@type": "BreadcrumbList",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#breadcrumb`),
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: ensureHttpsProtocol(baseUrl),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Eventos",
            item: ensureHttpsProtocol(`${baseUrl}/eventos`),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: event.name,
          },
        ],
      },
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
