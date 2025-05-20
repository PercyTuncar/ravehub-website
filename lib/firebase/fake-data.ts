import { collection, doc, getDoc, addDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import { getRandomFakeUser } from "@/lib/fake-data/users"
import { getRandomBlogComment, getRandomBlogRating, getRandomProductReview } from "@/lib/fake-data/comments"
import { REACTION_TYPES } from "@/lib/fake-data/constants"

// Generar vistas falsas para un post
export async function generateFakeViews(postId: string, viewCount: number): Promise<void> {
  try {
    // Obtener el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error(`Post with ID ${postId} not found`)
    }

    // Actualizar el contador de vistas
    await updateDoc(postRef, {
      viewCount: viewCount,
      views: viewCount, // Para compatibilidad con código existente
    })

    console.log(`Generated ${viewCount} fake views for post ${postId}`)
  } catch (error) {
    console.error("Error generating fake views:", error)
    throw error
  }
}

// Generar reacciones falsas para un post
export async function generateFakeReactions(postId: string, reactionCounts: Record<string, number>): Promise<void> {
  try {
    // Obtener el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error(`Post with ID ${postId} not found`)
    }

    // Obtener las reacciones actuales del post
    const postData = postDoc.data()
    const currentReactions = postData.reactions || { total: 0, types: {} }

    // Crear objeto para las reacciones actualizadas
    const updatedReactions = {
      total: currentReactions.total || 0,
      types: { ...currentReactions.types },
    }

    console.log("Reacciones actuales:", currentReactions)
    console.log("Reacciones a generar:", reactionCounts)

    // Generar reacciones para cada tipo
    for (const [type, count] of Object.entries(reactionCounts)) {
      if (count <= 0) continue

      // Actualizar el contador de reacciones
      updatedReactions.total += count
      updatedReactions.types[type] = (updatedReactions.types[type] || 0) + count

      // Generar reacciones individuales
      const batch = []
      for (let i = 0; i < count; i++) {
        const fakeUser = getRandomFakeUser()

        batch.push({
          postId,
          userId: fakeUser.id,
          userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
          userImageUrl: fakeUser.photoURL,
          reactionType: type,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date in the last 30 days
        })

        // Procesar en lotes de 20 para evitar sobrecarga
        if (batch.length >= 20) {
          await Promise.all(batch.map((reaction) => addDoc(collection(db, "blogReactions"), reaction)))
          batch.length = 0
        }
      }

      // Procesar el lote restante
      if (batch.length > 0) {
        await Promise.all(batch.map((reaction) => addDoc(collection(db, "blogReactions"), reaction)))
      }
    }

    console.log("Reacciones actualizadas:", updatedReactions)

    // Actualizar el post con las nuevas reacciones
    await updateDoc(postRef, {
      reactions: updatedReactions,
    })

    console.log(`Generated fake reactions for post ${postId}:`, reactionCounts)
  } catch (error) {
    console.error("Error generating fake reactions:", error)
    throw error
  }
}

// Generar comentarios falsos para un post
export async function generateFakeComments(postId: string, commentCount: number): Promise<void> {
  try {
    // Obtener el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error(`Post with ID ${postId} not found`)
    }

    // Generar comentarios
    for (let i = 0; i < commentCount; i++) {
      const fakeUser = getRandomFakeUser()
      const commentText = getRandomBlogComment()

      // Crear fecha aleatoria en los últimos 30 días
      const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))

      await addDoc(collection(db, "blogComments"), {
        postId,
        userId: fakeUser.id,
        userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
        userImageUrl: fakeUser.photoURL,
        content: commentText,
        createdAt: randomDate,
        isApproved: true,
        likes: Math.floor(Math.random() * 10),
        likedBy: [],
      })
    }

    console.log(`Generated ${commentCount} fake comments for post ${postId}`)
  } catch (error) {
    console.error("Error generating fake comments:", error)
    throw error
  }
}

