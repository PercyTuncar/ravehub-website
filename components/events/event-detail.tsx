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
import { AlertTriangle, CalendarDays, Clock, MapPin, Users, ExternalLink, Music, Info, Ticket, HelpCircle } from "lucide-react"
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
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({})
  const [showDescriptionModal, setShowDescriptionModal] = useState<string | null>(null)

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

  // Handle quantity change
  const handleQuantityChange = (zoneId: string, quantity: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [zoneId]: Math.max(0, quantity)
    }))
  }

  // Get selected phase
  const getSelectedPhase = () => {
    return event.salesPhases?.find(phase => phase.id === selectedPhaseId) || null
  }

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(getDefaultActivePhaseId())

  return (
    <div className="flex flex-col space-y-8">
      {/* Event Header */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <Image
          src={event.bannerImageUrl || "/placeholder.svg?height=400&width=1200"}
          alt={event.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
          <Badge variant="secondary" className="self-start mb-4 bg-primary/90 backdrop-blur-sm text-primary-foreground animate-fade-in-up">
            {timeLeft}
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-white animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{event.name}</h1>
          <div className="flex flex-wrap gap-2 text-white animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {event.categories.map((category) => (
              <Badge key={category} variant="outline" className="border-white/70 text-white backdrop-blur-sm">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>


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
          {/* Ticket Purchase - Mobile First Design */}
          <div className="space-y-6 -mt-8 relative z-10">
            <div className="bg-background rounded-t-3xl px-6 pt-8 pb-6 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Ticket className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Entradas</h2>
              </div>

            {event.sellTicketsOnPlatform ? (
              <>
                {event.salesPhases && event.salesPhases.length > 0 ? (
                  <>
                    {/* Segmented Control for Sales Phases */}
                    <div className="bg-muted/30 rounded-xl p-1 mb-6">
                      <div className="flex gap-1">
                        {event.salesPhases.map((phase, index) => {
                          const now = new Date()
                          const startDate = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate)
                          const endDate = phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate)
                          const isCurrentPhase = now >= startDate && now <= endDate
                          const isPastPhase = now > endDate
                          const isPhaseActive = phase.isActive !== false
                          const isSoldOut = !isPhaseActive || (isPastPhase && !isCurrentPhase)
                          const isSelected = phase.id === selectedPhaseId

                          return (
                            <button
                              key={phase.id}
                              onClick={() => setSelectedPhaseId(phase.id)}
                              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : isSoldOut
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                              }`}
                              disabled={isSoldOut}
                            >
                              {phase.name}
                              {isSoldOut && <span className="block text-xs opacity-75">Agotado</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Individual Ticket Cards */}
                    <div className="space-y-4">
                      {event.zones.map((zone, index) => {
                        const selectedPhase = getSelectedPhase()
                        const pricing = selectedPhase?.zonesPricing.find((p) => p.zoneId === zone.id)
                        const isSoldOut = !selectedPhase?.isActive || !pricing || pricing.available <= pricing.sold
                        const quantity = ticketQuantities[zone.id] || 0

                        // Determine zone tier based on index position
                        const isBasic = index === 0
                        const isPremium = index === event.zones.length - 1
                        const isMidTier = !isBasic && !isPremium

                        return (
                          <Card
                            key={zone.id}
                            className={`shadow-sm hover:shadow-md transition-all duration-200 border-0 ${
                              isSoldOut ? "opacity-60" : ""
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <h3 className="font-bold text-lg">{zone.name}</h3>
                                      {zone.description && (
                                        <button
                                          onClick={() => setShowDescriptionModal(zone.id)}
                                          className="w-4 h-4 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors flex-shrink-0"
                                          aria-label="Ver descripción"
                                        >
                                          <HelpCircle className="w-3 h-3 text-muted-foreground" />
                                        </button>
                                      )}
                                    </div>
                                    {isPremium && (
                                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                        Premium
                                      </Badge>
                                    )}
                                    {isMidTier && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                        VIP
                                      </Badge>
                                    )}
                                    {isBasic && (
                                      <Badge variant="outline" className="text-gray-600">
                                        General
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {pricing && (
                                    <div className="text-lg font-bold text-primary">
                                      {formatCurrency(pricing.price, event.currency, currency, exchangeRates)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Quantity Selector */}
                              {!isSoldOut ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleQuantityChange(zone.id, quantity - 1)}
                                      className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                      disabled={quantity <= 0}
                                    >
                                      <span className="text-lg font-medium">-</span>
                                    </button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <button
                                      onClick={() => handleQuantityChange(zone.id, quantity + 1)}
                                      className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                      disabled={quantity >= (pricing?.available || 0)}
                                    >
                                      <span className="text-lg font-medium">+</span>
                                    </button>
                                  </div>

                                  <Button
                                    onClick={() => handlePurchase(zone)}
                                    disabled={quantity === 0}
                                    className={`px-6 bg-primary hover:bg-primary/90 ${
                                      quantity === 0 ? "opacity-60" : ""
                                    }`}
                                  >
                                    {quantity === 0 ? "Seleccionar" : `Comprar ${quantity}`}
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <Badge variant="destructive" className="w-full justify-center">
                                    Agotado
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {event.allowInstallmentPayments && (
                      <div className="text-center text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                        💳 Este evento permite pago en cuotas
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay fases de venta disponibles para este evento.</p>
                  </div>
                )}
              </>
            ) : (
              <Card className="shadow-sm border-0">
                <CardContent className="p-6 text-center">
                  <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                      <span>Comprar en ticketera externa</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
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

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {event.zones.find(z => z.id === showDescriptionModal)?.name}
              </h3>
              <button
                onClick={() => setShowDescriptionModal(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <p className="text-muted-foreground">
              {event.zones.find(z => z.id === showDescriptionModal)?.description}
            </p>
          </div>
        </div>
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

  /* Banner animations */
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
`
