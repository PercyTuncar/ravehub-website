"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Users, MapPin, Music, Star } from "lucide-react"
import type { Event } from "@/types"

interface EventTemplate {
  id: string
  name: string
  description: string
  eventType: "dj_set" | "festival" | "concert" | "other"
  defaultValues: Partial<Event>
  icon: React.ReactNode
  color: string
}

const eventTemplates: EventTemplate[] = [
  {
    id: "music-event",
    name: "Concierto/DJ Set",
    description: "Evento con uno o más artistas principales (MusicEvent)",
    eventType: "dj_set",
    icon: <Music className="h-6 w-6" />,
    color: "bg-purple-500",
    defaultValues: {
      eventType: "dj_set",
      sellTicketsOnPlatform: true,
      allowOfflinePayments: true,
      allowInstallmentPayments: false,
      isHighlighted: false,
      isAccessibleForFree: false,
      typicalAgeRange: "18+",
      categories: ["Concierto", "DJ Set", "Electrónica"],
      tags: ["dj", "electronica", "musica"],
      currency: "USD",
      inLanguage: "es",
      eventAttendanceMode: "http://schema.org/OfflineEventAttendanceMode",
      organizer: {
        name: "RAVEHUB",
        url: "https://ravehub.com",
      },
      zones: [
        {
          id: "vip",
          eventId: "",
          name: "VIP",
          capacity: 100,
          isActive: true,
        },
        {
          id: "general",
          eventId: "",
          name: "Entrada General",
          capacity: 400,
          isActive: true,
        },
      ],
      salesPhases: [
        {
          id: "preventa-1",
          eventId: "",
          name: "Preventa 1 - General",
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          zonesPricing: [
            {
              zoneId: "vip",
              phaseId: "preventa-1",
              price: 150,
              available: 100,
              sold: 0,
            },
            {
              zoneId: "general",
              phaseId: "preventa-1",
              price: 80,
              available: 400,
              sold: 0,
            },
          ],
        },
        {
          id: "preventa-2",
          eventId: "",
          name: "Preventa 2 - General",
          isActive: true,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
          zonesPricing: [
            {
              zoneId: "vip",
              phaseId: "preventa-2",
              price: 200,
              available: 100,
              sold: 0,
            },
            {
              zoneId: "general",
              phaseId: "preventa-2",
              price: 120,
              available: 400,
              sold: 0,
            },
          ],
        },
      ],
    },
  },
  {
    id: "festival",
    name: "Festival",
    description: "Festival multi-día con múltiples artistas ([\"Festival\", \"MusicEvent\"])",
    eventType: "festival",
    icon: <Star className="h-6 w-6" />,
    color: "bg-blue-500",
    defaultValues: {
      eventType: "festival",
      isMultiDay: true,
      sellTicketsOnPlatform: true,
      allowOfflinePayments: true,
      allowInstallmentPayments: true,
      isHighlighted: true,
      isAccessibleForFree: false,
      typicalAgeRange: "18+",
      categories: ["Festival", "Electrónica"],
      tags: ["festival", "electronica", "multi-dj"],
      currency: "USD",
      inLanguage: "es",
      eventAttendanceMode: "http://schema.org/OfflineEventAttendanceMode",
      organizer: {
        name: "RAVEHUB",
        url: "https://ravehub.com",
      },
      zones: [
        {
          id: "vip",
          eventId: "",
          name: "VIP",
          capacity: 200,
          isActive: true,
        },
        {
          id: "general",
          eventId: "",
          name: "Entrada General",
          capacity: 800,
          isActive: true,
        },
      ],
      salesPhases: [
        {
          id: "early-bird",
          eventId: "",
          name: "Abono 3 Días - Preventa Early Bird",
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          zonesPricing: [
            {
              zoneId: "vip",
              phaseId: "early-bird",
              price: 450,
              available: 200,
              sold: 0,
            },
            {
              zoneId: "general",
              phaseId: "early-bird",
              price: 250,
              available: 800,
              sold: 0,
            },
          ],
        },
        {
          id: "vip-abono",
          eventId: "",
          name: "Abono VIP 3 Días",
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
          zonesPricing: [
            {
              zoneId: "vip",
              phaseId: "vip-abono",
              price: 950,
              available: 200,
              sold: 0,
            },
            {
              zoneId: "general",
              phaseId: "vip-abono",
              price: 350,
              available: 800,
              sold: 0,
            },
          ],
        },
      ],
    },
  },
]

interface EventTemplatesProps {
  onSelectTemplate: (template: EventTemplate) => void
}

export function EventTemplates({ onSelectTemplate }: EventTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null)

  const handleSelectTemplate = (template: EventTemplate) => {
    setSelectedTemplate(template)
    onSelectTemplate(template)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Usar Plantilla
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plantillas de Eventos</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {eventTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${template.color}`}>
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {template.eventType}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{template.defaultValues.zones?.length} zona(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{template.defaultValues.salesPhases?.length} fase(s) de venta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>Capacidad: {template.defaultValues.zones?.reduce((acc, zone) => acc + zone.capacity, 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">¿Qué incluye cada plantilla?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Configuración básica del evento (tipo, categorías, tags)</li>
            <li>• Zonas predefinidas con capacidades</li>
            <li>• Fases de venta con precios sugeridos</li>
            <li>• Configuración de pagos y opciones</li>
            <li>• Schema.org optimizado para SEO</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Puedes modificar cualquier aspecto de la plantilla después de seleccionarla.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}