"use client"

import Script from "next/script"
import type { Event } from "@/types"

interface HomeSchemaProps {
  featuredEvents: Event[]
}

export function HomeSchema({ featuredEvents }: HomeSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"

  const ensureHttpsProtocol = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  // Main navigation items for sitelinks
  const mainNavItems = [
    {
      name: "Eventos",
      url: "/eventos",
      description: "Encuentra los mejores eventos de música electrónica en Latinoamérica",
    },
    {
      name: "Tienda",
      url: "/tienda",
      description: "Compra merchandise oficial y productos exclusivos de música electrónica",
    },
    {
      name: "Blog",
      url: "/blog",
      description: "Noticias, artículos y contenido sobre la escena electrónica en Latinoamérica",
    },
    {
      name: "Galería",
      url: "/galeria",
      description: "Fotos de los mejores eventos y festivales de música electrónica",
    },
    {
      name: "DJ Ranking",
      url: "/dj-ranking",
      description: "Descubre, sugiere y vota por los mejores DJs de cada país",
    },
    {
      name: "Contacto",
      url: "/contacto",
      description: "Ponte en contacto con nosotros para cualquier consulta o colaboración",
    },
  ]

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      // WebSite schema - fixed to remove siteNavigationElement property
      {
        "@type": "WebSite",
        "@id": ensureHttpsProtocol(`${baseUrl}/#website`),
        url: ensureHttpsProtocol(baseUrl),
        name: "RaveHub",
        description:
          "Compra tus entradas para los mejores eventos de música electrónica en Latinoamérica, con opciones de pago en cuotas para que disfrutes sin preocupaciones. Vive la experiencia única de los festivales más esperados.",
        publisher: {
          "@type": "Organization",
          "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
          name: "RaveHub",
          url: ensureHttpsProtocol(baseUrl),
          logo: {
            "@type": "ImageObject",
            "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
            url: ensureHttpsProtocol(`${baseUrl}/images/logo-full.png`),
            width: 261,
            height: 60,
            caption: "RaveHub",
          },
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
      // Organization schema with more detailed information
      {
        "@type": "Organization",
        "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
        name: "RaveHub",
        url: ensureHttpsProtocol(baseUrl),
        description:
          "La plataforma líder en eventos de música electrónica en Latinoamérica. Conectamos a los amantes de la música electrónica con los mejores eventos, artistas y experiencias.",
        logo: {
          "@type": "ImageObject",
          "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
          url: ensureHttpsProtocol(`${baseUrl}/images/logo-full.png`),
          width: 261,
          height: 60,
        },
        sameAs: [
          "https://www.facebook.com/ravehub",
          "https://www.instagram.com/ravehub.pe",
          "https://www.tiktok.com/@ravehub.pe",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+51944784488",
            contactType: "customer service",
            areaServed: "PE",
            availableLanguage: ["Spanish"],
          },
          {
            "@type": "ContactPoint",
            telephone: "+56944324385",
            contactType: "customer service",
            areaServed: "CL",
            availableLanguage: ["Spanish"],
          },
        ],
      },
      // SiteNavigationElement as a separate entity in the graph
      {
        "@type": "ItemList",
        "@id": ensureHttpsProtocol(`${baseUrl}/#navigation`),
        itemListElement: mainNavItems.map((item, index) => ({
          "@type": "SiteNavigationElement",
          position: index + 1,
          name: item.name,
          description: item.description,
          url: ensureHttpsProtocol(`${baseUrl}${item.url}`),
        })),
      },
      // BreadcrumbList for homepage
      {
        "@type": "BreadcrumbList",
        "@id": ensureHttpsProtocol(`${baseUrl}/#breadcrumb`),
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: ensureHttpsProtocol(baseUrl),
          },
        ],
      },
      ...featuredEvents.map((event) => {
        const startDateISO = event.startDate ? new Date(event.startDate).toISOString() : undefined
        const endDateISO = event.endDate ? new Date(event.endDate).toISOString() : undefined

        const getPrice = () => {
          try {
            return event.salesPhases &&
              event.salesPhases.length > 0 &&
              event.salesPhases[0].zonesPricing &&
              event.salesPhases[0].zonesPricing.length > 0
              ? event.salesPhases[0].zonesPricing[0].price
              : undefined
          } catch (error) {
            console.error("Error al obtener el precio del evento:", error)
            return undefined
          }
        }
        const price = getPrice()

        return {
          "@type": "MusicEvent",
          "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#event`),
          name: event.name,
          description: event.shortDescription || event.description,
          url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
          image: event.mainImageUrl,
          startDate: startDateISO,
          endDate: endDateISO,
          eventStatus: event.eventStatus || "http://schema.org/EventScheduled",
          eventAttendanceMode: event.eventAttendanceMode || "http://schema.org/OfflineEventAttendanceMode",
          organizer: event.organizer
            ? {
                "@type": "Organization",
                name: event.organizer.name,
                url: event.organizer.url,
              }
            : {
                "@type": "Organization",
                name: "RaveHub",
                url: ensureHttpsProtocol(baseUrl),
              },
          location: {
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
          },
          performer: event.artistLineup.map((artist) => ({
            "@type": "MusicGroup",
            name: artist.name,
            ...(artist.instagramHandle && { sameAs: `https://instagram.com/${artist.instagramHandle}` }),
            ...(artist.soundcloudUrl && { sameAs: artist.soundcloudUrl }),
            ...(artist.spotifyUrl && { sameAs: artist.spotifyUrl }),
          })),
          offers: event.salesPhases.map((phase) => ({
            "@type": "Offer",
            name: phase.name,
            availability: "http://schema.org/LimitedAvailability",
            url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
            price: price,
            priceCurrency: event.currency,
            validFrom: phase.startDate ? new Date(phase.startDate).toISOString() : undefined,
            validThrough: phase.endDate ? new Date(phase.endDate).toISOString() : undefined,
          })),
        }
      }),
    ],
  }

  return (
    <Script
      id="home-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
    />
  )
}
