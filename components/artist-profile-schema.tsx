import Script from "next/script"
import { getEventsByArtist } from "@/lib/firebase/events"
import type { EventDJ, Event } from "@/types"

interface ArtistProfileSchemaProps {
  artist: EventDJ
  events: Event[]
}

export async function ArtistProfileSchema({ artist, events }: ArtistProfileSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.ravehublatam.com"

  const ensureHttpsProtocol = (url: string) => {
    if (!url) return undefined
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  // Build sameAs array for the artist
  const sameAs: string[] = []
  if (artist.socialLinks?.spotify) sameAs.push(artist.socialLinks.spotify)
  if (artist.socialLinks?.soundcloud) sameAs.push(artist.socialLinks.soundcloud)
  if (artist.socialLinks?.website) sameAs.push(artist.socialLinks.website)
  if (artist.socialLinks?.facebook) sameAs.push(artist.socialLinks.facebook)
  if (artist.socialLinks?.twitter) sameAs.push(artist.socialLinks.twitter)
  if (artist.socialLinks?.wikipedia) sameAs.push(artist.socialLinks.wikipedia)

  // Build image array for the artist
  const images: string[] = []
  if (artist.imageUrl) {
    images.push(artist.imageUrl)
    // Add variations for different aspect ratios
    images.push(artist.imageUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '_4x3.$1'))
    images.push(artist.imageUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '_16x9.$1'))
  }

  // Build jobTitle array
  const jobTitle = (artist as any).jobTitle || []

  // Build identifier array
  const identifier: any[] = []
  if ((artist as any).wikipediaUrl) {
    identifier.push({
      "@type": "PropertyValue",
      propertyID: "wikidata",
      value: (artist as any).wikipediaUrl
    })
  }

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      // Organization (Publisher/Brand)
      {
        "@type": "Organization",
        "@id": ensureHttpsProtocol(`${baseUrl}/#org`),
        "name": "Ravehub",
        "url": ensureHttpsProtocol(baseUrl),
        "logo": {
          "@type": "ImageObject",
          "url": ensureHttpsProtocol(`${baseUrl}/images/logo-full.png`),
          "width": 261,
          "height": 60,
          "caption": "Ravehub"
        },
        "sameAs": [
          "https://www.facebook.com/ravehub",
          "https://www.instagram.com/ravehub.pe",
          "https://www.tiktok.com/@ravehub.pe",
          "https://www.youtube.com/channel/UC-wATPEqoNpPPcFHfTFae8w"
        ]
      },

      // WebPage
      {
        "@type": "WebPage",
        "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#webpage`),
        "url": ensureHttpsProtocol(`${baseUrl}/${artist.slug}`),
        "name": `${artist.name} — Perfil, próximos shows y videos`,
        "isPartOf": { "@id": ensureHttpsProtocol(`${baseUrl}/#org`) },
        "primaryImageOfPage": artist.imageUrl ? {
          "@type": "ImageObject",
          "url": artist.imageUrl,
          "width": 1200,
          "height": 630
        } : undefined,
        "breadcrumb": { "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#breadcrumb`) },
        "datePublished": artist.createdAt ? new Date(artist.createdAt).toISOString() : undefined,
        "dateModified": artist.updatedAt ? new Date(artist.updatedAt).toISOString() : undefined
      },

      // BreadcrumbList
      {
        "@type": "BreadcrumbList",
        "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#breadcrumb`),
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Inicio",
            "item": ensureHttpsProtocol(baseUrl)
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Artistas",
            "item": ensureHttpsProtocol(`${baseUrl}/artistas`)
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": artist.name,
            "item": ensureHttpsProtocol(`${baseUrl}/${artist.slug}`)
          }
        ]
      },

      // ProfilePage
      {
        "@type": "ProfilePage",
        "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#profile`),
        "mainEntity": { "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#person`) },
        "dateCreated": artist.createdAt ? new Date(artist.createdAt).toISOString() : undefined,
        "dateModified": artist.updatedAt ? new Date(artist.updatedAt).toISOString() : undefined
      },

      // Person (Artist)
      {
        "@type": "Person",
        "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#person`),
        "name": artist.name,
        "alternateName": (artist as any).alternateName || undefined,
        "url": ensureHttpsProtocol(`${baseUrl}/${artist.slug}`),
        "jobTitle": jobTitle.length > 0 ? jobTitle : ["DJ"],
        "genre": artist.genres || [],
        "description": artist.bio || artist.description || `Conoce más sobre ${artist.name}, DJ y artista electrónico.`,
        "image": images.length > 0 ? images : undefined,
        "sameAs": sameAs.length > 0 ? sameAs : undefined,
        "identifier": identifier.length > 0 ? identifier : undefined,
        "birthDate": (artist as any).birthDate || undefined,
        "foundingDate": (artist as any).foundingDate || undefined,
        ...(artist.country && {
          "addressCountry": artist.country
        }),
        // Schema.org specific fields
        ...((artist as any).members && (artist as any).members.length > 0 && {
          "member": (artist as any).members.map((member: any) => ({
            "@type": "Person",
            "name": member.name,
            "role": member.role || undefined,
            "sameAs": member.sameAs || undefined
          }))
        }),
        ...((artist as any).famousTracks && (artist as any).famousTracks.length > 0 && {
          "track": (artist as any).famousTracks.map((track: any) => ({
            "@type": "MusicRecording",
            "name": track.name
          }))
        }),
        ...((artist as any).famousAlbums && (artist as any).famousAlbums.length > 0 && {
          "album": (artist as any).famousAlbums.map((album: any) => ({
            "@type": "MusicAlbum",
            "name": album.name
          }))
        })
      },

      // Events (MusicEvent)
      ...events.map((event, index) => {
        const startDateISO = event.startDate ? new Date(event.startDate).toISOString() : undefined
        const endDateISO = event.endDate ? new Date(event.endDate).toISOString() : undefined
        const isUpcoming = event.startDate && new Date(event.startDate) >= new Date()

        const getPrice = () => {
          try {
            return event.salesPhases &&
              event.salesPhases.length > 0 &&
              event.salesPhases[0].zonesPricing &&
              event.salesPhases[0].zonesPricing.length > 0
              ? event.salesPhases[0].zonesPricing[0].price
              : undefined
          } catch (error) {
            return undefined
          }
        }
        const price = getPrice()

        return {
          "@type": "MusicEvent",
          "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#event-${event.id}`),
          "name": event.name,
          "description": event.descriptionText || event.shortDescription,
          "startDate": startDateISO,
          "endDate": endDateISO,
          "eventStatus": isUpcoming ? "https://schema.org/EventScheduled" : "https://schema.org/EventCompleted",
          "eventAttendanceMode": event.eventAttendanceMode || "https://schema.org/OfflineEventAttendanceMode",
          "location": event.location ? {
            "@type": "Place",
            "name": event.location.venueName,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": event.location.streetAddress || event.location.address,
              "addressLocality": event.location.city,
              "addressRegion": event.location.region || event.location.city,
              "postalCode": event.location.postalCode,
              "addressCountry": {
                "@type": "Country",
                "name": event.location.country
              }
            },
            ...(event.location.latitude && event.location.longitude && {
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": event.location.latitude,
                "longitude": event.location.longitude
              }
            })
          } : undefined,
          "image": event.mainImageUrl ? [
            {
              "@type": "ImageObject",
              "url": event.mainImageUrl,
              "width": 1200,
              "height": 630
            }
          ] : undefined,
          "offers": event.salesPhases && event.salesPhases.length > 0 ? event.salesPhases.map((phase) => ({
            "@type": "Offer",
            "name": phase.name,
            "availability": "https://schema.org/LimitedAvailability",
            "url": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
            "price": price,
            "priceCurrency": event.currency || "USD",
            "validFrom": phase.startDate ? new Date(phase.startDate).toISOString() : undefined,
            "validThrough": phase.endDate ? new Date(phase.endDate).toISOString() : undefined
          })) : undefined,
          "performer": { "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#person`) },
          "organizer": { "@id": ensureHttpsProtocol(`${baseUrl}/#org`) }
        }
      }),

      // VideoObject (placeholder for future videos)
      // This would be populated when videos are added to the artist profile
      // {
      //   "@type": "VideoObject",
      //   "@id": ensureHttpsProtocol(`${baseUrl}/${artist.slug}#video-example`),
      //   "name": "Artist Video Title",
      //   "description": "Video description",
      //   "thumbnailUrl": ["thumbnail_url"],
      //   "uploadDate": "2024-01-01T00:00:00Z",
      //   "embedUrl": "https://youtube.com/embed/...",
      //   "publisher": { "@id": ensureHttpsProtocol(`${baseUrl}/#org`) },
      //   "inLanguage": "es"
      // }
    ].filter(Boolean) // Remove undefined entries
  }

  return (
    <Script
      id="artist-profile-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData, null, 2) }}
    />
  )
}