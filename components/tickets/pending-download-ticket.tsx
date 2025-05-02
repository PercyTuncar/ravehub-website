"use client"

import { useState } from "react"
import Image from "next/image"
import { Clock, Calendar, MapPin, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate } from "@/lib/utils"
import type { TicketTransaction } from "@/types"

interface PendingDownloadTicketProps {
  transaction: TicketTransaction
  ticket: any
}

export function PendingDownloadTicket({ transaction, ticket }: PendingDownloadTicketProps) {
  const [imageError, setImageError] = useState(false)

  // Get zone info
  const zoneInfo = transaction.event?.zones?.find((zone) => zone.id === ticket.zoneId)

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 shadow-md">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-200 opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-orange-200 opacity-20 blur-3xl"></div>

      <div className="flex flex-col md:flex-row">
        {/* Left side - Event banner */}
        <div className="relative flex-1 overflow-hidden border-b md:border-b-0 md:border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 z-10"></div>

          {/* Event banner */}
          <div className="relative h-48 md:h-full w-full min-h-[200px]">
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
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white z-20">
            <h3 className="font-bold text-xl md:text-2xl">{transaction.event?.name || "Event"}</h3>
            <p className="text-sm opacity-90">
              {transaction.event?.startDate && <span>{formatDate(new Date(transaction.event.startDate))}</span>}
            </p>
          </div>
        </div>

        {/* Right side - Ticket details */}
        <div className="flex flex-col justify-between p-4 md:w-2/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                {zoneInfo?.name || ticket.zone?.name || "General"}
              </Badge>

              {ticket.isNominated ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  <span>Nominada</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Sin nominar
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {ticket.isNominated && (
                <div className="rounded-md bg-white/80 p-3 shadow-sm">
                  <h4 className="font-medium text-sm mb-2 text-amber-800">Datos de nominación</h4>
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

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>
                    {transaction.event?.startDate
                      ? formatDate(new Date(transaction.event.startDate))
                      : "Fecha no disponible"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>{transaction.event?.startTime || "12:00"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>{transaction.event?.location?.venueName || "Venue"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                {transaction.ticketsDownloadAvailableDate ? (
                  <>
                    Disponible para descarga a partir del:{" "}
                    <strong>{formatDate(new Date(transaction.ticketsDownloadAvailableDate))}</strong>
                  </>
                ) : (
                  "La descarga estará disponible próximamente"
                )}
              </AlertDescription>
            </Alert>

            <Button disabled className="w-full mt-3 bg-gradient-to-r from-amber-400 to-orange-400 opacity-70">
              <Clock className="mr-2 h-4 w-4" />
              Descarga pendiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
