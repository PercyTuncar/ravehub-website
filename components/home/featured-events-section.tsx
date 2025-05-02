"use client"

import type React from "react"

import { useState, useCallback, memo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { Calendar, ArrowRight } from "lucide-react"
import type { Event } from "@/types"

// Dynamically import EventCard with loading fallback
const EventCard = dynamic(() => import("@/components/event-card").then((mod) => ({ default: mod.EventCard })), {
  loading: () => (
    <div className="h-full rounded-xl bg-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-t-xl"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  ),
  ssr: false,
})

// Optimized motion component with reduced overhead
const MotionDiv = memo(
  ({
    children,
    delay = 0,
    className = "",
  }: {
    children: React.ReactNode
    delay?: number
    className?: string
  }) => {
    return (
      <div
        className={`transition-all duration-500 ease-out ${className}`}
        style={{
          opacity: 0,
          transform: "translateY(20px)",
          animation: `fadeInUp 500ms ${delay}ms forwards`,
        }}
      >
        {children}
      </div>
    )
  },
)
MotionDiv.displayName = "MotionDiv"

interface FeaturedEventsSectionProps {
  events: Event[]
}

// Add CSS animation to the global stylesheet
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.innerHTML = `
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
  document.head.appendChild(style)
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
        <MotionDiv className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12">
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
        </MotionDiv>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {visibleEvents.map((event, index) => (
            <MotionDiv
              key={event.id}
              delay={index * 100}
              className="transform transition-transform duration-300 hover:-translate-y-2 h-full"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <EventCard event={event} lazyLoad={true} />
            </MotionDiv>
          ))}
        </div>

        <MotionDiv delay={300} className="mt-8 sm:mt-10 md:mt-12 text-center">
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
        </MotionDiv>
      </div>
    </section>
  )
})
FeaturedEventsSectionInner.displayName = "FeaturedEventsSectionInner"

// Export a wrapper component that handles loading state
export function FeaturedEventsSection(props: FeaturedEventsSectionProps) {
  return <FeaturedEventsSectionInner {...props} />
}
