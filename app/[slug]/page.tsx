import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getEventDJBySlug } from "@/lib/firebase/event-djs"
import { getEventsByArtist } from "@/lib/firebase/events"
import ArtistProfile from "@/components/artist-profile"
import { ArtistProfileSchema } from "@/components/artist-profile-schema"

interface ArtistPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params

  const artist = await getEventDJBySlug(slug)

  if (!artist) {
    return {
      title: "Artista no encontrado | Ravehub Latam",
      description: "El artista que buscas no existe o no está disponible.",
    }
  }

  return {
    title: `${artist.name} | Ravehub Latam`,
    description: artist.bio || artist.description || `Conoce más sobre ${artist.name}, DJ y artista electrónico.`,
    openGraph: {
      title: `${artist.name} | Ravehub Latam`,
      description: artist.bio || artist.description || `Conoce más sobre ${artist.name}, DJ y artista electrónico.`,
      images: artist.imageUrl ? [{ url: artist.imageUrl, alt: artist.name }] : [],
    },
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { slug } = await params

  const artist = await getEventDJBySlug(slug)

  if (!artist) {
    notFound()
  }

  // Get events featuring this artist for the schema
  const events = await getEventsByArtist(artist.name, 10)

  return (
    <>
      <ArtistProfileSchema artist={artist} events={events} />
      <ArtistProfile artist={artist} />
    </>
  )
}