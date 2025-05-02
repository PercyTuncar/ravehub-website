import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { DJ } from "@/types/dj-ranking"

// Get all DJs
export async function getAllDJs() {
  try {
    const djsRef = collection(db, "djs")
    const q = query(djsRef, orderBy("name"))
    const querySnapshot = await getDocs(q)

    const djs: DJ[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      djs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DJ)
    })

    return djs
  } catch (error) {
    console.error("Error getting DJs:", error)
    throw error
  }
}

// Get DJs by country
export async function getDJsByCountry(country: string) {
  try {
    const djsRef = collection(db, "djs")
    const q = query(djsRef, where("country", "==", country), where("approved", "==", true), orderBy("name"))
    const querySnapshot = await getDocs(q)

    const djs: DJ[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      djs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as DJ)
    })

    return djs
  } catch (error) {
    console.error("Error getting DJs by country:", error)
    throw error
  }
}

// Get DJ by ID
export async function getDJById(id: string) {
  try {
    const djDoc = await getDoc(doc(db, "djs", id))

    if (!djDoc.exists()) {
      return null
    }

    const data = djDoc.data()
    return {
      id: djDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as DJ
  } catch (error) {
    console.error("Error getting DJ by ID:", error)
    throw error
  }
}

// Update DJ profile
export async function updateDJProfile(id: string, data: Partial<DJ>, adminId: string) {
  try {
    const djRef = doc(db, "djs", id)
    await updateDoc(djRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    })
    return true
  } catch (error) {
    console.error("Error updating DJ profile:", error)
    throw error
  }
}

// Search DJs by name
export async function searchDJs(name: string, limitCount = 5) {
  try {
    const djsRef = collection(db, "djs")
    const q = query(djsRef, where("approved", "==", true), orderBy("name"), limit(100))
    const querySnapshot = await getDocs(q)

    const djs: DJ[] = []
    const lowerName = name.toLowerCase()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.name.toLowerCase().includes(lowerName)) {
        djs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as DJ)
      }
    })

    return djs.slice(0, limitCount)
  } catch (error) {
    console.error("Error searching DJs:", error)
    throw error
  }
}