// Generar reseñas falsas para un post
export async function generateFakeRatings(
  postId: string,
  totalRatings: number,
  fourStarRatings: number,
  fiveStarRatings: number,
): Promise<void> {
  try {
    // Obtener el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error(`Post with ID ${postId} not found`)
    }

    // Generar reseñas
    let totalRatingSum = 0

    // Generar reseñas de 4 estrellas
    for (let i = 0; i < fourStarRatings; i++) {
      const fakeUser = getRandomFakeUser()
      const ratingText = getRandomBlogRating()

      // Crear fecha aleatoria en los últimos 60 días
      const randomDate = new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))

      await addDoc(collection(db, "blogRatings"), {
        postId,
        userId: fakeUser.id,
        userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
        rating: 4,
        comment: ratingText,
        createdAt: randomDate,
      })

      totalRatingSum += 4
    }

    // Generar reseñas de 5 estrellas
    for (let i = 0; i < fiveStarRatings; i++) {
      const fakeUser = getRandomFakeUser()
      const ratingText = getRandomBlogRating()

      // Crear fecha aleatoria en los últimos 60 días
      const randomDate = new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))

      await addDoc(collection(db, "blogRatings"), {
        postId,
        userId: fakeUser.id,
        userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
        rating: 5,
        comment: ratingText,
        createdAt: randomDate,
      })

      totalRatingSum += 5
    }

    // Actualizar el post con la calificación promedio
    const averageRating = totalRatingSum / totalRatings

    await updateDoc(postRef, {
      averageRating,
      ratingCount: totalRatings,
    })

    console.log(`Generated ${totalRatings} fake ratings for post ${postId}`)
  } catch (error) {
    console.error("Error generating fake ratings:", error)
    throw error
  }
}

// Generar shares falsos para un post
export async function generateFakeSocialShares(
  postId: string,
  totalShares: number,
  distributionMethod: string,
  customDistribution?: Record<string, number>,
): Promise<void> {
  try {
    // Obtener el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error(`Post with ID ${postId} not found`)
    }

    // Obtener los shares actuales del post
    const postData = postDoc.data()
    const currentShares = postData.socialShares || { total: 0, facebook: 0, twitter: 0, linkedin: 0, whatsapp: 0 }

    // Crear objeto para los shares actualizados
    let updatedShares: Record<string, number> = {
      total: totalShares,
      facebook: 0,
      twitter: 0,
      linkedin: 0,
      whatsapp: 0,
    }

    // Distribuir los shares según el método seleccionado
    if (distributionMethod === "equal") {
      const sharePerPlatform = Math.floor(totalShares / 4)
      const remainder = totalShares % 4

      updatedShares.facebook = sharePerPlatform + (remainder > 0 ? 1 : 0)
      updatedShares.twitter = sharePerPlatform + (remainder > 1 ? 1 : 0)
      updatedShares.linkedin = sharePerPlatform + (remainder > 2 ? 1 : 0)
      updatedShares.whatsapp = sharePerPlatform
    } else if (distributionMethod === "random") {
      // Distribuir aleatoriamente
      let remaining = totalShares
      const platforms = ["facebook", "twitter", "linkedin", "whatsapp"]

      // Asignar aleatoriamente a las primeras 3 plataformas
      for (let i = 0; i < 3; i++) {
        const platform = platforms[i]
        const max = Math.min(remaining, Math.floor(totalShares * 0.7)) // Máximo 70% para una plataforma
        const share = Math.floor(Math.random() * max)
        updatedShares[platform] = share
        remaining -= share
      }

      // Asignar el resto a la última plataforma
      updatedShares.whatsapp = remaining
    } else if (distributionMethod === "custom" && customDistribution) {
      // Usar distribución personalizada
      updatedShares = {
        total: totalShares,
        facebook: customDistribution.facebook || 0,
        twitter: customDistribution.twitter || 0,
        linkedin: customDistribution.linkedin || 0,
        whatsapp: customDistribution.whatsapp || 0,
      }
    }

    // Actualizar el post con los nuevos shares
    await updateDoc(postRef, {
      socialShares: updatedShares,
    })

    console.log(`Generated ${totalShares} fake social shares for post ${postId}`)
  } catch (error) {
    console.error("Error generating fake social shares:", error)
    throw error
  }
}

