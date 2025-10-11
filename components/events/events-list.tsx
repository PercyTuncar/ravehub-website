"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { EventCard } from "@/components/event-card"
import { getEventsForPage, getAllEvents } from "@/lib/firebase/events"
import type { Event } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function EventsList() {
  const searchParams = useSearchParams()
  // Reemplazar la lógica de carga de eventos
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [renderedEvents, setRenderedEvents] = useState<Event[]>([])

  // Paginación mejorada
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 6
  const [totalPages, setTotalPages] = useState(1)

  const country = searchParams.get("country")
  const dateParam = searchParams.get("date")
  const minPrice = searchParams.get("minPrice") ? Number.parseInt(searchParams.get("minPrice") as string) : 0
  const maxPrice = searchParams.get("maxPrice")
    ? Number.parseInt(searchParams.get("maxPrice") as string)
    : Number.POSITIVE_INFINITY
  const search = searchParams.get("search")
  const category = searchParams.get("category")

  // Usar useCallback para las funciones de filtrado
  const applyFilters = useCallback(
    (events: Event[]) => {
      // Aplicar filtros de fecha
      if (dateParam) {
        const filterDate = new Date(dateParam)
        events = events.filter((event) => {
          const eventDate = new Date(event.startDate)
          return eventDate.toDateString() === filterDate.toDateString()
        })
      }

      // Apply category filter if present
      if (category && category !== "all") {
        if (category === "today") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)

          events = events.filter((event) => {
            const eventDate = new Date(event.startDate)
            eventDate.setHours(0, 0, 0, 0)
            return eventDate.getTime() === today.getTime()
          })
        } else if (category === "this-week") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const nextWeek = new Date(today)
          nextWeek.setDate(nextWeek.getDate() + 7)

          events = events.filter((event) => {
            const eventDate = new Date(event.startDate)
            return eventDate >= today && eventDate < nextWeek
          })
        } else if (category === "music") {
          events = events.filter((event) =>
            event.categories?.some(
              (cat) =>
                cat.toLowerCase().includes("music") ||
                cat.toLowerCase().includes("música") ||
                cat.toLowerCase() === "concierto",
            ),
          )
        } else if (category === "festival") {
          events = events.filter((event) => event.categories?.some((cat) => cat.toLowerCase().includes("festival")))
        }
      }

      // Apply price filter
      events = events.filter((event) => {
        // Find the lowest price across all zones and phases
        const lowestPrice = event.salesPhases.reduce((lowest, phase) => {
          const phaseLowest = phase.zonesPricing.reduce(
            (min, pricing) => (pricing.price < min ? pricing.price : min),
            phase.zonesPricing[0]?.price || Number.POSITIVE_INFINITY,
          )
          return phaseLowest < lowest ? phaseLowest : lowest
        }, Number.POSITIVE_INFINITY)

        return lowestPrice >= minPrice && lowestPrice <= maxPrice
      })

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        events = events.filter(
          (event) =>
            event.name.toLowerCase().includes(searchLower) ||
            event.shortDescription.toLowerCase().includes(searchLower) ||
            event.artistLineup.some((artist) => artist.name.toLowerCase().includes(searchLower)),
        )
      }

      return events
    },
    [dateParam, category, minPrice, maxPrice, search],
  )

  // Función optimizada para cargar eventos
  const loadEvents = useCallback(
    async (reset = false) => {
      try {
        setLoading(true)

        // Para la categoría "all" sin otros filtros, cargar todos los eventos
        const isAllCategory = (!category || category === "all") && !country && !dateParam && !search && minPrice === 0 && maxPrice === Number.POSITIVE_INFINITY

        if (isAllCategory && reset) {
          // Cargar todos los eventos para "all"
          const allEvents = await getAllEvents()
          setEvents(allEvents)
          setHasMore(false)
          setLastDoc(null)
        } else {
          // Carga paginada normal para otras categorías o filtros
          const {
            events: newEvents,
            hasMore: moreAvailable,
            lastDoc: newLastDoc,
          } = await getEventsForPage(12, reset ? null : lastDoc)

          if (reset) {
            setEvents(newEvents)
          } else {
            setEvents((prev) => [...prev, ...newEvents])
          }

          setHasMore(moreAvailable)
          setLastDoc(newLastDoc)
        }
      } catch (error) {
        console.error("Error loading events:", error)
        setError("Error loading events")
      } finally {
        setLoading(false)
      }
    },
    [lastDoc, category, country, dateParam, search, minPrice, maxPrice],
  )

  // Cargar eventos iniciales
  useEffect(() => {
    loadEvents(true)
  }, [])

  // Aplicar filtros solo a eventos ya cargados
  const eventsAfterFilter = useMemo(() => {
    return applyFilters(events)
  }, [events, dateParam, category, minPrice, maxPrice, search, applyFilters])

  /**
   * Separar eventos en próximos y pasados para la categoría "Todos"
   * Solo se aplica cuando la categoría es "all" y no hay otros filtros activos
   * Próximos eventos: ordenados por fecha ascendente (más cercano primero)
   * Eventos pasados: ordenados por fecha descendente (más reciente primero)
   * Maneja casos edge: eventos sin fecha se excluyen, comparación por día completo
   */
  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (category && category !== "all") {
      return { upcomingEvents: [], pastEvents: [] }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0) // Inicio del día actual para comparación consistente

    const upcoming = eventsAfterFilter.filter((event) => {
      if (!event.startDate) return false // Excluir eventos sin fecha definida
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    const past = eventsAfterFilter.filter((event) => {
      if (!event.startDate) return false // Excluir eventos sin fecha definida
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate < now
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [eventsAfterFilter, category])

  useEffect(() => {
    // Calcular el total de páginas
    setTotalPages(Math.ceil(eventsAfterFilter.length / eventsPerPage))
  }, [eventsAfterFilter, eventsPerPage])

  // Efecto para actualizar los eventos renderizados cuando cambia la página
  useEffect(() => {
    if (eventsAfterFilter.length === 0) return

    const startIndex = (currentPage - 1) * eventsPerPage
    const endIndex = startIndex + eventsPerPage
    const paginatedEvents = eventsAfterFilter.slice(startIndex, endIndex)

    // Renderizar los eventos con un pequeño retraso para mejorar la experiencia
    setRenderedEvents([])

    // Renderizar los primeros 3 eventos inmediatamente
    const initialEvents = paginatedEvents.slice(0, 3)
    setRenderedEvents(initialEvents)

    // Renderizar el resto después de un pequeño retraso
    if (paginatedEvents.length > 3) {
      const timer = setTimeout(() => {
        setRenderedEvents(paginatedEvents)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [eventsAfterFilter, currentPage])

  // Función para cambiar de página
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    // Scroll al inicio de la lista
    window.scrollTo({ top: document.getElementById("events-list")?.offsetTop || 0, behavior: "smooth" })
  }

  // Generar array de páginas para la paginación
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas alrededor de la actual
      if (currentPage <= 3) {
        // Estamos cerca del inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push(-1) // Indicador de "..."
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Estamos cerca del final
        pages.push(1)
        pages.push(-1) // Indicador de "..."
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Estamos en el medio
        pages.push(1)
        pages.push(-1) // Indicador de "..."
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push(-1) // Indicador de "..."
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[350px] bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (eventsAfterFilter.length === 0) {
    return (
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se encontraron eventos</AlertTitle>
        <AlertDescription>
          No hay eventos que coincidan con los filtros seleccionados. Intenta con otros criterios de búsqueda.
        </AlertDescription>
      </Alert>
    )
  }

  // Determinar si mostrar secciones separadas para "all"
  const isAllCategory = (!category || category === "all") && !country && !dateParam && !search && minPrice === 0 && maxPrice === Number.POSITIVE_INFINITY

  return (
    <>
      {isAllCategory ? (
        // Vista separada para "Todos"
        <div className="space-y-12">
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Próximos Eventos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">Eventos Pasados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Vista normal para otros filtros
        <>
          <div id="events-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {renderedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => goToPage(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === -1 ? (
                      <span className="px-4 py-2">...</span>
                    ) : (
                      <PaginationLink
                        onClick={() => goToPage(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => goToPage(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </>
  )
}
