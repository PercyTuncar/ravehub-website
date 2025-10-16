import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  startAfter,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Event } from "@/types"

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

// Get featured events for homepage - only upcoming events
export async function getFeaturedEvents(limitCount = 6): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")

    // Primero obtener todos los eventos destacados publicados
    const q = query(
      eventsRef,
      where("status", "==", "published"),
      where("isHighlighted", "==", true),
      orderBy("startDate", "asc"),
      limit(limitCount * 2), // Obtener más para filtrar
    )

    const querySnapshot = await getDocs(q)
    const allEvents: Event[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Normalize dates for better performance
      const event = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as Event

      allEvents.push(event)
    })

    // Filtrar solo eventos futuros en el código
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Inicio del día actual

    const upcomingEvents = allEvents.filter((event) => {
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    })

    // Ordenar por fecha ascendente (más próximos primero) y limitar
    const sortedEvents = upcomingEvents
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limitCount)

    console.log(`Found ${sortedEvents.length} upcoming featured events out of ${allEvents.length} total highlighted events`)

    return sortedEvents
  } catch (error) {
    console.error("Error fetching featured events:", error)
    return []
  }
}

// Modificar la función getAllEvents para ordenar por proximidad
export async function getAllEvents(): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("status", "==", "published"))

    const querySnapshot = await getDocs(q)
    const events: Event[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Normalize dates for better performance
      const event = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as Event

      events.push(event)
    })

    // Obtener la fecha actual
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Separar eventos futuros y pasados
    const futureEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    })

    const pastEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate < now
    })

    // Ordenar eventos futuros por fecha ascendente (más próximos primero)
    futureEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    // Ordenar eventos pasados por fecha descendente (más recientes primero)
    pastEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    // Combinar ambos conjuntos: primero los futuros, luego los pasados
    return [...futureEvents, ...pastEvents]
  } catch (error) {
    console.error("Error fetching all events:", error)
    return []
  }
}

// Modificar la función getEventsByCountry para ordenar por proximidad
export async function getEventsByCountry(country: string): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("status", "==", "published"), where("country", "==", country))

    const querySnapshot = await getDocs(q)
    const events: Event[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Normalize dates for better performance
      const event = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as Event

      events.push(event)
    })

    // Obtener la fecha actual
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Separar eventos futuros y pasados
    const futureEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    })

    const pastEvents = events.filter((event) => {
      const eventDate = new Date(event.startDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate < now
    })

    // Ordenar eventos futuros por fecha ascendente (más próximos primero)
    futureEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    // Ordenar eventos pasados por fecha descendente (más recientes primero)
    pastEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    // Combinar ambos conjuntos: primero los futuros, luego los pasados
    return [...futureEvents, ...pastEvents]
  } catch (error) {
    console.error(`Error fetching events for country ${country}:`, error)
    return []
  }
}

