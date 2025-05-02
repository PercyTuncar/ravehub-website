import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { DJ } from "@/types/dj-ranking"

/**
 * Obtiene un DJ por su ID
 * @param id ID del DJ
 * @returns Objeto DJ o null si no existe
 */
export async function getDJById(id: string): Promise<DJ | null> {
  try {
    const docRef = doc(db, "djs", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
      } as DJ
    }
    return null
  } catch (error) {
    console.error("Error getting DJ by ID:", error)
    throw error
  }
}

/**
 * Obtiene los DJs aprobados
 * @param country País opcional para filtrar
 * @param limit Límite de resultados
 * @returns Array de DJs aprobados
 */
export async function getApprovedDJs(country?: string, resultLimit = 50): Promise<DJ[]> {
  try {
    const djsRef = collection(db, "djs")
    let q = query(djsRef, where("approved", "==", true), orderBy("popularity", "desc"), limit(resultLimit))

    if (country) {
      q = query(
        djsRef,
        where("approved", "==", true),
        where("country", "==", country),
        orderBy("popularity", "desc"),
        limit(resultLimit),
      )
    }

    const querySnapshot = await getDocs(q)
    const djs: DJ[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      djs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
      } as DJ)
    })

    return djs
  } catch (error) {
    console.error("Error getting approved DJs:", error)
    throw error
  }
}

/**
 * Actualiza el perfil de un DJ
 * @param id ID del DJ
 * @param data Datos a actualizar
 */
export async function updateDJProfile(id: string, data: Partial<DJ>) {
  try {
    const djRef = doc(db, "djs", id)
    await updateDoc(djRef, {
      ...data,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error updating DJ profile:", error)
    throw error
  }
}

/**
 * Incrementa la popularidad de un DJ
 * @param id ID del DJ
 * @param amount Cantidad a incrementar
 */
export async function incrementDJPopularity(id: string, amount = 1) {
  try {
    const dj = await getDJById(id)
    if (!dj) throw new Error("DJ not found")

    const djRef = doc(db, "djs", id)
    await updateDoc(djRef, {
      popularity: (dj.popularity || 0) + amount,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error incrementing DJ popularity:", error)
    throw error
  }
}
