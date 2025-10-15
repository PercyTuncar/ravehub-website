import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react"

interface GoogleSearchPreviewProps {
  title: string
  description: string
  url: string
  date?: string
  location?: string
  artists?: string[]
  eventType?: string
}

export function GoogleSearchPreview({
  title,
  description,
  url,
  date,
  location,
  artists = [],
  eventType
}: GoogleSearchPreviewProps) {
  // Simulate Google search result appearance
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          Vista Previa de Google
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Search Result Simulation */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          {/* Title */}
          <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-1 leading-tight">
            {title || "Título del evento aparecerá aquí"}
          </h3>

          {/* URL */}
          <div className="text-sm text-green-700 mb-2 flex items-center gap-1">
            <span className="text-xs">🔒</span>
            <span>{displayUrl || "ravehublatam.com/eventos/ejemplo"}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {description || "La descripción del evento aparecerá aquí. Esta es la parte más importante para convencer a los usuarios de hacer clic en tu resultado."}
          </p>

          {/* Additional metadata that might appear */}
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

        {/* Tips for better SEO */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para Mejorar el SEO</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Título:</strong> Incluye el nombre del evento, ubicación y "entradas" (máx. 60 caracteres)</li>
            <li>• <strong>Descripción:</strong> Sé persuasivo, menciona artistas destacados y llama a la acción (máx. 160 caracteres)</li>
            <li>• <strong>Palabras clave:</strong> Incluye términos como "entradas", "música electrónica", "festival"</li>
            <li>• <strong>Ubicación:</strong> Específica la ciudad para búsquedas locales</li>
          </ul>
        </div>

        {/* Character counts */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Título</div>
            <div className={`text-lg font-bold ${title.length > 60 ? 'text-red-600' : title.length > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
              {title.length}/60 caracteres
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {title.length > 60 ? "Demasiado largo" : title.length > 50 ? "Cerca del límite" : "Longitud óptima"}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Descripción</div>
            <div className={`text-lg font-bold ${description.length > 160 ? 'text-red-600' : description.length > 140 ? 'text-yellow-600' : 'text-green-600'}`}>
              {description.length}/160 caracteres
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {description.length > 160 ? "Demasiado largo" : description.length > 140 ? "Cerca del límite" : "Longitud óptima"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}