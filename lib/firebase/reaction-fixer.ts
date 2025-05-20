import { collection, query, getDocs, writeBatch, doc, getDoc, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
// Importar las constantes centralizadas
import { VALID_REACTION_TYPES, REACTION_TYPE_MAP } from "@/lib/constants/reaction-types"

// Reemplazar el mapa de normalización local con el importado
// Buscar esta definición:
const reactionTypeMap = REACTION_TYPE_MAP

// Reemplazar la lista de tipos válidos
// Buscar esta definición:
const validReactionTypes = VALID_REACTION_TYPES

/**
 * Corrige y normaliza todas las reacciones para un post específico
 * @param postId ID del post a corregir
 */
export async function fixPostReactions(postId: string): Promise<void> {
  try {
    console.log(`Iniciando corrección de reacciones para post ${postId}...`)

    // Obtener todas las reacciones para este post
    const reactionsRef = collection(db, "blogReactions")
    const q = query(reactionsRef, where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontraron reacciones para el post ${postId}`)
      return
    }

    console.log(`Encontradas ${querySnapshot.size} reacciones para el post ${postId}`)

    // Batch para actualizar múltiples documentos
    const batch = writeBatch(db)
    let updateCount = 0

    // Contadores para las reacciones normalizadas
    const normalizedCounts: Record<string, number> = {}

    // Procesar cada reacción
    querySnapshot.forEach((doc) => {
      const reactionData = doc.data()
      const currentType = reactionData.reactionType

      // Normalizar el tipo de reacción
      let normalizedType = reactionTypeMap[currentType] || currentType

      // Si el tipo normalizado no es válido, usar 'like' como fallback
      if (!validReactionTypes.includes(normalizedType)) {
        console.warn(`Tipo de reacción desconocido: ${currentType}, normalizando a 'like'`)
        normalizedType = "like"
      }

      // Incrementar el contador para este tipo normalizado
      normalizedCounts[normalizedType] = (normalizedCounts[normalizedType] || 0) + 1

      // Si el tipo es diferente, actualizar el documento
      if (normalizedType !== currentType) {
        batch.update(doc.ref, { reactionType: normalizedType })
        updateCount++
      }
    })

    // Si hay actualizaciones, ejecutar el batch
    if (updateCount > 0) {
      await batch.commit()
      console.log(`Se normalizaron ${updateCount} reacciones para el post ${postId}`)
    }

    // Actualizar el contador en el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (postDoc.exists()) {
      const postData = postDoc.data()
      const currentReactions = postData.reactions || { total: 0, types: {} }

      // Calcular el total real
      const totalReactions = Object.values(normalizedCounts).reduce((sum, count) => sum + count, 0)

      // Actualizar el post con los contadores normalizados
      await updateDoc(postRef, {
        reactions: {
          total: totalReactions,
          types: normalizedCounts,
        },
      })

      console.log(`Actualizado el contador de reacciones en el post ${postId}:`, {
        total: totalReactions,
        types: normalizedCounts,
      })
    }
  } catch (error) {
    console.error(`Error corrigiendo reacciones para el post ${postId}:`, error)
    throw error
  }
}

// Optimizar la función fixAllReactions para procesar por lotes
// Reemplazar la implementación actual con esta versión optimizada:
export async function fixAllReactions(): Promise<void> {
  try {
    console.log("Iniciando corrección de todas las reacciones...")

    // Obtener todos los posts
    const postsRef = collection(db, "blog")
    const postsSnapshot = await getDocs(postsRef)

    console.log(`Encontrados ${postsSnapshot.size} posts para procesar`)

    // Procesar en lotes de 5 posts para evitar sobrecarga
    const batchSize = 5
    const totalPosts = postsSnapshot.size

    for (let i = 0; i < totalPosts; i += batchSize) {
      const batch = postsSnapshot.docs.slice(i, i + batchSize)
      console.log(`Procesando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(totalPosts / batchSize)}...`)

      // Procesar cada lote en paralelo
      await Promise.all(
        batch.map((postDoc) => {
          const postId = postDoc.id
          return fixPostReactions(postId).catch((error) => {
            console.error(`Error procesando post ${postId}:`, error)
            // Continuar con el siguiente post aunque haya error
            return null
          })
        }),
      )
    }

    console.log("Corrección de reacciones completada con éxito")
  } catch (error) {
    console.error("Error corrigiendo todas las reacciones:", error)
    throw error
  }
}
