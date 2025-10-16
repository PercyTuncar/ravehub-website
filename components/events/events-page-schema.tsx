import Script from "next/script"
import { getAllEvents } from "@/lib/firebase/events"
import type { Event } from "@/types"

export async function EventsPageSchema() {
  let events: Event[] = []

  try {
    // Fetch all published events, limit to 50 for performance
    const allEvents = await getAllEvents()
    events = allEvents.slice(0, 50)
  } catch (error) {
    console.error("Error fetching events for schema:", error)
    return null
  }

  if (events.length === 0) {
    return null
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ravehublatam.com"

  const ensureHttpsProtocol = (url: string) => {
    if (!url) return undefined
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  // Create ItemList with Event items
  const itemListElements = events.map((event, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "MusicEvent",
      "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#event`),
      name: event.name,
      description: event.descriptionText || event.shortDescription,
      url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
      image: event.mainImageUrl,
      startDate: event.startDate ? new Date(event.startDate).toISOString() : undefined,
      endDate: event.endDate ? new Date(event.endDate).toISOString() : undefined,
      eventStatus: event.eventStatus || "https://schema.org/EventScheduled",
      eventAttendanceMode: event.eventAttendanceMode || "https://schema.org/OfflineEventAttendanceMode",
      organizer: {
        "@type": "Organization",
        name: event.organizer?.name || "Ravehub",
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
              "@type": "MusicGroup",
              name: artist.name,
              image: artist.imageUrl,
              ...(artist.description && { description: artist.description }),
              ...(artist.instagramHandle && {
                sameAs: `https://instagram.com/${artist.instagramHandle.replace("@", "")}`,
              }),
              ...(artist.spotifyUrl && { sameAs: artist.spotifyUrl }),
              ...(artist.soundcloudUrl && { sameAs: artist.soundcloudUrl }),
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
              validFrom: phase.startDate ? new Date(phase.startDate).toISOString() : undefined,
              validThrough: phase.endDate ? new Date(phase.endDate).toISOString() : undefined,
            }))
          : undefined,
      ...(event.mainImageUrl && {
        image: {
          "@type": "ImageObject",
          url: event.mainImageUrl,
          width: 1200,
          height: 630,
        },
      }),
    },
  }))

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos#webpage`),
        url: ensureHttpsProtocol(`${baseUrl}/eventos/`),
        name: "Eventos | Ravehub - Música Electrónica en Latinoamérica",
        description: "Explora los mejores eventos de música electrónica en Latinoamérica. Filtra por país, fecha y precio. Compra entradas con opciones de pago en cuotas.",
        inLanguage: "es",
        isPartOf: {
          "@type": "WebSite",
          "@id": ensureHttpsProtocol(`${baseUrl}/#website`),
          url: ensureHttpsProtocol(baseUrl),
          name: "Ravehub",
          publisher: {
            "@type": "Organization",
            "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
            name: "Ravehub",
            url: ensureHttpsProtocol(baseUrl),
            logo: {
              "@type": "ImageObject",
              "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
              url: ensureHttpsProtocol(`${baseUrl}/images/logo-full.png`),
              width: 261,
              height: 60,
              caption: "Ravehub",
            },
          },
        },
        mainEntity: {
          "@type": "ItemList",
          name: "Eventos de Música Electrónica",
          description: "Lista completa de eventos de música electrónica disponibles en Latinoamérica",
          numberOfItems: events.length,
          itemListElement: itemListElements,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: ensureHttpsProtocol(`${baseUrl}/eventos?q={search_term_string}`),
          },
          "query-input": {
            "@type": "PropertyValueSpecification",
            valueRequired: true,
            valueName: "search_term_string",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos#breadcrumb`),
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
          },
        ],
      },
      // Organization schema
      {
        "@type": "Organization",
        "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
        name: "Ravehub",
        url: ensureHttpsProtocol(baseUrl),
        description: "Plataforma líder en eventos de música electrónica en Latinoamérica",
        logo: {
          "@type": "ImageObject",
          "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
          url: ensureHttpsProtocol(`${baseUrl}/images/logo-full.png`),
          width: 261,
          height: 60,
        },
        address: {
          "@type": "PostalAddress",
          addressCountry: "PE",
          addressLocality: "Lima",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+51-944-784-488",
          contactType: "customer service",
          availableLanguage: "Spanish",
        },
        sameAs: [
          "https://www.facebook.com/ravehub",
          "https://www.instagram.com/ravehub.pe",
          "https://www.tiktok.com/@ravehub.pe",
          "https://www.youtube.com/channel/UC-wATPEqoNpPPcFHfTFae8w",
        ],
      },
    ],
  }

  return (
    <Script
      id="events-page-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
    />
  )
}