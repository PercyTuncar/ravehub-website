"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, AlertCircle } from "lucide-react"
import type { Event } from "@/types"
import { Pre } from "@/components/ui/pre"

interface EventSchemaPreviewProps {
  event: Event
  currency?: string
  schemaData?: any
}

export function EventSchemaPreview({ event, currency = "USD", schemaData: externalSchemaData }: EventSchemaPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"

  // Función para asegurarse de que la URL tiene el protocolo 'https://'
  const ensureHttpsProtocol = (url: string) => {
    if (!url) return undefined
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`
    }
    return url
  }

  // Formatear fechas para el esquema
  const startDateISO = event.startDate ? new Date(event.startDate).toISOString() : undefined
  const endDateISO = event.endDate ? new Date(event.endDate).toISOString() : undefined

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

  // Usar datos externos si están disponibles, de lo contrario generar
  const schemaData = externalSchemaData || {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#webpage`),
        url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
        inLanguage: event.inLanguage || "es",
        name: `Entradas para ${event.name} - RAVEHUB`,
        datePublished: startDateISO,
        dateModified: startDateISO,
        description: event.shortDescription,
        isPartOf: {
          "@type": "WebSite",
          "@id": ensureHttpsProtocol(`${baseUrl}/#website`),
          url: ensureHttpsProtocol(baseUrl),
          name: "RAVEHUB",
          publisher: {
            "@type": "Organization",
            "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
            name: "RAVEHUB",
            url: ensureHttpsProtocol(baseUrl),
            logo: {
              "@type": "ImageObject",
              "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
              url: ensureHttpsProtocol(`${baseUrl}/logo.png`),
              width: 261,
              height: 60,
              caption: "RAVEHUB",
            },
            image: {
              "@type": "ImageObject",
              "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
              url: ensureHttpsProtocol(`${baseUrl}/logo.png`),
              width: 261,
              height: 60,
              caption: "RAVEHUB",
            },
          },
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: ensureHttpsProtocol(`${baseUrl}/?s={search_term_string}`),
          },
          "query-input": {
            "@type": "PropertyValueSpecification",
            valueRequired: "http://schema.org/True",
            valueName: "search_term_string",
          },
        },
      },
      {
        "@type": "MusicEvent",
        "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#event`),
        name: event.name,
        description: event.descriptionText || event.shortDescription,
        url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
        image: event.mainImageUrl,
        startDate: startDateISO,
        endDate: endDateISO || startDateISO, // Usar startDate como fallback si no hay endDate
        eventStatus: event.eventStatus || "https://schema.org/EventScheduled",
        eventAttendanceMode: event.eventAttendanceMode || "https://schema.org/OfflineEventAttendanceMode",
        organizer: {
          "@type": "Organization",
          name: event.organizer?.name || "RAVEHUB",
          url: ensureHttpsProtocol(event.organizer?.url || baseUrl),
        },
        location: event.location
          ? {
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
            }
          : undefined,
        performer:
          Array.isArray(event.artistLineup) && event.artistLineup.length > 0
            ? event.artistLineup.map((artist) => ({
                "@type": "MusicGroup",
                "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#performer-${artist.id}`),
                name: artist.name,
                image: artist.imageUrl ? {
                  "@type": "ImageObject",
                  url: artist.imageUrl,
                  width: 400,
                  height: 400,
                } : undefined,
                ...(artist.description && { description: artist.description }),
                sameAs: [
                  ...(artist.instagramHandle ? [`https://instagram.com/${artist.instagramHandle.replace("@", "")}`] : []),
                  ...(artist.spotifyUrl ? [artist.spotifyUrl] : []),
                  ...(artist.soundcloudUrl ? [artist.soundcloudUrl] : []),
                ].filter(Boolean),
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
                priceCurrency: currency,
                validFrom: phase.startDate ? new Date(phase.startDate).toISOString() : startDateISO,
                validThrough: phase.endDate ? new Date(phase.endDate).toISOString() : endDateISO,
              }))
            : price
              ? [
                  {
                    "@type": "Offer",
                    availability: "https://schema.org/LimitedAvailability",
                    url: ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}`),
                    price: price,
                    priceCurrency: currency,
                    validFrom: startDateISO,
                    validThrough: endDateISO,
                  },
                ]
              : undefined,
        ...(event.subEvents &&
          event.subEvents.length > 0 && {
            subEvent: event.subEvents.map((subEvent) => ({
              "@type": "Event",
              name: subEvent.name,
              description: subEvent.description,
              startDate: subEvent.startDate ? new Date(subEvent.startDate).toISOString() : undefined,
              endDate: subEvent.endDate ? new Date(subEvent.endDate).toISOString() : undefined,
              location: {
                "@type": "Place",
                name: event.location?.venueName,
              },
            })),
          }),
        ...(event.mainImageUrl && {
          image: {
            "@type": "ImageObject",
            url: event.mainImageUrl,
            width: 1200,
            height: 630,
            caption: event.name,
          },
        }),
        // Add aggregateRating if reviews exist
        ...(event.reviews && event.reviews.length > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length,
            reviewCount: event.reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }),
        // Add additional properties for better SEO
        keywords: event.tags?.join(", "),
        genre: event.categories?.join(", "),
        ...(event.isHighlighted && {
          superEvent: {
            "@type": "Festival",
            name: "RAVEHUB Music Festival Series",
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            item: {
              "@type": "Thing",
              "@id": ensureHttpsProtocol(baseUrl),
              name: "Home",
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@type": "Thing",
              "@id": ensureHttpsProtocol(`${baseUrl}/eventos/`),
              name: "Eventos",
            },
          },
          {
            "@type": "ListItem",
            position: 3,
            item: {
              "@type": "Thing",
              "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}/`),
              name: event.name,
            },
          },
        ],
      },
      ...(Array.isArray(event.faqSection) && event.faqSection.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${event.slug}#faq`),
              mainEntity: event.faqSection.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  }

  const schemaString = JSON.stringify(schemaData, null, 2)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(schemaString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const validateSchema = () => {
    // Aquí se podría implementar una validación real contra validator.schema.org
    // Por ahora, solo hacemos una validación básica
    try {
      // Verificar campos obligatorios para MusicEvent
      const musicEvent = schemaData["@graph"].find((item: any) => item["@type"] === "MusicEvent")

      if (!musicEvent) {
        setValidationResult({ valid: false, message: "No se encontró un objeto MusicEvent en el schema" })
        return
      }

      const requiredFields = ["name", "startDate", "location"]
      const missingFields = requiredFields.filter((field) => !(musicEvent as any)[field])

      if (missingFields.length > 0) {
        setValidationResult({
          valid: false,
          message: `Faltan campos obligatorios: ${missingFields.join(", ")}`,
        })
        return
      }

      setValidationResult({
        valid: true,
        message: "El schema parece válido. Para una validación completa, utiliza validator.schema.org",
      })
    } catch (error) {
      setValidationResult({ valid: false, message: "Error al validar el schema" })
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Vista Previa de Schema.org</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            <TabsTrigger value="validation">Validación</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar JSON-LD"}
              </Button>
            </div>

            <Pre className="max-h-[500px] overflow-auto">{schemaString}</Pre>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este es el código JSON-LD que se generará para este evento. Puedes copiarlo y validarlo en{" "}
                <a
                  href="https://validator.schema.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  validator.schema.org
                </a>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Button onClick={validateSchema}>Validar Schema</Button>

            {validationResult && (
              <Alert variant={validationResult.valid ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Consejos para un Schema.org óptimo:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Asegúrate de completar todos los campos obligatorios (nombre, fecha, ubicación)</li>
                <li>Incluye información detallada sobre artistas y precios</li>
                <li>Añade coordenadas geográficas para mejorar la visibilidad en mapas</li>
                <li>Incluye FAQs para mejorar la visibilidad en los resultados de búsqueda</li>
                <li>Utiliza URLs absolutas con protocolo HTTPS</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
