"use client"
import { useState, useCallback, memo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { Calendar, ArrowRight } from "lucide-react"
import type { Event } from "@/types"

// Lighter-weight placeholder for lazy loading
const EventCardPlaceholder = () => (
  <div className="h-full rounded-xl overflow-hidden border border-muted">
    <div className="h-40 bg-muted"></div>
    <div className="p-4 space-y-2">
      <div className="h-5 bg-muted rounded w-2/3"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="pt-2">
        <div className="h-8 bg-muted rounded w-full"></div>
      </div>
    </div>
  </div>
)

// Dynamically import EventCard with simple loading fallback
const EventCard = dynamic(() => import("@/components/event-card").then((mod) => ({ default: mod.EventCard })), {
  loading: () => <EventCardPlaceholder />,
  ssr: false,
})

interface FeaturedEventsSectionProps {
  events: Event[]
}

// Memoize the entire component to prevent unnecessary re-renders
const FeaturedEventsSectionInner = memo(({ events }: FeaturedEventsSectionProps) => {
  const [isHovered, setIsHovered] = useState<number | null>(null)

  // Memoize the hover handlers to prevent recreating functions on each render
  const handleMouseEnter = useCallback((index: number) => {
    setIsHovered(index)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(null)
  }, [])

  // Limit the number of events to reduce DOM size
  const visibleEvents = events.slice(0, 3)

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-background to-background/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="fade-in-up flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Próximos eventos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Eventos destacados</h2>
          </div>
          <Button asChild variant="outline" className="group self-start">
            <Link href="/eventos">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {visibleEvents.map((event, index) => (
            <div
              key={event.id}
              className="fade-in-stagger-item transform transition-transform duration-300 hover:-translate-y-2 h-full"
              style={{ animationDelay: `${index * 150}ms` }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <EventCard event={event} lazyLoad={true} />
            </div>
          ))}
        </div>

        <div className="fade-in-up delay-300 mt-8 sm:mt-10 md:mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 group shadow-lg hover:shadow-xl transition-shadow"
          >
            <Link href="/eventos">
              Explorar todos los eventos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
})
FeaturedEventsSectionInner.displayName = "FeaturedEventsSectionInner"

// Export a wrapper component that handles loading state
export function FeaturedEventsSection(props: FeaturedEventsSectionProps) {
  return <FeaturedEventsSectionInner {...props} />
}
