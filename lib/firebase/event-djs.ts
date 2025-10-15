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
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { EventDJ } from "@/types"

// Get all approved EventDJs
export async function getAllApprovedEventDJs(limitCount = 100): Promise<EventDJ[]> {
  try {
    const djsRef = collection(db, "eventDjs")
    const q = query(
      djsRef,
      where("approved", "==", true),
      orderBy("name"),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)

    const djs: EventDJ[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      djs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as EventDJ)
    })

    return djs
  } catch (error) {
    console.error("Error getting approved EventDJs:", error)
    throw error
  }
}

// Get EventDJ by ID
export async function getEventDJById(id: string): Promise<EventDJ | null> {
  try {
    const docRef = doc(db, "eventDjs", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as EventDJ
    }
    return null
  } catch (error) {
    console.error("Error getting EventDJ by ID:", error)
    throw error
  }
}

// Search EventDJs by name
export async function searchEventDJs(name: string, limitCount = 10): Promise<EventDJ[]> {
  try {
    const djsRef = collection(db, "eventDjs")
    // Firebase doesn't support native "LIKE" queries, so we'll get all approved and filter
    const q = query(
      djsRef,
      where("approved", "==", true),
      orderBy("name"),
      limit(200)
    )
    const querySnapshot = await getDocs(q)

    const djs: EventDJ[] = []
    const lowerName = name.toLowerCase()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.name.toLowerCase().includes(lowerName)) {
        djs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as EventDJ)
      }
    })

    return djs.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching EventDJs:", error)
    throw error
  }
}

// Create new EventDJ
export async function createEventDJ(
  djData: Omit<EventDJ, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "eventDjs"), {
      ...djData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating EventDJ:", error)
    throw error
  }
}

// Update EventDJ
export async function updateEventDJ(id: string, data: Partial<EventDJ>): Promise<void> {
  try {
    const djRef = doc(db, "eventDjs", id)
    await updateDoc(djRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating EventDJ:", error)
    throw error
  }
}

// Delete EventDJ
export async function deleteEventDJ(id: string): Promise<void> {
  try {
    const djRef = doc(db, "eventDjs", id)
    await deleteDoc(djRef)
  } catch (error) {
    console.error("Error deleting EventDJ:", error)
    throw error
  }
}

// Get EventDJs by country
export async function getEventDJsByCountry(country: string, limitCount = 50): Promise<EventDJ[]> {
  try {
    const djsRef = collection(db, "eventDjs")
    const q = query(
      djsRef,
      where("approved", "==", true),
      where("country", "==", country),
      orderBy("name"),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)

    const djs: EventDJ[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      djs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as EventDJ)
    })

    return djs
  } catch (error) {
    console.error("Error getting EventDJs by country:", error)
    throw error
  }
}