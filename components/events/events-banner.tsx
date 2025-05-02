"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getFeaturedEvents } from "@/lib/firebase/events"
import type { Event } from "@/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function EventsBanner() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedEvents = async () => {
      try {
        const events = await getFeaturedEvents(3)
        setFeaturedEvents(events)
      } catch (error) {
        console.error("Error loading featured events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFeaturedEvents()
  }, [])

  useEffect(() => {
    if (featuredEvents.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredEvents.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [featuredEvents.length])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredEvents.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + featuredEvents.length) % featuredEvents.length)
  }

  if (isLoading || featuredEvents.length === 0) {
    return (
      <div className="w-full h-[300px] bg-muted animate-pulse relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="h-8 w-48 bg-white/20 rounded-md mb-2"></div>
          <div className="h-4 w-96 bg-white/20 rounded-md"></div>
        </div>
      </div>
    )
  }

  const currentEvent = featuredEvents[currentIndex]

  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-b-lg">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Image with priority loading for the first slide */}
      <Image
        src={currentEvent.bannerImageUrl || currentEvent.mainImageUrl || "/placeholder.svg?height=400&width=1200"}
        alt={currentEvent.name}
        fill
        priority={currentIndex === 0}
        sizes="100vw"
        className="object-cover object-center"
        quality={85}
      />

      <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">{currentEvent.name}</h2>
        <p className="text-sm md:text-base mb-4 max-w-2xl line-clamp-2">{currentEvent.shortDescription}</p>

        <div className="flex gap-3">
          <Link href={`/eventos/${currentEvent.slug}`}>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Comprar Tickets
            </Button>
          </Link>
          <Link href="/eventos">
            <Button size="sm" variant="outline" className="border-white text-white  bg-white/10">
              Explorar Eventos
            </Button>
          </Link>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {featuredEvents.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-white" : "bg-white/50"}`}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {featuredEvents.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  )
}
