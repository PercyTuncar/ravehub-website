import { Suspense } from "react"
import { EventsFilterWrapper } from "@/components/events/events-filter-wrapper"
import { EventsList } from "@/components/events/events-list"
import { EventsLoading } from "@/components/events/events-loading"
import { EventsBanner } from "@/components/events/events-banner"
import { EventsCategories } from "@/components/events/events-categories"

export const metadata = {
  title: "Eventos | RaveHub",
  description: "Explora los mejores eventos de música electrónica en Latinoamérica. Filtra por país, fecha y precio.",
}

export const viewport = {
  themeColor: "#000000",
}

export default function EventsPage() {
  return (
    <div className="w-full">
      <EventsBanner />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center mb-6">Eventos</h1>

        <Suspense fallback={<div>Cargando categorías...</div>}>
          <EventsCategories />
        </Suspense>

        <div className="mt-6">
          <Suspense fallback={<div>Cargando filtros...</div>}>
            <EventsFilterWrapper />
          </Suspense>
        </div>

        <Suspense fallback={<EventsLoading />}>
          <EventsList />
        </Suspense>
      </div>
    </div>
  )
}
