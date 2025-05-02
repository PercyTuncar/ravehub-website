"use client"

import { useState } from "react"
import Image from "next/image"
import { User, Calendar, MapPin, Clock, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { TicketTransaction } from "@/types"

interface ApprovedTicketCardProps {
  transaction: TicketTransaction
  ticket: any
  onDownload: (ticketPdfUrl: string) => void
  canDownload: boolean
}

export function ApprovedTicketCard({ transaction, ticket, onDownload, canDownload }: ApprovedTicketCardProps) {
  const [imageError, setImageError] = useState(false)

  // Modificar la función isDownloadDateReached para manejar correctamente las zonas horarias
  // Reemplazar la función actual con esta versión mejorada:

  const isDownloadDateReached = () => {
    if (!transaction.ticketsDownloadAvailableDate) return false

    // Convertir a objeto Date si es string
    const downloadDate =
      typeof transaction.ticketsDownloadAvailableDate === "string"
        ? new Date(transaction.ticketsDownloadAvailableDate)
        : new Date(transaction.ticketsDownloadAvailableDate)

    const now = new Date()

    // Normalizar ambas fechas a UTC para comparación consistente
    // Esto elimina las diferencias de zona horaria
    const downloadDateUTC = new Date(
      Date.UTC(downloadDate.getUTCFullYear(), downloadDate.getUTCMonth(), downloadDate.getUTCDate()),
    )

    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    // Comparación usando timestamps UTC
    return nowUTC.getTime() >= downloadDateUTC.getTime()
  }

  // Determinar si realmente se puede descargar (verificación doble)
  const isActuallyDownloadable = Boolean(ticket.ticketPdfUrl && isDownloadDateReached())

  // Get zone info
  const zoneInfo = transaction.event?.zones?.find((zone) => zone.id === ticket.zoneId)

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-white shadow-lg transition-all hover:shadow-xl">
      {/* Mobile badges - shown only on small screens above the image */}
      <div className="md:hidden absolute top-2 left-2 right-2 z-30 flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border-pink-200 font-semibold px-3 py-1 shadow-sm"
        >
          {zoneInfo?.name || ticket.zone?.name || "General"}
        </Badge>

        {ticket.isNominated ? (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 px-3 py-1 shadow-sm"
          >
            <User className="h-3 w-3" />
            <span>Nominada</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1 shadow-sm">
            Sin nominar
          </Badge>
        )}
      </div>
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-pink-400 opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-400 opacity-20 blur-3xl"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5"></div>

      {/* Ticket ribbon */}

      <div className="flex flex-col md:flex-row relative">
        {/* Left side - Event banner */}
        <div className="relative flex-1 overflow-hidden border-b md:border-b-0 md:border-r">
          {/* Holographic overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 z-10 mix-blend-overlay"></div>

          {/* Event banner */}
          <div className="relative h-56 md:h-full w-full min-h-[220px]">
            {transaction.event?.bannerImageUrl ? (
              <Image
                src={imageError ? "/placeholder.svg" : transaction.event.bannerImageUrl}
                alt={transaction.event?.name || "Event banner"}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : transaction.event?.mainImageUrl ? (
              <Image
                src={imageError ? "/placeholder.svg" : transaction.event.mainImageUrl}
                alt={transaction.event?.name || "Event banner"}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <p className="text-muted-foreground">No event image available</p>
              </div>
            )}
          </div>

          {/* Event name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white z-20">
            <h3 className="font-bold text-xl md:text-2xl tracking-wide">{transaction.event?.name || "Event"}</h3>
            <p className="text-sm opacity-90">
              {transaction.event?.startDate && (
                <span>
                  {(() => {
                    // Normalizar la fecha del evento a UTC para mostrarla consistentemente
                    const eventDate = new Date(transaction.event.startDate)
                    // Crear una nueva fecha usando componentes UTC para evitar ajustes de zona horaria
                    const normalizedDate = new Date(
                      eventDate.getUTCFullYear(),
                      eventDate.getUTCMonth(),
                      eventDate.getUTCDate(),
                    )
                    return formatDate(normalizedDate)
                  })()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right side - Ticket details */}
        <div className="flex flex-col justify-between p-5 md:w-2/5 relative">
          {/* Perforated edge */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] hidden md:block">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-2 w-[1px] bg-gray-300 my-1"></div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="hidden md:flex items-center justify-between">
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border-pink-200 font-semibold px-3 py-1"
              >
                {zoneInfo?.name || ticket.zone?.name || "General"}
              </Badge>

              {ticket.isNominated ? (
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 px-3 py-1"
                >
                  <User className="h-3 w-3" />
                  <span>Nominada</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                  Sin nominar
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {ticket.isNominated && (
                <div className="rounded-md bg-white p-3 shadow-sm border border-purple-100">
                  <h4 className="font-medium text-sm mb-2 text-purple-800">Datos de nominación</h4>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <p className="text-muted-foreground">Nombre:</p>
                    <p className="font-medium">{ticket.nomineeFirstName}</p>
                    <p className="text-muted-foreground">Apellido:</p>
                    <p className="font-medium">{ticket.nomineeLastName}</p>
                    <p className="text-muted-foreground">Documento:</p>
                    <p className="font-medium">
                      {ticket.nomineeDocType} {ticket.nomineeDocNumber}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-pink-600" />
                  <span className="font-medium">
                    {transaction.event?.startDate
                      ? (() => {
                          // Normalizar la fecha del evento a UTC para mostrarla consistentemente
                          const eventDate = new Date(transaction.event.startDate)
                          // Crear una nueva fecha usando componentes UTC para evitar ajustes de zona horaria
                          const normalizedDate = new Date(
                            eventDate.getUTCFullYear(),
                            eventDate.getUTCMonth(),
                            eventDate.getUTCDate(),
                          )
                          return formatDate(normalizedDate)
                        })()
                      : "Fecha no disponible"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-pink-600" />
                  <span className="font-medium">{transaction.event?.startTime || "12:00"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-pink-600" />
                  <span className="font-medium">{transaction.event?.location?.venueName || "Venue"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Button
              onClick={() => {
                // Verificación adicional de seguridad antes de permitir la descarga
                if (isDownloadDateReached() && ticket.ticketPdfUrl) {
                  onDownload(ticket.ticketPdfUrl)
                }
              }}
              disabled={!isActuallyDownloadable}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-medium py-6"
            >
              {isActuallyDownloadable ? (
                <>
                  <Ticket className="mr-2 h-5 w-5" />
                  Ver entrada
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-5 w-5" />
                  {!ticket.ticketPdfUrl
                    ? "Entrada no disponible"
                    : transaction.ticketsDownloadAvailableDate
                      ? (() => {
                          // Normalizar la fecha a UTC para mostrarla consistentemente
                          const downloadDate =
                            typeof transaction.ticketsDownloadAvailableDate === "string"
                              ? new Date(transaction.ticketsDownloadAvailableDate)
                              : new Date(transaction.ticketsDownloadAvailableDate)

                          // Crear una nueva fecha usando componentes UTC para evitar ajustes de zona horaria
                          const normalizedDate = new Date(
                            downloadDate.getUTCFullYear(),
                            downloadDate.getUTCMonth(),
                            downloadDate.getUTCDate(),
                          )

                          return `Descarga el ${formatDate(normalizedDate)}`
                        })()
                      : "Disponible pronto"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
