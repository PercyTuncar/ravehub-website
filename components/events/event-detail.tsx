"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"
import type { Event, Zone, SalesPhase } from "@/types"
import { AlertTriangle, CalendarDays, Clock, MapPin, Users, ExternalLink, Music, Info, Ticket } from "lucide-react"
import { PurchaseTicketModal } from "@/components/events/purchase-ticket-modal"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"

// Dynamically import the map component to avoid SSR issues
const EventMap = dynamic(() => import("@/components/events/event-map"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg"></div>,
})

// Add these utility functions at the top of the file, after the imports
const extractColorsFromUrl = (url: string): string[] => {
  if (!url) return []

  // Extract the filename from the URL
  const filename = url.split("/").pop() || ""

  // Check if the filename contains the word "color"
  const colorIndex = filename.toLowerCase().indexOf("color")
  if (colorIndex === -1) return []

  // Extract the part after "color-"
  const colorPart = filename.substring(colorIndex + 6) // "color" + "-" = 6 characters

  // Split by hyphens and filter out non-hex values
  const colorCodes = colorPart
    .split("-")
    .map((part) => {
      // Extract potential hex code (stop at any non-hex character)
      const hexMatch = part.match(/^([0-9A-Fa-f]+)/)
      return hexMatch ? hexMatch[1] : null
    })
    .filter(Boolean) as string[]

  // Ensure each color code has a # prefix
  return colorCodes.map((code) => (code.startsWith("#") ? code : `#${code}`))
}

const generateTitleStyle = (colors: string[]): React.CSSProperties => {
  if (!colors.length) {
    return {} // No colors found, use default styling
  }

  if (colors.length === 1) {
    // Single color - apply directly to text
    return { color: colors[0] }
  } else {
    // Multiple colors - create gradient effect
    const gradient = `linear-gradient(to right, ${colors.join(", ")})`
    return {
      background: gradient,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textFillColor: "transparent",
      // Ensure text is visible on all browsers
      display: "inline-block",
    }
  }
}

interface EventDetailProps {
  event: Event
}

