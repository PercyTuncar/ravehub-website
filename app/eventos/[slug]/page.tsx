import { notFound } from "next/navigation"
import { getEventBySlug } from "@/lib/firebase/events"
import { Suspense } from "react"
import { EventSchema } from "@/components/events/event-schema"
import { EventCTA } from "@/components/events/event-cta"
import EventDetailSkeleton from "@/components/events/event-detail-skeleton"
import { EventDetail } from "@/components/events/event-detail"

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

    // Obtener artista destacado (si existe)
    const featuredArtist = event.artistLineup?.find(artist => artist.isFeatured);
    const featuredName = featuredArtist?.name || "Artistas destacados";

    // Construir título optimizado
    const locationPart = event.eventType === "festival" ? "" : ` en ${event.location?.city || 'Latinoamérica'}`;
    const title = `${event.name}${locationPart} ${eventDate.getFullYear()}: Entradas y Fecha | Ravehub`

    // Lógica condicional para descripción
    let description: string;
    if (event.eventType === "dj_set") {
      const otherArtists = event.artistLineup?.filter(artist => !artist.isFeatured && artist.name !== featuredName) || [];
      if (event.artistLineup && event.artistLineup.length <= 4 && otherArtists.length > 0) {
        // DJ set con ≤4 DJs: Menciona destacado + otros
        const othersText = otherArtists.map(a => a.name).join(", ");
        description = `¡No te pierdas a ${featuredName} junto a ${othersText}! Compra tus entradas para este ${formattedDate} en ${event.location?.venueName || event.location?.city || 'Latinoamérica'}.`;
      } else {
        // DJ set con solo destacado o >4 DJs
        description = `¡No te pierdas a ${featuredName}! Compra tus entradas para este ${formattedDate} en ${event.location?.venueName || event.location?.city || 'Latinoamérica'}.`;
      }
    } else if (event.eventType === "festival") {
      if (!event.artistLineup || event.artistLineup.length === 0) {
        // Festival sin lineup
        description = `¡No te pierdas ${event.name}! Con un increíble lineup por anunciarse. Compra tus entradas para este ${formattedDate} en ${event.location?.venueName || event.location?.city || 'Latinoamérica'}.`;
      } else {
        // Festival con lineup: Menciona destacado + uno más + "y muchos más"
        const secondArtist = event.artistLineup.find(artist => !artist.isFeatured && artist.name !== featuredName)?.name;
        const lineupText = secondArtist ? `${featuredName}, ${secondArtist} y muchos más` : `${featuredName} y muchos más`;
        description = `¡Vive ${event.name} con ${lineupText}! Compra tus entradas para este ${formattedDate} en ${event.location?.venueName || event.location?.city || 'Latinoamérica'}.`;
      }
    } else {
      // Fallback genérico
      description = `¡No te pierdas ${event.name}! Compra tus entradas para este ${formattedDate} en ${event.location?.venueName || event.location?.city || 'Latinoamérica'}. Toda la info aquí.`;
    }

    return {
      title,
      description,
      keywords: [
        event.name.toLowerCase(),
        featuredName.toLowerCase(),
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
        type: "website",
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
        languages: {
          es: `https://www.ravehublatam.com/eventos/${slug}`,
        }
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
            <EventDetail event={normalizedEvent} />
          </Suspense>
          <EventCTA eventId={event.id} />
        </div>
      </>
    )
  } catch (error) {
    console.error("Error rendering event page:", error)
    notFound()
  }
export const revalidate = 10

// Función para calcular revalidate dinámico basado en fecha del evento
function getRevalidateTime(eventDate: Date): number {
  const now = new Date()
  const timeDiff = eventDate.getTime() - now.getTime()
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

  // Si el evento es en menos de 7 días, revalidar cada 5 minutos
  if (daysDiff <= 7 && daysDiff > 0) {
    return 300 // 5 minutos
  }

  // Si el evento es en menos de 30 días, revalidar cada hora
  if (daysDiff <= 30 && daysDiff > 0) {
    return 3600 // 1 hora
  }

  // Para eventos lejanos, mantener 10 minutos
  return 600 // 10 minutos
}
}
