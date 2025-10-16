import Image from "next/image"
import type { EventDJ } from "@/types"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Music, Calendar, MapPin, Globe, Instagram, Youtube, Twitter } from "lucide-react"

interface ArtistProfileProps {
  artist: EventDJ
}

// Función para convertir código de país a emoji de bandera
const getCountryFlag = (countryCode: string) => {
  // Convertir código de país a emoji de bandera
  // Los emojis de banderas son pares de letras regionales indicadoras
  // que están 127397 puntos de código después de sus letras ASCII mayúsculas
  const codePoints = [...countryCode.toUpperCase()].map((char) => char.charCodeAt(0) + 127397)
  return String.fromCodePoint(...codePoints)
}

export default function ArtistProfile({ artist }: ArtistProfileProps) {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader title={artist.name} description="Perfil de Artista" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-1">
          <div className="relative h-64 w-64 mx-auto rounded-lg overflow-hidden mb-4 shadow-lg">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl || "/placeholder.svg"}
                alt={artist.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Music className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-4">
            <h3 className="text-lg font-semibold mb-4">Información</h3>
            <div className="space-y-3">
              {artist.country && (
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="mr-2 text-xl">{getCountryFlag(artist.country)}</span>
                  {artist.country}
                </p>
              )}
              {artist.instagramHandle && (
                <p className="flex items-center">
                  <Instagram className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={`https://instagram.com/${artist.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @{artist.instagramHandle}
                  </a>
                </p>
              )}
              {artist.socialLinks?.spotify && (
                <p className="flex items-center">
                  <Music className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={artist.socialLinks.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Spotify
                  </a>
                </p>
              )}
              {artist.socialLinks?.soundcloud && (
                <p className="flex items-center">
                  <Music className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={artist.socialLinks.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    SoundCloud
                  </a>
                </p>
              )}
              {artist.socialLinks?.website && (
                <p className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={artist.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Sitio Web
                  </a>
                </p>
              )}
            </div>
          </div>

          {artist.genres && artist.genres.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-4">
              <h3 className="text-lg font-semibold mb-4">Géneros Musicales</h3>
              <div className="flex flex-wrap gap-2">
                {artist.genres.map((genre, index) => (
                  <Badge key={index} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Sobre {artist.name}</h2>
            {artist.bio && (
              <p className="text-gray-600 dark:text-gray-300 mb-6">{artist.bio}</p>
            )}
            {artist.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-6">{artist.description}</p>
            )}

            {/* Schema.org specific fields */}
            {(artist as any).performerType && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Información Detallada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Artista</p>
                    <p className="font-medium">
                      {(artist as any).performerType === "Person" ? "Artista Individual" : "Grupo Musical"}
                    </p>
                  </div>
                  {(artist as any).alternateName && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nombre Real</p>
                      <p className="font-medium">{(artist as any).alternateName}</p>
                    </div>
                  )}
                  {(artist as any).birthDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Nacimiento</p>
                      <p className="font-medium">
                        {new Intl.DateTimeFormat("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date((artist as any).birthDate))}
                      </p>
                    </div>
                  )}
                  {(artist as any).foundingDate && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Fundación</p>
                      <p className="font-medium">{(artist as any).foundingDate}</p>
                    </div>
                  )}
                </div>

                {(artist as any).jobTitle && (artist as any).jobTitle.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Títulos Profesionales</p>
                    <div className="flex flex-wrap gap-2">
                      {(artist as any).jobTitle.map((title: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(artist as any).members && (artist as any).members.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Miembros del Grupo</p>
                    <div className="space-y-2">
                      {(artist as any).members.map((member: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {member.role && <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>}
                          </div>
                          {member.sameAs && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={member.sameAs} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Famous tracks and albums */}
            {((artist as any).famousTracks && (artist as any).famousTracks.length > 0) ||
             ((artist as any).famousAlbums && (artist as any).famousAlbums.length > 0) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Obras Famosas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(artist as any).famousTracks && (artist as any).famousTracks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tracks Famosos</h4>
                      <ul className="space-y-1">
                        {(artist as any).famousTracks.map((track: any, index: number) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {track.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(artist as any).famousAlbums && (artist as any).famousAlbums.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Álbumes Famosos</h4>
                      <ul className="space-y-1">
                        {(artist as any).famousAlbums.map((album: any, index: number) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            • {album.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}