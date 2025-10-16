import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, ExternalLink, Share2, MessageCircle, Instagram, Twitter } from "lucide-react"
import Image from "next/image"

interface SEOPreviewProps {
  title: string
  description: string
  url: string
  imageUrl?: string
  date?: string
  location?: string
  artists?: string[]
  eventType?: string
}

export function SEOPreview({
  title,
  description,
  url,
  imageUrl,
  date,
  location,
  artists = [],
  eventType
}: SEOPreviewProps) {
  // Simulate different platform appearances
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Vista Previa SEO - Cómo se verá tu evento en redes sociales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="google" className="text-xs">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-1">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              Google
            </TabsTrigger>
            <TabsTrigger value="facebook" className="text-xs">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center mr-1">
                <span className="text-white text-xs font-bold">f</span>
              </div>
              Facebook
            </TabsTrigger>
            <TabsTrigger value="twitter" className="text-xs">
              <Twitter className="w-3 h-3 mr-1" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="instagram" className="text-xs">
              <Instagram className="w-3 h-3 mr-1" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Google Search Preview */}
          <TabsContent value="google" className="mt-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-1 leading-tight">
                {title || "Título del evento aparecerá aquí"}
              </h3>
              <div className="text-sm text-green-700 mb-2 flex items-center gap-1">
                <span className="text-xs">🔒</span>
                <span>{displayUrl || "ravehublatam.com/eventos/ejemplo"}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {description || "La descripción del evento aparecerá aquí. Esta es la parte más importante para convencer a los usuarios de hacer clic en tu resultado."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{date}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{location}</span>
                  </div>
                )}
                {artists.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{artists.slice(0, 2).join(", ")}{artists.length > 2 ? ` y ${artists.length - 2} más` : ""}</span>
                  </div>
                )}
                {eventType && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {eventType === "festival" ? "Festival" : "Evento"}
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Facebook Preview */}
          <TabsContent value="facebook" className="mt-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Vista previa"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">IMG</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Ravehub
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                    {title || "Título del evento"}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                    {description || "Descripción del evento"}
                  </p>
                  <div className="text-xs text-gray-500">
                    {displayUrl || "ravehublatam.com"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Twitter Preview */}
          <TabsContent value="twitter" className="mt-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm max-w-md">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">R</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">Ravehub</span>
                    <span className="text-gray-500 text-sm">@ravehub</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">
                    {description || "Descripción del evento"}
                  </p>
                  {imageUrl && (
                    <div className="border rounded-lg overflow-hidden mb-2">
                      <Image
                        src={imageUrl}
                        alt="Vista previa"
                        width={400}
                        height={200}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {displayUrl || "ravehublatam.com"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Instagram Preview */}
          <TabsContent value="instagram" className="mt-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm max-w-sm mx-auto">
              <div className="text-center">
                {imageUrl ? (
                  <div className="relative w-full h-64 mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt="Vista previa Instagram"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-gray-400">Vista previa de imagen</span>
                  </div>
                )}
                <div className="px-2">
                  <p className="text-sm font-medium mb-1">Ravehub</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {description || "Descripción del evento"}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Ver en {displayUrl || "ravehublatam.com"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* WhatsApp Preview */}
          <TabsContent value="whatsapp" className="mt-4">
            <div className="border rounded-lg p-4 bg-white shadow-sm max-w-sm">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-900">
                      {title || "Título del evento"}
                    </p>
                    {imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt="Vista previa WhatsApp"
                          width={200}
                          height={150}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {displayUrl || "ravehublatam.com"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* SEO Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">💡 Consejos para Mejorar el SEO y Compartir en Redes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h5 className="font-medium mb-2">Para Google:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Título: máx. 60 caracteres</li>
                <li>• Descripción: máx. 160 caracteres</li>
                <li>• Incluye palabras clave locales</li>
                <li>• Menciona artistas destacados</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Para Redes Sociales:</h5>
              <ul className="space-y-1 text-xs">
                <li>• Imagen atractiva (1200x630px)</li>
                <li>• Descripción persuasiva</li>
                <li>• Llama a la acción</li>
                <li>• Incluye fecha y ubicación</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Character counts */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Título</div>
            <div className={`text-lg font-bold ${title.length > 60 ? 'text-red-600' : title.length > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
              {title.length}/60 caracteres
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Descripción</div>
            <div className={`text-lg font-bold ${description.length > 160 ? 'text-red-600' : description.length > 140 ? 'text-yellow-600' : 'text-green-600'}`}>
              {description.length}/160 caracteres
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