// Generar reacciones falsas al post
export async function generateFakePostReactions(
  postId: string,
  totalReactions: number,
  distributionMethod: string,
  customDistribution?: Record<string, number>,
): Promise<void> {
  try {
    // Obtener el post
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      throw new Error(`Post with ID ${postId} not found`)
    }

    // Obtener las reacciones actuales del post
    const postData = postDoc.data()
    const currentReactions = postData.reactions || { total: 0, types: {} }

    // Crear objeto para las reacciones actualizadas
    const updatedReactions = {
      total: currentReactions.total || 0,
      types: { ...currentReactions.types },
    }

    // Distribuir las reacciones según el método seleccionado
    let distribution: Record<string, number> = {}

    if (distributionMethod === "equal") {
      const reactionPerType = Math.floor(totalReactions / REACTION_TYPES.length)
      const remainder = totalReactions % REACTION_TYPES.length

      distribution = REACTION_TYPES.reduce(
        (acc, type, index) => ({
          ...acc,
          [type]: reactionPerType + (index < remainder ? 1 : 0),
        }),
        {},
      )
    } else if (distributionMethod === "random") {
      // Distribuir aleatoriamente
      let remaining = totalReactions

      // Asignar aleatoriamente a todos los tipos excepto el último
      for (let i = 0; i < REACTION_TYPES.length - 1; i++) {
        const type = REACTION_TYPES[i]
        const max = Math.min(remaining, Math.floor(totalReactions * 0.5)) // Máximo 50% para un tipo
        const count = Math.floor(Math.random() * max)
        distribution[type] = count
        remaining -= count
      }

      // Asignar el resto al último tipo
      distribution[REACTION_TYPES[REACTION_TYPES.length - 1]] = remaining
    } else if (distributionMethod === "custom" && customDistribution) {
      // Usar distribución personalizada
      distribution = { ...customDistribution }
    }

    // Generar reacciones para cada tipo
    for (const [type, count] of Object.entries(distribution)) {
      if (count <= 0) continue

      // Actualizar el contador de reacciones
      updatedReactions.total += count
      updatedReactions.types[type] = (updatedReactions.types[type] || 0) + count

      // Generar reacciones individuales
      for (let i = 0; i < count; i++) {
        const fakeUser = getRandomFakeUser()

        await addDoc(collection(db, "blogReactions"), {
          postId,
          userId: fakeUser.id,
          userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
          userImageUrl: fakeUser.photoURL,
          reactionType: type,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date in the last 30 days
        })
      }
    }

    // Actualizar el post con las nuevas reacciones
    await updateDoc(postRef, {
      reactions: updatedReactions,
    })

    console.log(`Generated ${totalReactions} fake post reactions for post ${postId}`)
  } catch (error) {
    console.error("Error generating fake post reactions:", error)
    throw error
  }
}

// Generar reseñas falsas para un producto
export async function generateFakeProductReviews(
  productId: string,
  productType: string,
  totalReviews: number,
  fourStarReviews: number,
  fiveStarReviews: number,
): Promise<void> {
  try {
    // Obtener el producto
    const productRef = doc(db, "products", productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      throw new Error(`Product with ID ${productId} not found`)
    }

    const productData = productDoc.data()

    // Generar reseñas
    let totalRatingSum = 0

    // Generar reseñas de 4 estrellas
    for (let i = 0; i < fourStarReviews; i++) {
      const fakeUser = getRandomFakeUser()
      const reviewText = getRandomProductReview(productType, fakeUser.gender)

      // Crear fecha aleatoria en los últimos 90 días
      const randomDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))

      await addDoc(collection(db, "productReviews"), {
        productId,
        userId: fakeUser.id,
        userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
        userImageUrl: fakeUser.photoURL,
        rating: 4,
        title: `Reseña de ${productType}`,
        comment: reviewText,
        purchaseVerified: Math.random() > 0.2, // 80% de probabilidad de ser verificada
        helpfulCount: Math.floor(Math.random() * 5),
        reportCount: 0,
        createdAt: randomDate,
        approved: true,
      })

      totalRatingSum += 4
    }

    // Generar reseñas de 5 estrellas
    for (let i = 0; i < fiveStarReviews; i++) {
      const fakeUser = getRandomFakeUser()
      const reviewText = getRandomProductReview(productType, fakeUser.gender)

      // Crear fecha aleatoria en los últimos 90 días
      const randomDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))

      await addDoc(collection(db, "productReviews"), {
        productId,
        userId: fakeUser.id,
        userName: `${fakeUser.firstName} ${fakeUser.lastName}`,
        userImageUrl: fakeUser.photoURL,
        rating: 5,
        title: `Excelente ${productType}`,
        comment: reviewText,
        purchaseVerified: Math.random() > 0.2, // 80% de probabilidad de ser verificada
        helpfulCount: Math.floor(Math.random() * 8),
        reportCount: 0,
        createdAt: randomDate,
        approved: true,
      })

      totalRatingSum += 5
    }

    // Actualizar el producto con la calificación promedio
    const averageRating = totalRatingSum / totalReviews

    await updateDoc(productRef, {
      rating: averageRating,
      reviewCount: (productData.reviewCount || 0) + totalReviews,
    })

    console.log(`Generated ${totalReviews} fake reviews for product ${productId}`)
  } catch (error) {
    console.error("Error generating fake product reviews:", error)
    throw error
  }
}
