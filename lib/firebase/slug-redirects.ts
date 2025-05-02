import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface SlugRedirect {
  id?: string
  oldSlug: string
  newSlug: string
  createdAt?: Date
}

/**
 * Obtiene el slug final siguiendo la cadena de redirecciones
 * @param slug El slug original a verificar
 * @returns El slug final después de seguir todas las redirecciones, o el slug original si no hay redirecciones
 */
export async function getRedirectedSlug(slug: string): Promise<string> {
  try {
    if (!slug) return slug

    let currentSlug = slug
    let redirectCount = 0
    const MAX_REDIRECTS = 10 // Límite para evitar bucles infinitos

    while (redirectCount < MAX_REDIRECTS) {
      // Buscar si el slug actual tiene una redirección
      const redirectsRef = collection(db, "slugRedirects")
      const q = query(redirectsRef, where("oldSlug", "==", currentSlug))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        // No hay más redirecciones, devolver el slug actual
        return currentSlug
      }

      // Obtener el nuevo slug de la redirección
      const redirectData = querySnapshot.docs[0].data() as SlugRedirect
      currentSlug = redirectData.newSlug

      redirectCount++
    }

    console.warn(`Se alcanzó el límite máximo de redirecciones (${MAX_REDIRECTS}) para el slug: ${slug}`)
    return currentSlug
  } catch (error) {
    console.error("Error al obtener redirección de slug:", error)
    return slug // En caso de error, devolver el slug original
  }
}

/**
 * Crea una nueva redirección de slug
 * @param oldSlug El slug anterior
 * @param newSlug El nuevo slug
 * @returns El ID del documento creado
 */
export async function createSlugRedirect(oldSlug: string, newSlug: string): Promise<string> {
  try {
    // Verificar que los slugs no sean iguales
    if (oldSlug === newSlug) {
      throw new Error("El slug antiguo y el nuevo no pueden ser iguales")
    }

    // Verificar si ya existe una redirección para este slug antiguo
    const redirectsRef = collection(db, "slugRedirects")
    const q = query(redirectsRef, where("oldSlug", "==", oldSlug))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Ya existe una redirección, actualizar en lugar de crear
      const existingRedirectId = querySnapshot.docs[0].id
      await deleteDoc(doc(db, "slugRedirects", existingRedirectId))
      console.log(`Redirección existente eliminada: ${oldSlug} -> ${querySnapshot.docs[0].data().newSlug}`)
    }

    // Crear la nueva redirección
    const redirectData: SlugRedirect = {
      oldSlug,
      newSlug,
      createdAt: new Date(),
    }

    const docRef = await addDoc(collection(db, "slugRedirects"), redirectData)
    console.log(`Nueva redirección creada: ${oldSlug} -> ${newSlug}`)
    return docRef.id
  } catch (error) {
    console.error("Error al crear redirección de slug:", error)
    throw error
  }
}

/**
 * Verifica si un slug tiene redirecciones
 * @param slug El slug a verificar
 * @returns true si el slug tiene redirecciones, false en caso contrario
 */
export async function hasSlugRedirects(slug: string): Promise<boolean> {
  try {
    const redirectsRef = collection(db, "slugRedirects")
    const q = query(redirectsRef, where("oldSlug", "==", slug))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error("Error al verificar redirecciones de slug:", error)
    return false
  }
}

/**
 * Obtiene todas las redirecciones para un slug específico
 * @param slug El slug para el que se buscan redirecciones
 * @returns Un array de redirecciones
 */
export async function getSlugRedirects(slug: string): Promise<SlugRedirect[]> {
  try {
    const redirectsRef = collection(db, "slugRedirects")
    const q = query(redirectsRef, where("newSlug", "==", slug))
    const querySnapshot = await getDocs(q)

    const redirects: SlugRedirect[] = []
    querySnapshot.forEach((doc) => {
      redirects.push({ id: doc.id, ...doc.data() } as SlugRedirect)
    })

    return redirects
  } catch (error) {
    console.error("Error al obtener redirecciones para el slug:", error)
    return []
  }
}

/**
 * Elimina una redirección de slug
 * @param redirectId El ID de la redirección a eliminar
 */
export async function deleteSlugRedirect(redirectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "slugRedirects", redirectId))
  } catch (error) {
    console.error("Error al eliminar redirección de slug:", error)
    throw error
  }
}