// Get event by slug
export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    if (!slug) {
      console.error("No slug provided to getEventBySlug")
      return null
    }

    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("slug", "==", slug))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No event found with slug: ${slug}`)
      return null
    }

    // Obtener los datos del documento
    const docData = querySnapshot.docs[0].data()
    const eventId = querySnapshot.docs[0].id

    // Normalizar fechas y campos
    const normalizedEvent: Event = {
      id: eventId,
      ...docData,
      // Convertir timestamps a Date si es necesario
      startDate:
        docData.startDate && typeof docData.startDate.toDate === "function"
          ? docData.startDate.toDate()
          : new Date(docData.startDate || Date.now()),
      endDate:
        docData.endDate && typeof docData.endDate.toDate === "function"
          ? docData.endDate.toDate()
          : docData.endDate
            ? new Date(docData.endDate)
            : undefined,
      createdAt:
        docData.createdAt && typeof docData.createdAt.toDate === "function"
          ? docData.createdAt.toDate()
          : new Date(docData.createdAt || Date.now()),
      updatedAt:
        docData.updatedAt && typeof docData.updatedAt.toDate === "function"
          ? docData.updatedAt.toDate()
          : new Date(docData.updatedAt || Date.now()),
      // Asegurar que estos campos existan
      categories: docData.categories || [],
      tags: docData.tags || [],
      artistLineup: docData.artistLineup || [],
      zones: docData.zones || [],
      salesPhases: docData.salesPhases || [],
      // Asegurar que los nuevos campos tengan valores por defecto
      isMultiDay: docData.isMultiDay ?? false,
      endTime: docData.endTime || "23:00",
      descriptionText: docData.descriptionText || "",
    } as Event

    // Normalizar las fechas en salesPhases
    if (normalizedEvent.salesPhases && normalizedEvent.salesPhases.length > 0) {
      normalizedEvent.salesPhases = normalizedEvent.salesPhases.map((phase) => ({
        ...phase,
        startDate: phase.startDate ? new Date(phase.startDate) : new Date(),
        endDate: phase.endDate ? new Date(phase.endDate) : new Date(),
      }))
    }

    return normalizedEvent
  } catch (error) {
    console.error(`Error fetching event with slug ${slug}:`, error)
    return null
  }
}

// Get event by ID
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const eventDoc = await getDoc(doc(db, "events", id))

    if (!eventDoc.exists()) {
      return null
    }

    const data = eventDoc.data()
    // Normalize dates for better performance
    const event = {
      id: eventDoc.id,
      ...data,
      startDate: data.startDate?.toDate?.() || new Date(data.startDate),
      endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
    } as Event

    return event
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error)
    return null
  }
}

// Create a new event
export async function createEvent(eventData: Event): Promise<string> {
  try {
    console.log("Creating event with data:", eventData)

    // Add server timestamp and remove undefined values
    const eventWithTimestamp = removeUndefinedValues({
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create the document in Firestore
    const docRef = await addDoc(collection(db, "events"), eventWithTimestamp)
    console.log("Event document created with ID:", docRef.id)

    // Update zones and sales phases with the new event ID
    if (eventData.zones && eventData.zones.length > 0) {
      const batch = writeBatch(db)

      // Update event ID in zones
      const updatedZones = eventData.zones.map((zone) => ({
        ...zone,
        eventId: docRef.id,
      }))

      // Update event ID in sales phases
      const updatedSalesPhases = eventData.salesPhases.map((phase) => ({
        ...phase,
        eventId: docRef.id,
        // Ensure zonesPricing is properly structured
        zonesPricing: phase.zonesPricing.map((pricing) => ({
          ...pricing,
          phaseId: phase.id,
        })),
      }))

      // Update the event document with the updated zones and phases
      await updateDoc(
        docRef,
        removeUndefinedValues({
          zones: updatedZones,
          salesPhases: updatedSalesPhases,
        }),
      )

      console.log("Event updated with proper IDs in zones and sales phases")
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// Update an existing event
export async function updateEvent(id: string, eventData: Partial<Event>): Promise<void> {
  try {
    const eventRef = doc(db, "events", id)

    // Add server timestamp for update and remove undefined values
    const eventWithTimestamp = removeUndefinedValues({
      ...eventData,
      updatedAt: serverTimestamp(),
    })

    await updateDoc(eventRef, eventWithTimestamp)
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error)
    throw error
  }
}

// Delete an event
export async function deleteEvent(id: string): Promise<void> {
  try {
    const eventRef = doc(db, "events", id)
    await deleteDoc(eventRef)
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error)
    throw error
  }
}

// Get events for admin (all events, including drafts)
export async function getEventsForAdmin(): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, orderBy("updatedAt", "desc"))

    const querySnapshot = await getDocs(q)
    const events: Event[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Normalize dates for better performance
      const event = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as Event

      events.push(event)
    })

    return events
  } catch (error) {
    console.error("Error fetching events for admin:", error)
    return []
  }
}

// Función optimizada para página de eventos con límite y cache
export async function getEventsForPage(
  limitCount = 12,
  lastDoc?: any,
): Promise<{ events: Event[]; hasMore: boolean; lastDoc: any }> {
  try {
    console.log("getEventsForPage called with limitCount:", limitCount, "lastDoc:", lastDoc)
    const eventsRef = collection(db, "events")
    let q = query(eventsRef, where("status", "==", "published"), orderBy("startDate", "asc"), limit(limitCount))

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    console.log("Executing query for events...")
    const querySnapshot = await getDocs(q)
    console.log("Query executed, found", querySnapshot.docs.length, "documents")
    const events: Event[] = []
    let lastDocument = null

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log("Processing event:", doc.id, "status:", data.status)
      const event = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as Event
      events.push(event)
      lastDocument = doc
    })

    console.log("Returning", events.length, "events, hasMore:", querySnapshot.docs.length === limitCount)
    return {
      events,
      hasMore: querySnapshot.docs.length === limitCount,
      lastDoc: lastDocument,
    }
  } catch (error) {
    console.error("Error fetching events for page:", error)
    return { events: [], hasMore: false, lastDoc: null }
  }
}

// Función para obtener eventos destacados con cache
export async function getFeaturedEventsOptimized(limitCount = 3): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")
    const q = query(
      eventsRef,
      where("status", "==", "published"),
      where("isHighlighted", "==", true),
      orderBy("startDate", "asc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    const events: Event[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const event = {
        id: doc.id,
        name: data.name,
        slug: data.slug,
        mainImageUrl: data.mainImageUrl,
        bannerImageUrl: data.bannerImageUrl,
        shortDescription: data.shortDescription,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        // Solo campos necesarios para el banner
      } as Event
      events.push(event)
    })

    return events
  } catch (error) {
    console.error("Error fetching featured events:", error)
    return []
  }
}

// Función para obtener el conteo de eventos por país
export async function getEventCountsByCountry(): Promise<Record<string, number>> {
  try {
    const eventsRef = collection(db, "events")
    const q = query(eventsRef, where("status", "==", "published"))

    const querySnapshot = await getDocs(q)
    const countryCounts: Record<string, number> = {}

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const country = data.location?.country

      if (country) {
        countryCounts[country] = (countryCounts[country] || 0) + 1
      }
    })

    return countryCounts
  } catch (error) {
    console.error("Error fetching event counts by country:", error)
    return {}
  }
}

// Get events by artist (for artist profile schema)
export async function getEventsByArtist(artistName: string, limitCount = 10): Promise<Event[]> {
  try {
    const eventsRef = collection(db, "events")
    const q = query(
      eventsRef,
      where("status", "==", "published"),
      orderBy("startDate", "desc"),
      limit(limitCount * 2) // Get more to filter
    )

    const querySnapshot = await getDocs(q)
    const allEvents: Event[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const event = {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate?.() || new Date(data.startDate),
        endDate: data.endDate?.toDate?.() || (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as Event

      allEvents.push(event)
    })

    // Filter events that include this artist in the lineup
    const artistEvents = allEvents.filter((event) => {
      return event.artistLineup?.some((artist) =>
        artist.name?.toLowerCase().includes(artistName.toLowerCase())
      )
    })

    // Sort by date (upcoming first, then past)
    const now = new Date()
    const upcomingEvents = artistEvents.filter(event => new Date(event.startDate) >= now)
    const pastEvents = artistEvents.filter(event => new Date(event.startDate) < now)

    upcomingEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    pastEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return [...upcomingEvents, ...pastEvents].slice(0, limitCount)
  } catch (error) {
    console.error(`Error fetching events for artist ${artistName}:`, error)
    return []
  }
}
