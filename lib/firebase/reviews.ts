import { db } from "./firebase"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore"
import type { ProductReview } from "@/types"

// Colección de reseñas
const REVIEWS_COLLECTION = "productReviews"

// Create a new product review
export async function createProductReview(reviewData: Partial<ProductReview>) {
  try {
    const reviewsRef = collection(db, "productReviews")

    // Add timestamps and set approved to false by default
    const reviewWithTimestamps = {
      ...reviewData,
      approved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(reviewsRef, reviewWithTimestamps)
    return { id: docRef.id, ...reviewWithTimestamps }
  } catch (error) {
    console.error("Error creating product review:", error)
    throw error
  }
}

// Update an existing product review
export async function updateProductReview(reviewId: string, reviewData: Partial<ProductReview>) {
  try {
    const reviewRef = doc(db, "productReviews", reviewId)

    // Get the current review to preserve the approved status
    const reviewSnap = await getDoc(reviewRef)
    if (!reviewSnap.exists()) {
      throw new Error("Review not found")
    }

    // Update the review while preserving the approved status
    await updateDoc(reviewRef, {
      ...reviewData,
      approved: reviewSnap.data().approved, // Preserve the current approved status
      updatedAt: serverTimestamp(),
    })

    return { id: reviewId, ...reviewData }
  } catch (error) {
    console.error("Error updating product review:", error)
    throw error
  }
}

// Get all approved reviews for a product
export async function getApprovedProductReviews(productId: string) {
  try {
    const reviewsRef = collection(db, "productReviews")
    const q = query(
      reviewsRef,
      where("productId", "==", productId),
      where("approved", "==", true),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const reviews: ProductReview[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as ProductReview
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      })
    })

    return reviews
  } catch (error) {
    console.error("Error fetching approved product reviews:", error)
    throw error
  }
}

// Get all reviews by a user for a specific product
export async function getUserProductReviews(userId: string, productId: string) {
  try {
    if (!userId || !productId) {
      console.error("Invalid parameters: userId or productId is undefined")
      return []
    }

    const reviewsRef = collection(db, "productReviews")
    const q = query(
      reviewsRef,
      where("userId", "==", userId),
      where("productId", "==", productId),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const reviews: ProductReview[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data() as ProductReview
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      })
    })

    return reviews
  } catch (error) {
    console.error("Error fetching user product reviews:", error)
    throw error
  }
}

// Obtener todas las reseñas pendientes (para administradores)
export async function getPendingProductReviews() {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION)
    const q = query(reviewsRef, where("approved", "==", false), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ProductReview[]
  } catch (error) {
    console.error("Error fetching pending product reviews:", error)
    return []
  }
}

// Aprobar una reseña (solo administradores)
export async function approveProductReview(reviewId: string, adminId: string) {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId)
    await updateDoc(reviewRef, {
      approved: true,
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error approving product review:", error)
    return false
  }
}

// Rechazar/eliminar una reseña (solo administradores)
export async function deleteProductReview(reviewId: string) {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId)
    await deleteDoc(reviewRef)

    return true
  } catch (error) {
    console.error("Error deleting product review:", error)
    return false
  }
}

// Calcular la valoración promedio de un producto
export async function getProductAggregateRating(productId: string) {
  try {
    const reviews = await getApprovedProductReviews(productId)

    if (reviews.length === 0) {
      return null
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    return {
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviews.length,
      reviews: reviews,
    }
  } catch (error) {
    console.error("Error calculating product aggregate rating:", error)
    return null
  }
}