// Cambiar a export default
export default function EventDetail({ event }: EventDetailProps) {
  const { user } = useAuth()
  const { currency, exchangeRates } = useCurrency()
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

  // Get current theme for syntax highlighting
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  // Get current active sales phase
  const getCurrentSalesPhase = (): SalesPhase | null => {
    const now = new Date()

    // Asegurarse de que salesPhases existe y tiene elementos
    if (!event.salesPhases || event.salesPhases.length === 0) {
      return null
    }

    // Buscar la fase actual
    for (const phase of event.salesPhases) {
      // Asegurarse de que las fechas son objetos Date
      const startDate = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)

      const endDate = phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate)

      if (now >= startDate && now <= endDate) {
        return phase
      }
    }

    // Si no hay fase actual, buscar la próxima
    const upcomingPhases = event.salesPhases
      .filter((phase) => {
        const startDate = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)
        return startDate > now
      })
      .sort((a, b) => {
        const aDate = a.startDate instanceof Date ? a.startDate : new Date(a.startDate)
        const bDate = b.startDate instanceof Date ? b.startDate : new Date(b.startDate)
        return aDate.getTime() - bDate.getTime()
      })

    return upcomingPhases.length > 0 ? upcomingPhases[0] : null
  }

  const currentPhase = getCurrentSalesPhase()

  // Function to determine which phase tab should be active by default
  const getDefaultActivePhaseId = (): string => {
    const now = new Date()

    // First, try to find a current active phase
    for (const phase of event.salesPhases || []) {
      const startDate = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)
      const endDate = phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate)
      const isCurrentPhase = now >= startDate && now <= endDate
      const isPhaseActive = phase.isActive !== false

      // If this phase is current and active, return it
      if (isCurrentPhase && isPhaseActive) {
        return phase.id
      }
    }

    // Next, try to find a future active phase
    const futurePhases = (event.salesPhases || [])
      .filter((phase) => {
        const startDate = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)
        return startDate > now && phase.isActive !== false
      })
      .sort((a, b) => {
        const aDate = a.startDate instanceof Date ? a.startDate : new Date(a.startDate)
        const bDate = b.startDate instanceof Date ? b.startDate : new Date(b.startDate)
        return aDate.getTime() - bDate.getTime()
      })

    // If there's a future active phase, return the closest one
    if (futurePhases.length > 0) {
      return futurePhases[0].id
    }

    // If no current or future active phases, return the first phase ID or empty string
    return event.salesPhases && event.salesPhases.length > 0 ? event.salesPhases[0].id : ""
  }

  // Calculate time left until event
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(event.startDate).getTime() - new Date().getTime()

      if (difference <= 0) {
        setTimeLeft("¡Evento en curso!")
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [event.startDate])

  // Format the event date
  const eventDate = new Date(event.startDate)
  const formattedDate = formatDate(eventDate)

  // Format the event end date if it's a multi-day event
  const eventEndDate = event.endDate ? new Date(event.endDate) : null
  const formattedEndDate = eventEndDate ? formatDate(event.endDate) : null

  // Handle ticket purchase
  const handlePurchase = (zone: Zone) => {
    if (!user) {
      // Redirect to login
      window.location.href = `/login?redirect=/eventos/${event.slug}`
      return
    }

    setSelectedZone(zone)
    setIsPurchaseModalOpen(true)
  }

  return (
    <div className="flex flex-col space-y-8">
      {/* Event Header */}
      <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden">
        <Image
          src={event.bannerImageUrl || "/placeholder.svg?height=400&width=1200"}
          alt={event.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
          <Badge variant="secondary" className="self-start mb-4 bg-primary text-primary-foreground">
            {timeLeft}
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white">{event.name}</h1>
          <div className="flex flex-wrap gap-2 text-white">
            {event.categories.map((category) => (
              <Badge key={category} variant="outline" className="border-white text-white">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile WhatsApp CTA - Only visible on mobile and if event hasn't passed yet */}
      {(event.endDate ? new Date(event.endDate) > new Date() : new Date(event.startDate) > new Date()) && (
        <div className="md:hidden backdrop-blur-md bg-white/10 dark:bg-black/30 border border-green-400/50 rounded-2xl shadow-xl overflow-hidden animate-fadeIn relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div
              className="absolute -bottom-20 -right-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-yellow-300/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          {/* Header with glass effect */}
          <div className="backdrop-blur-lg bg-gradient-to-r from-green-500 to-green-600 p-4 text-white relative">
            <h3 className="font-bold text-center text-xl flex items-center justify-center">
              <Ticket className="h-5 w-5 mr-2 animate-bounce" style={{ animationDuration: "2s" }} />
              <span className="relative">
                Compra tus <span className="font-extrabold text-yellow-300 animate-pulse">entradas</span> por WhatsApp
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/50 rounded-full"></span>
              </span>
            </h3>
          </div>

          {/* Content with glass effect */}
          <div className="p-5 space-y-5 backdrop-blur-sm bg-white/5 dark:bg-black/5">
            {/* Countdown Timer with glass effect */}
            <div className="backdrop-blur-md bg-white/20 dark:bg-zinc-800/40 rounded-xl p-4 border border-white/20 shadow-inner transform hover:scale-[1.01] transition-transform duration-300">
              <h4 className="text-center font-medium text-sm mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 uppercase tracking-wider">
                La oferta termina en:
              </h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="backdrop-blur-lg bg-white/30 dark:bg-zinc-900/50 rounded-lg p-2 shadow-lg border border-white/20 dark:border-zinc-700/30 transform hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-300 dark:to-emerald-500">
                    {Math.floor(new Date(event.startDate).getTime() / 86400000 - new Date().getTime() / 86400000)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Días</div>
                </div>
                <div className="backdrop-blur-lg bg-white/30 dark:bg-zinc-900/50 rounded-lg p-2 shadow-lg border border-white/20 dark:border-zinc-700/30 transform hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-300 dark:to-emerald-500">
                    {new Date(event.startDate).getHours() < new Date().getHours()
                      ? 24 - (new Date().getHours() - new Date(event.startDate).getHours())
                      : new Date(event.startDate).getHours() - new Date().getHours()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Horas</div>
                </div>
                <div className="backdrop-blur-lg bg-white/30 dark:bg-zinc-900/50 rounded-lg p-2 shadow-lg border border-white/20 dark:border-zinc-700/30 transform hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-300 dark:to-emerald-500">
                    {new Date(event.startDate).getMinutes() < new Date().getMinutes()
                      ? 60 - (new Date().getMinutes() - new Date(event.startDate).getMinutes())
                      : new Date(event.startDate).getMinutes() - new Date().getMinutes()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Min</div>
                </div>
                <div className="backdrop-blur-lg bg-white/30 dark:bg-zinc-900/50 rounded-lg p-2 shadow-lg border border-white/20 dark:border-zinc-700/30 transform hover:translate-y-[-2px] transition-transform duration-300">
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 dark:from-green-300 dark:to-emerald-500">
                    {new Date(event.startDate).getSeconds() < new Date().getSeconds()
                      ? 60 - (new Date().getSeconds() - new Date(event.startDate).getSeconds())
                      : new Date(event.startDate).getSeconds() - new Date().getSeconds()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">Seg</div>
                </div>
              </div>
            </div>

            {/* Benefits with modern pill design */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center backdrop-blur-md bg-gradient-to-br from-white/20 to-white/5 dark:from-zinc-800/30 dark:to-zinc-800/10 p-3 rounded-xl shadow-sm border border-white/10 dark:border-zinc-700/20 transform hover:translate-y-[-2px] transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Entradas <span className="font-bold text-green-500 dark:text-green-400">seguras</span>
                </span>
              </div>
              <div className="flex items-center backdrop-blur-md bg-gradient-to-br from-white/20 to-white/5 dark:from-zinc-800/30 dark:to-zinc-800/10 p-3 rounded-xl shadow-sm border border-white/10 dark:border-zinc-700/20 transform hover:translate-y-[-2px] transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">
                  Envío <span className="font-bold text-green-500 dark:text-green-400">inmediato</span>
                </span>
              </div>
              <div className="flex items-center backdrop-blur-md bg-gradient-to-br from-white/20 to-white/5 dark:from-zinc-800/30 dark:to-zinc-800/10 p-3 rounded-xl shadow-sm border border-white/10 dark:border-zinc-700/20 transform hover:translate-y-[-2px] transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Precios <span className="font-bold text-green-500 dark:text-green-400">especiales</span>
                </span>
              </div>
              <div className="flex items-center backdrop-blur-md bg-gradient-to-br from-white/20 to-white/5 dark:from-zinc-800/30 dark:to-zinc-800/10 p-3 rounded-xl shadow-sm border border-white/10 dark:border-zinc-700/20 transform hover:translate-y-[-2px] transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Atención <span className="font-bold text-green-500 dark:text-green-400">24/7</span>
                </span>
              </div>
            </div>

            {/* CTA Button with shine effect */}
            <a
              href="https://wa.me/51944784488"
              target="_blank"
              rel="noopener noreferrer"
              className="relative bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1 overflow-hidden group"
            >
              {/* Shine effect overlay */}
              <span className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <span className="absolute top-0 left-[-100%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform skew-x-[-20deg] animate-shine"></span>
              </span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="w-6 h-6 mr-2 relative z-10"
              >
                <path
                  fill="white"
                  d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                />
              </svg>
              <span className="tracking-wide text-lg relative z-10">
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
                COMPRAR <span className="text-yellow-300 font-extrabold">AHORA</span>
              </span>
            </a>

            {/* Group Link with hover effect */}
            <div className="text-center backdrop-blur-sm bg-white/5 dark:bg-black/5 rounded-xl p-3 border border-white/10 dark:border-zinc-700/20">
              <a
                href="https://chat.whatsapp.com/IUs37U1mJq8FZJSQbMUZpc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300 inline-flex items-center group"
              >
                <Users className="h-4 w-4 mr-1 group-hover:animate-bounce" />
                <span className="relative">
                  Únete a nuestro{" "}
                  <span className="font-bold text-green-600 dark:text-green-400">grupo de WhatsApp</span>
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300 rounded-full"></span>
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Event Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8 order-2 order-lg-1">
          {/* Event Details */}
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Información</span>
              </TabsTrigger>
              <TabsTrigger value="lineup" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span>Line Up</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Ubicación</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles del evento</CardTitle>
                  <CardDescription>Toda la información que necesitas saber</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-5 w-5" />
                      <span>
                        {formattedDate}
                        {event.isMultiDay && formattedEndDate && ` - ${formattedEndDate}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span>
                        {formatTime(event.startTime)}
                        {event.endTime && ` - ${formatTime(event.endTime)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      <span>
                        {event.location.venueName}, {event.location.city}
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
                    <style dangerouslySetInnerHTML={{ __html: htmlStyles }} />
                    <div className="html-content">
                      {/* Render HTML content directly */}
                      <div dangerouslySetInnerHTML={{ __html: event.description }} className="p-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lineup" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Line Up</CardTitle>
                  <CardDescription>Artistas que se presentarán en este evento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {event.artistLineup.map((artist) => (
                      <Card key={artist.id} className="overflow-hidden">
                        <div className="relative h-48">
                          <Image
                            src={artist.imageUrl || "/placeholder.svg?height=200&width=300"}
                            alt={artist.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{artist.name}</CardTitle>
                          {artist.instagramHandle && (
                            <Link
                              href={`https://instagram.com/${artist.instagramHandle.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-muted-foreground hover:text-primary"
                            >
                              {artist.instagramHandle}
                            </Link>
                          )}
                        </CardHeader>
                        {artist.description && (
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-3">{artist.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ubicación</CardTitle>
                  <CardDescription>Dónde se realizará el evento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] rounded-lg overflow-hidden">
                    <EventMap
                      latitude={event.location.latitude}
                      longitude={event.location.longitude}
                      venueName={event.location.venueName}
                    />
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                      <strong>Dirección:</strong> {event.location.address}
                    </p>
                    <p>
                      <strong>Ciudad:</strong> {event.location.city}, {event.location.country}
                    </p>
                    {event.location.additionalInfo && (
                      <p>
                        <strong>Información adicional:</strong> {event.location.additionalInfo}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-[60px] lg:self-start lg:max-h-[calc(100vh-80px)] lg:overflow-auto custom-scrollbar">
          {/* Artist Lineup Slider - Only show if there are multiple artists */}

          <div style={{ height: "45px" }} />
          {/* Ticket Purchase */}
          <Card className="lg:shadow-md lg:border-opacity-70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                <span>Entradas</span>
              </CardTitle>
              <CardDescription>
                {event.sellTicketsOnPlatform
                  ? "Compra tus entradas directamente en RaveHub"
                  : "Entradas disponibles en ticketera externa"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.sellTicketsOnPlatform ? (
                <>
                  {event.salesPhases && event.salesPhases.length > 0 ? (
                    <Tabs defaultValue={getDefaultActivePhaseId()}>
                      <div className="relative">
                        {event.salesPhases.length > 3 && (
                          <button
                            onClick={() => {
                              const tabsList = document.querySelector('[role="tablist"]')
                              if (tabsList) {
                                tabsList.scrollBy({ left: -200, behavior: "smooth" })
                              }
                            }}
                            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                            aria-label="Ver fases anteriores"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m15 18-6-6 6-6" />
                            </svg>
                          </button>
                        )}

                        <TabsList
                          className="w-full flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          {event.salesPhases.map((phase) => {
                            // Determine if phase is active, current, past or future
                            const now = new Date()
                            const startDate =
                              phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)
                            const endDate = phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate)
                            const isCurrentPhase = now >= startDate && now <= endDate
                            const isPastPhase = now > endDate
                            const isPhaseActive = phase.isActive !== false
                            const isSoldOut = !isPhaseActive || (isPastPhase && !isCurrentPhase)

                            // Check if tickets are available
                            const hasAvailableTickets = isPhaseActive && !isPastPhase && !isSoldOut

                            return (
                              <TabsTrigger
                                key={phase.id}
                                value={phase.id}
                                className={`relative flex-1 min-w-[120px] snap-start overflow-hidden ${
                                  isSoldOut
                                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30"
                                    : ""
                                } data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold data-[state=active]:border-primary/80 font-medium`}
                              >
                                <div className="flex flex-row items-center justify-center w-full gap-1">
                                  {hasAvailableTickets && (
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                  )}
                                  <span className={isSoldOut ? "text-gray-700 dark:text-gray-300" : ""}>
                                    {phase.name}
                                  </span>

                                  {isSoldOut && (
                                    <Badge variant="destructive" className="text-[10px] py-0">
                                      AGOTADO
                                    </Badge>
                                  )}
                                </div>
                              </TabsTrigger>
                            )
                          })}
                        </TabsList>

                        {event.salesPhases.length > 3 && (
                          <button
                            onClick={() => {
                              const tabsList = document.querySelector('[role="tablist"]')
                              if (tabsList) {
                                tabsList.scrollBy({ left: 200, behavior: "smooth" })
                              }
                            }}
                            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                            aria-label="Ver más fases"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <style jsx global>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {event.salesPhases.map((phase) => {
                        // Determine phase status
                        const now = new Date()
                        const startDate = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)
                        const endDate = phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate)
                        const isCurrentPhase = now >= startDate && now <= endDate
                        const isPastPhase = now > endDate
                        const isFuturePhase = now < startDate
                        const isPhaseActive = phase.isActive !== false

                        // Determine status badge
                        let phaseStatusBadge = null
                        if (!isPhaseActive) {
                          phaseStatusBadge = (
                            <Badge variant="destructive" className="ml-2">
                              AGOTADO
                            </Badge>
                          )
                        } else if (isCurrentPhase) {
                          phaseStatusBadge = (
                            <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                              Actual
                            </Badge>
                          )
                        } else if (isPastPhase) {
                          phaseStatusBadge = (
                            <Badge variant="outline" className="ml-2">
                              Finalizada
                            </Badge>
                          )
                        } else if (isFuturePhase) {
                          phaseStatusBadge = (
                            <Badge variant="outline" className="ml-2 border-blue-400 text-blue-500">
                              Próximamente
                            </Badge>
                          )
                        }

                        return (
                          <TabsContent key={phase.id} value={phase.id} className="mt-4 space-y-4">
                            <div
                              className={`border rounded-lg overflow-hidden ${!isPhaseActive ? "border-destructive/30" : ""}`}
                            >
                              <div
                                className={`p-3 ${!isPhaseActive ? "bg-destructive/5" : isCurrentPhase ? "bg-primary/10" : "bg-muted/50"}`}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium flex items-center">
                                    {phase.name}
                                    {phaseStatusBadge}
                                  </h3>

                                  {!isPhaseActive && (
                                    <div className="flex items-center text-destructive text-sm">
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      <span>Sin disponibilidad</span>
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(startDate)} - {formatDate(endDate)}
                                </p>
                              </div>

                              <div className="p-3 pt-0">
                                {isPastPhase && (
                                  <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    <p className="flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="mr-1"
                                      >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                      </svg>
                                      Esta fase de venta ya ha finalizado con un éxito total. ¡Gracias por tu confianza!
                                      🎉
                                    </p>
                                  </div>
                                )}
                                <p className="text-xs font-medium mt-3 mb-2">Zonas:</p>
                                <div className="space-y-2">
                                  {event.zones.map((zone, index) => {
                                    const pricing = phase.zonesPricing.find((p) => p.zoneId === zone.id)
                                    const isSoldOut = !isPhaseActive || !pricing || pricing.available <= pricing.sold

                                    // Determine zone tier based on index position
                                    // First zones are basic, last zones are premium
                                    const isBasic = index === 0
                                    const isPremium = index === event.zones.length - 1
                                    const isMidTier = !isBasic && !isPremium

                                    // Apply different styling based on tier
                                    let tierStyle = ""
                                    if (isBasic) {
                                      tierStyle = "border-gray-200 dark:border-gray-700"
                                    } else if (isMidTier) {
                                      tierStyle =
                                        "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20"
                                    } else if (isPremium) {
                                      tierStyle =
                                        "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20"
                                    }

                                    return (
                                      <div
                                        key={`${phase.id}-${zone.id}`}
                                        className={`flex justify-between items-center p-2 border rounded-md ${
                                          isSoldOut ? "bg-muted/40" : tierStyle
                                        }`}
                                      >
                                        <div>
                                          <p className="text-sm font-medium flex items-center">
                                            {zone.name}
                                            {isPremium && (
                                              <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium"></span>
                                            )}
                                            {isMidTier && (
                                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium"></span>
                                            )}
                                            {isBasic && (
                                              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-medium"></span>
                                            )}
                                          </p>
                                          {pricing && (
                                            <p
                                              className={`text-xs ${
                                                isSoldOut
                                                  ? "text-muted-foreground"
                                                  : isPremium
                                                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                                                    : isMidTier
                                                      ? "text-blue-600 dark:text-blue-400"
                                                      : "text-primary"
                                              }`}
                                            >
                                              {formatCurrency(pricing.price, event.currency, currency, exchangeRates)}
                                            </p>
                                          )}
                                        </div>

                                        {isCurrentPhase ? (
                                          <Button
                                            onClick={() => handlePurchase(zone)}
                                            disabled={isSoldOut}
                                            variant={isSoldOut ? "outline" : isPremium ? "default" : "secondary"}
                                            size="sm"
                                            className={
                                              isPremium && !isSoldOut
                                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                                : ""
                                            }
                                          >
                                            {isSoldOut ? "Agotado" : "Comprar"}
                                          </Button>
                                        ) : (
                                          <Badge variant={isSoldOut ? "destructive" : "outline"} className="text-xs">
                                            {isSoldOut ? "Agotado" : isPastPhase ? "Finalizado" : "Próximamente"}
                                          </Badge>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        )
                      })}
                    </Tabs>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No hay fases de venta disponibles para este evento.</p>
                    </div>
                  )}

                  {event.allowInstallmentPayments && (
                    <p className="text-xs text-muted-foreground mt-2">
                      * Este evento permite pago en cuotas. Selecciona una zona para ver las opciones.
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Las entradas para este evento se venden a través de una ticketera externa.
                  </p>
                  <Button asChild className="w-full">
                    <Link
                      href={event.externalTicketUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Comprar en ticketera</span>
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedZone && currentPhase && (
        <PurchaseTicketModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          event={event}
          zone={selectedZone}
          phase={currentPhase}
        />
      )}
    </div>
  )
}

// Add this to your global CSS or as a style tag
const htmlStyles = `
  .html-content {
    line-height: 1.6;
    padding: 0; /* Asegura que no haya padding adicional */
  }

  .html-content > div {
    padding: 0 !important; /* Fuerza la eliminación de cualquier padding en el contenido HTML */
  }
  
  .html-content {
    line-height: 1.6;
  }
  
  .html-content h1, 
  .html-content h2, 
  .html-content h3, 
  .html-content h4, 
  .html-content h5, 
  .html-content h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }
  
  .html-content h1 {
    font-size: 1.5em;
  }
  
  .html-content h2 {
    font-size: 1.3em;
  }
  
  .html-content h3 {
    font-size: 1.2em;
  }
  
  .html-content p {
    margin-top: 1em;
    margin-bottom: 1em;
  }
  
  .html-content ul, 
  .html-content ol {
    margin-top: 1em;
    margin-bottom: 1em;
    padding-left: 2em;
  }
  
  .html-content li {
    margin-bottom: 0.5em;
  }
  
  .html-content pre {
    border-radius: 0.375rem;
    margin: 1rem 0;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .html-content code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.875em;
    border-radius: 0.25rem;
    padding: 0.2em 0.4em;
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .dark .html-content code:not(pre code) {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .html-content blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin-left: 0;
    margin-right: 0;
    font-style: italic;
  }
  
  .dark .html-content blockquote {
    border-left-color: #4b5563;
  }
  
  .html-content hr {
    margin: 2em 0;
    border: 0;
    border-top: 1px solid #e5e7eb;
  }
  
  .dark .html-content hr {
    border-top-color: #4b5563;
  }

  @keyframes slide {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-33.333%);
    }
  }

  .animate-carousel {
    display: flex;
    animation: slide 20s linear infinite;
    width: fit-content;
  }

  .animate-carousel:hover {
    animation-play-state: paused;
  }

  /* Custom scrollbar styles */
  .custom-scrollbar::-webkit-scrollbar {
    width: 2px;
    height: 2px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #FF9900;
    border-radius: 5px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #FF9900;
  }
  
  /* For Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #FF9900;
  }
`
