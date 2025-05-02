"use client"

import { useEffect, useState } from "react"
import { getCTAByEventId } from "@/lib/firebase/ctas"
import { EventCTAPreview } from "@/components/admin/event-cta-preview"
import type { EventCTA } from "@/types"

interface EventCTAProps {
  eventId: string
}

export function EventCTA({ eventId }: EventCTAProps) {
  const [cta, setCTA] = useState<EventCTA | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCTA = async () => {
      try {
        setLoading(true)
        const ctaData = await getCTAByEventId(eventId)
        setCTA(ctaData)
      } catch (error) {
        console.error("Error fetching CTA:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCTA()
  }, [eventId])

  if (loading) {
    return <div className="w-full h-16 bg-muted/30 animate-pulse rounded-lg mb-6"></div>
  }

  if (!cta || !cta.isActive) {
    return null
  }

  // Verificar si el countdown ha terminado
  if (cta.hasCountdown && cta.countdownEndDate) {
    const now = new Date()
    const countdownEnd = new Date(cta.countdownEndDate)

    if (now > countdownEnd) {
      // Si el countdown ha terminado, verificamos si hay más contenido
      // Si solo tenía countdown, no mostramos nada
      if (cta.title.trim() === "" && cta.description.trim() === "") {
        return null
      }

      // Si tiene más contenido, mostramos el CTA sin countdown
      const ctaWithoutCountdown = {
        ...cta,
        hasCountdown: false,
      }

      return <EventCTAPreview cta={ctaWithoutCountdown} />
    }
  }

  return <EventCTAPreview cta={cta} />
}
