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

  // Crear el objeto JSON-LD simplificado
  const schemaData = {
    "@context": "https://schema.org",
    "@type": event.eventType === "festival" ? "Festival" :
            event.eventType === "concert" ? "MusicEvent" :
            event.eventType === "dj_set" ? "MusicEvent" : "Event",
    name: event.name,
    description: event.descriptionText || event.shortDescription,
    startDate: startDateISO,
    endDate: endDateISO || startDateISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: event.location ? {
      "@type": "Place",
      name: event.location.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.location.streetAddress || event.location.address || "",
        addressLocality: event.location.city,
        addressRegion: event.location.region || event.location.city,
        postalCode: event.location.postalCode,
        addressCountry: event.location.country,
      },
      geo: event.location.latitude && event.location.longitude ? {
        "@type": "GeoCoordinates",
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      } : undefined,
    } : undefined,
    image: event.mainImageUrl ? [event.mainImageUrl] : undefined,
    organizer: {
      "@type": "Organization",
      name: "Ravehub",
      url: "https://www.ravehublatam.com/"
    },
    performer: Array.isArray(event.artistLineup) && event.artistLineup.length > 0
      ? event.artistLineup.map((artist) => ({
          "@type": "Person",
          name: artist.name,
        }))
      : undefined,
    offers: price ? [{
      "@type": "Offer",
      price: price.toString(),
      priceCurrency: event.currency || "PEN",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/eventos/${event.slug}`
    }] : undefined,
    url: `${baseUrl}/eventos/${event.slug}`
  }

  return (
    <Script
      id="event-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData).replace(/</g, "\\u003c") }}
    />
  )
}
