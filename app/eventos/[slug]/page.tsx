import { notFound } from "next/navigation"
import { getEventBySlug } from "@/lib/firebase/events"
import { Suspense } from "react"
import { EventSchema } from "@/components/events/event-schema"
import { EventCTA } from "@/components/events/event-cta"
import EventDetailSkeleton from "@/components/events/event-detail-skeleton"
import EventDetailClientWrapper from "@/components/events/event-detail-client-wrapper"

interface EventPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: EventPageProps) {
  try {
    const { slug } = await params
    const event = await getEventBySlug(slug)

    if (!event) {
      return {
        title: "Evento no encontrado | Ravehub",
        description: "El evento que buscas no existe o ha sido eliminado. Descubre otros eventos increíbles en Ravehub.",
        robots: "noindex, follow",
      }
    }

    // Formatear fecha de manera legible
    const eventDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate)
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Obtener artista principal
    const mainArtist = event.artistLineup?.[0] || "Artistas destacados"

    // Construir título optimizado
    const title = `${event.name} en ${event.location?.city || 'Latinoamérica'} - ${formattedDate} | Ravehub`

    // Construir descripción CTA
    const description = `¡No te pierdas a ${mainArtist} en ${event.name}! Compra tus entradas para este ${formattedDate} en ${event.location?.venueName || event.location?.city || 'Latinoamérica'}. Toda la info aquí.`

    return {
      title,
      description,
      keywords: [
        event.name.toLowerCase(),
        mainArtist.toLowerCase(),
        event.location?.city?.toLowerCase(),
        "entradas",
        "música electrónica",
        "rave",
        "festival"
      ].filter(Boolean),
      openGraph: {
        title,
        description,
        images: [{ url: event.mainImageUrl }],
        type: "event",
        url: `https://www.ravehublatam.com/eventos/${slug}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [event.mainImageUrl],
      },
      alternates: {
        canonical: `https://www.ravehublatam.com/eventos/${slug}`,
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Error | Ravehub",
      description: "Ocurrió un error al cargar el evento. Descubre otros eventos increíbles en Ravehub.",
    }
  }
}

export default async function EventPage({ params }: EventPageProps) {
  try {
    const { slug } = await params
    if (!slug) {
      console.error("Slug parameter is missing")
      notFound()
    }

    const event = await getEventBySlug(slug)

    if (!event) {
      console.error(`Event with slug ${slug} not found`)
      notFound()
    }

    const normalizedEvent = {
      ...event,
      startDate: event.startDate instanceof Date ? event.startDate : new Date(event.startDate),
      endDate:
        event.endDate instanceof Date
          ? event.endDate
          : event.endDate
            ? new Date(event.endDate)
            : new Date(event.startDate instanceof Date ? event.startDate : new Date(event.startDate)),
      isMultiDay: event.isMultiDay ?? false,
      endTime: event.endTime || "23:00",
      categories: event.categories || [],
      tags: event.tags || [],
      artistLineup: event.artistLineup || [],
      zones: event.zones || [],
      salesPhases: event.salesPhases || [],
      description: event.description || "",
    }

    return (
      <>
        <EventSchema event={normalizedEvent} />
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<EventDetailSkeleton />}>
            <EventDetailClientWrapper event={normalizedEvent} />
          </Suspense>
          <EventCTA eventId={event.id} />
        </div>
      </>
    )
  } catch (error) {
    console.error("Error rendering event page:", error)
    notFound()
  }
}
