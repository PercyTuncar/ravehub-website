import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { EventCTA } from "@/types"

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

// Get CTA by event ID
export async function getCTAByEventId(eventId: string): Promise<EventCTA | null> {
  try {
    const ctasRef = collection(db, "eventCTAs")
    const q = query(ctasRef, where("eventId", "==", eventId), where("isActive", "==", true))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()

    // Normalize dates
    const cta: EventCTA = {
      id: doc.id,
      ...data,
      countdownEndDate:
        data.countdownEndDate?.toDate?.() || (data.countdownEndDate ? new Date(data.countdownEndDate) : undefined),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
    } as EventCTA

    return cta
  } catch (error) {
    console.error("Error fetching CTA by event ID:", error)
    return null
  }
}

// Get CTA by ID
export async function getCTAById(id: string): Promise<EventCTA | null> {
  try {
    const ctaDoc = await getDoc(doc(db, "eventCTAs", id))

    if (!ctaDoc.exists()) {
      return null
    }

    const data = ctaDoc.data()

    // Normalize dates
    const cta: EventCTA = {
      id: ctaDoc.id,
      ...data,
      countdownEndDate:
        data.countdownEndDate?.toDate?.() || (data.countdownEndDate ? new Date(data.countdownEndDate) : undefined),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
    } as EventCTA

    return cta
  } catch (error) {
    console.error(`Error fetching CTA with ID ${id}:`, error)
    return null
  }
}

// Get all CTAs
export async function getAllCTAs(): Promise<EventCTA[]> {
  try {
    const ctasRef = collection(db, "eventCTAs")
    const q = query(ctasRef, orderBy("updatedAt", "desc"))

    const querySnapshot = await getDocs(q)
    const ctas: EventCTA[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()

      // Normalize dates
      const cta: EventCTA = {
        id: doc.id,
        ...data,
        countdownEndDate:
          data.countdownEndDate?.toDate?.() || (data.countdownEndDate ? new Date(data.countdownEndDate) : undefined),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
      } as EventCTA

      ctas.push(cta)
    })

    return ctas
  } catch (error) {
    console.error("Error fetching all CTAs:", error)
    return []
  }
}

// Create a new CTA
export async function createCTA(ctaData: Omit<EventCTA, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // Add server timestamp and remove undefined values
    const ctaWithTimestamp = removeUndefinedValues({
      ...ctaData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const docRef = await addDoc(collection(db, "eventCTAs"), ctaWithTimestamp)
    return docRef.id
  } catch (error) {
    console.error("Error creating CTA:", error)
    throw error
  }
}

// Update an existing CTA
export async function updateCTA(id: string, ctaData: Partial<EventCTA>): Promise<void> {
  try {
    const ctaRef = doc(db, "eventCTAs", id)

    // Add server timestamp for update and remove undefined values
    const ctaWithTimestamp = removeUndefinedValues({
      ...ctaData,
      updatedAt: serverTimestamp(),
    })

    await updateDoc(ctaRef, ctaWithTimestamp)
  } catch (error) {
    console.error(`Error updating CTA with ID ${id}:`, error)
    throw error
  }
}

// Delete a CTA
export async function deleteCTA(id: string): Promise<void> {
  try {
    const ctaRef = doc(db, "eventCTAs", id)
    await deleteDoc(ctaRef)
  } catch (error) {
    console.error(`Error deleting CTA with ID ${id}:`, error)
    throw error
  }
}
