"use client"

import { useEffect, useState } from "react"
import type { Event } from "@/types"
import { EventSchema } from "@/components/events/event-schema"
import dynamic from "next/dynamic"
import EventDetailSkeleton from "@/components/events/event-detail-skeleton"

// Importar EventDetail dinámicamente desde un componente cliente
const EventDetail = dynamic(() => import("@/components/events/event-detail"), {
  ssr: false,
  loading: () => <EventDetailSkeleton />,
})

interface EventDetailClientWrapperProps {
  event: Event
}

export default function EventDetailClientWrapper({ event }: EventDetailClientWrapperProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <EventDetailSkeleton />
  }

  return (
    <>
      <EventDetail event={event} />
      {event && <EventSchema event={event} />}
    </>
  )
}
