"use client"

import { useState, useEffect, useMemo, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Calendar, Clock, Ticket } from "lucide-react"
import { useCurrency } from "@/context/currency-context"
import type { Event } from "@/types"

interface EventCardProps {
  event: Event
}

// Memoizar el componente para evitar re-renders innecesarios
export const EventCard = memo(({ event }: EventCardProps) => {
  const { currency, exchangeRates } = useCurrency()
  const [isHovered, setIsHovered] = useState(false)

  // Memoizar cálculos pesados
  const cheapestTicket = useMemo(() => {
    return event.salesPhases
      .flatMap((phase) =>
        phase.zonesPricing.map((zone) => ({
          price: zone.price,
          available: zone.available,
          phaseName: phase.name,
          zoneName: event.zones.find((z) => z.id === zone.zoneId)?.name || "",
        })),
      )
      .sort((a, b) => a.price - b.price)[0]
  }, [event.salesPhases, event.zones])

  // Check if all tickets are sold out (keep this logic)
  const isSoldOut = event.salesPhases.flatMap((phase) => phase.zonesPricing).every((zone) => zone.available <= 0)

  // Format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string): string => {
    switch (currencyCode.toUpperCase()) {
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "GBP":
        return "£"
      case "JPY":
        return "¥"
      case "CLP":
        return "$"
      case "PEN":
        return "S/"
      case "MXN":
        return "$"
      case "COP":
        return "$"
      case "ARS":
        return "$"
      case "BRL":
        return "R$"
      default:
        return ""
    }
  }

  // Format price with thousand separators
  const formatPrice = (price: number, currencyCode: string): string => {
    // Use locale formatting for better readability
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Calculate price in selected currency
  const convertPrice = (price: number) => {
    if (!price) return "Agotado"

    if (currency === event.currency) {
      const formattedPrice = formatPrice(price, currency)
      const symbol = getCurrencySymbol(currency)
      return `${symbol} ${formattedPrice} ${currency}`
    }

    const rate = exchangeRates[currency] / exchangeRates[event.currency]
    const convertedPrice = price * rate
    const formattedPrice = formatPrice(convertedPrice, currency)
    const symbol = getCurrencySymbol(currency)
    return `${symbol} ${formattedPrice} ${currency}`
  }

  // Format date for display
  const eventDate = new Date(event.startDate)
  const formattedDate = eventDate.toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  // Format time

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const eventTime = new Date(event.startDate)

      // If the event has already passed, don't show countdown
      if (eventTime <= now) {
        setTimeRemaining(null)
        return
      }

      const totalSeconds = Math.floor((eventTime.getTime() - now.getTime()) / 1000)

      const days = Math.floor(totalSeconds / (60 * 60 * 24))
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
      const seconds = Math.floor(totalSeconds % 60)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Then update every second
    const timerId = setInterval(calculateTimeRemaining, 1000)

    // Clean up on unmount
    return () => clearInterval(timerId)
  }, [event.startDate])

  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group relative block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative overflow-hidden rounded-xl bg-white transition-all duration-500 ease-in-out ${
          isHovered
            ? "shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
            : "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
        }`}
      >
        {/* Left edge decoration - subtle dots */}
        <div className="absolute left-0 top-0 h-full w-[1px] flex flex-col justify-between z-10 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[3px] w-[3px] bg-black/40 rounded-full -ml-[1.5px]" />
          ))}
        </div>

        {/* Right edge decoration - subtle dots */}
        <div className="absolute right-0 top-0 h-full w-[1px] flex flex-col justify-between z-10 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[3px] w-[3px] bg-black/40 rounded-full -mr-[1.5px]" />
          ))}
        </div>

        {/* Top section with image */}
        <div className="relative h-48 overflow-hidden">
          {/* Optimizar imagen con lazy loading inteligente */}
          <Image
            src={event.mainImageUrl || "/placeholder.svg?height=200&width=400"}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-700 ease-in-out ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            loading="lazy"
            quality={60} // Reducir calidad para cards
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />

          {/* Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Categories */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {event.categories?.map((category, index) => (
              <span
                key={index}
                className="bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Countdown Timer */}
          {timeRemaining && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs max-w-[140px]">
              <div className="flex justify-between text-center gap-1">
                <div className="flex-1">
                  <div className="text-sm font-bold leading-none">{timeRemaining.days}</div>
                  <div className="text-[8px] uppercase">días</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold leading-none">{timeRemaining.hours}</div>
                  <div className="text-[8px] uppercase">hrs</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold leading-none">{timeRemaining.minutes}</div>
                  <div className="text-[8px] uppercase">min</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold leading-none">{timeRemaining.seconds}</div>
                  <div className="text-[8px] uppercase">seg</div>
                </div>
              </div>
            </div>
          )}

          {/* Sold Out diagonal ribbon */}
          {isSoldOut && (
            <div className="absolute inset-0 overflow-hidden z-20">
              <div className="absolute top-[20%] right-[-35%] bg-red-600 text-white font-bold py-1 px-12 text-sm transform rotate-45 shadow-md w-full text-center">
                SOLDOUT
              </div>
            </div>
          )}
        </div>

        {/* HEADER SECTION */}
        <div className="p-3 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{event.name}</h3>
        </div>

        {/* BODY SECTION */}
        <div className="p-3 border-b border-gray-100">
          <div className="space-y-2">
            {/* Location */}
            <div className="flex items-center text-gray-700">
              <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{event.location.venueName}</span>
                <span className="text-xs text-gray-500">
                  {event.location.city}, {event.location.country}
                </span>
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex items-center text-gray-700">
              <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0 text-gray-500" />
              <div className="flex flex-col">
                {event.endDate &&
                new Date(event.endDate).toDateString() !== new Date(event.startDate).toDateString() ? (
                  <span className="text-sm font-medium">
                    {formattedDate} -{" "}
                    {new Date(event.endDate).toLocaleDateString("es", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-sm font-medium">{formattedDate}</span>
                )}
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>{formatTime(event.startTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="p-3 flex items-center justify-between">
          {/* Price information */}
          <div className="flex flex-col">
            {!event.sellTicketsOnPlatform ? (
              <>
                <span className="text-xs text-gray-500">Información</span>
                <span className="font-bold text-lg text-gray-900">Venta Directa</span>
                <span className="text-xs text-gray-500">Consulta puntos de venta oficiales</span>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-500">Desde</span>
                <span className={`font-bold text-lg ${isSoldOut ? "text-red-600" : "text-gray-900"}`}>
                  {cheapestTicket ? convertPrice(cheapestTicket.price) : "Precio no disponible"}
                  {isSoldOut && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">Agotado</span>
                  )}
                </span>
                {cheapestTicket && (
                  <span className="text-xs text-gray-500">
                    {cheapestTicket.zoneName} - {cheapestTicket.phaseName}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Action button */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isSoldOut || !event.sellTicketsOnPlatform
                ? "bg-gray-200 text-gray-600 cursor-default"
                : isHovered
                  ? "bg-black text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            <Ticket className="h-4 w-4 mr-1.5" />
            {isSoldOut || !event.sellTicketsOnPlatform ? "Ver Detalles" : "Ver Entradas"}
          </div>
        </div>
      </div>
    </Link>
  )
})
