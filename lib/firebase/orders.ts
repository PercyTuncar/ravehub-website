import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import type { Order, OrderItem, User, Product } from "@/types"
import { v4 as uuidv4 } from "uuid"

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

// Create a new order
export async function createOrder(orderData: Order): Promise<string> {
  try {
    // Add server timestamp and remove undefined values
    const orderWithTimestamp = removeUndefinedValues({
      ...orderData,
      orderDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create order document
    const docRef = await addDoc(collection(db, "orders"), orderWithTimestamp)

    // Create order items
    const batch = writeBatch(db)
    orderData.orderItems.forEach((item) => {
      const itemRef = doc(collection(db, "orderItems"), item.id || uuidv4())
      batch.set(
        itemRef,
        removeUndefinedValues({
          ...item,
          orderId: docRef.id,
        }),
      )
    })

    await batch.commit()
    return docRef.id
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

// Get user's orders
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, where("userId", "==", userId), orderBy("orderDate", "desc"))

    const querySnapshot = await getDocs(q)
    const orders: Order[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const orderData = docSnapshot.data()
      const orderId = docSnapshot.id

      // Get order items
      const itemsQuery = query(collection(db, "orderItems"), where("orderId", "==", orderId))
      const itemsSnapshot = await getDocs(itemsQuery)
      const orderItems = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OrderItem)

      orders.push({
        id: orderId, // Usar el ID del documento, no el campo id interno
        ...orderData,
        orderDate:
          orderData.orderDate && typeof orderData.orderDate.toDate === "function"
            ? orderData.orderDate.toDate()
            : new Date(orderData.orderDate || Date.now()),
        updatedAt:
          orderData.updatedAt && typeof orderData.updatedAt.toDate === "function"
            ? orderData.updatedAt.toDate()
            : new Date(orderData.updatedAt || Date.now()),
        expectedDeliveryDate:
          orderData.expectedDeliveryDate && typeof orderData.expectedDeliveryDate.toDate === "function"
            ? orderData.expectedDeliveryDate.toDate()
            : orderData.expectedDeliveryDate
              ? new Date(orderData.expectedDeliveryDate)
              : undefined,
        orderItems,
      } as Order)
    }

    return orders
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error)
    return []
  }
}

// Get order by ID
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const orderDoc = await getDoc(doc(db, "orders", id))

    if (!orderDoc.exists()) {
      return null
    }

    const orderData = orderDoc.data()

    // Get order items
    const itemsQuery = query(collection(db, "orderItems"), where("orderId", "==", id))
    const itemsSnapshot = await getDocs(itemsQuery)
    const orderItems = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OrderItem)

    return {
      id: orderDoc.id, // Usar el ID del documento, no el campo id interno
      ...orderData,
      orderDate:
        orderData.orderDate && typeof orderData.orderDate.toDate === "function"
          ? orderData.orderDate.toDate()
          : new Date(orderData.orderDate || Date.now()),
      updatedAt:
        orderData.updatedAt && typeof orderData.updatedAt.toDate === "function"
          ? orderData.updatedAt.toDate()
          : new Date(orderData.updatedAt || Date.now()),
      expectedDeliveryDate:
        orderData.expectedDeliveryDate && typeof orderData.expectedDeliveryDate.toDate === "function"
          ? orderData.expectedDeliveryDate.toDate()
          : orderData.expectedDeliveryDate
            ? new Date(orderData.expectedDeliveryDate)
            : undefined,
      orderItems,
    } as Order
  } catch (error) {
    console.error(`Error fetching order with ID ${id}:`, error)
    return null
  }
}

// Update order status
export async function updateOrderStatus(
  id: string,
  status: "pending" | "approved" | "shipping" | "delivered" | "cancelled",
  adminId?: string,
  notes?: string,
  trackingNumber?: string,
  expectedDeliveryDate?: Date,
): Promise<void> {
  try {
    // Primero verificamos si el documento existe
    const orderRef = doc(db, "orders", id)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      console.log(`Order with ID ${id} does not exist in Firestore, trying to find by internal id field...`)

      // Intentar buscar por el campo id interno
      const ordersRef = collection(db, "orders")
      const q = query(ordersRef, where("id", "==", id))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Si encontramos un documento con ese campo id, usamos su ID de documento
        const docId = querySnapshot.docs[0].id

        const correctOrderRef = doc(db, "orders", docId)
        const updateData: any = {
          status,
          updatedAt: serverTimestamp(),
        }

        if (adminId) {
          updateData.reviewedBy = adminId
          updateData.reviewedAt = serverTimestamp()
        }

        if (notes) {
          updateData.notes = notes
        }

        if (trackingNumber) {
          updateData.trackingNumber = trackingNumber
        }

        if (expectedDeliveryDate) {
          updateData.expectedDeliveryDate = Timestamp.fromDate(expectedDeliveryDate)
        }

        await updateDoc(correctOrderRef, updateData)
        return // Importante: retornar aquí para evitar lanzar el error
      }

      throw new Error(`Order with ID ${id} does not exist`)
    }

    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    }

    if (adminId) {
      updateData.reviewedBy = adminId
      updateData.reviewedAt = serverTimestamp()
    }

    if (notes) {
      updateData.notes = notes
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }

    if (expectedDeliveryDate) {
      updateData.expectedDeliveryDate = Timestamp.fromDate(expectedDeliveryDate)
    }

    await updateDoc(orderRef, updateData)
  } catch (error) {
    console.error(`Error updating order status for ID ${id}:`, error)
    throw error
  }
}

// Update payment status
export async function updatePaymentStatus(
  id: string,
  paymentStatus: "pending" | "approved" | "rejected",
  adminId?: string,
): Promise<void> {
  try {
    // Primero verificamos si el documento existe
    const orderRef = doc(db, "orders", id)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      console.log(`Order with ID ${id} does not exist in Firestore, trying to find by internal id field...`)

      // Intentar buscar por el campo id interno
      const ordersRef = collection(db, "orders")
      const q = query(ordersRef, where("id", "==", id))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Si encontramos un documento con ese campo id, usamos su ID de documento
        const docId = querySnapshot.docs[0].id

        const correctOrderRef = doc(db, "orders", docId)
        const updateData: any = {
          paymentStatus,
          updatedAt: serverTimestamp(),
        }

        if (adminId) {
          updateData.reviewedBy = adminId
          updateData.reviewedAt = serverTimestamp()
        }

        await updateDoc(correctOrderRef, updateData)
        return // Importante: retornar aquí para evitar lanzar el error
      }

      throw new Error(`Order with ID ${id} does not exist`)
    }

    const updateData: any = {
      paymentStatus,
      updatedAt: serverTimestamp(),
    }

    if (adminId) {
      updateData.reviewedBy = adminId
      updateData.reviewedAt = serverTimestamp()
    }

    await updateDoc(orderRef, updateData)
  } catch (error) {
    console.error(`Error updating payment status for order ID ${id}:`, error)
    throw error
  }
}

// Upload payment proof
export async function uploadPaymentProof(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading payment proof:", error)
    throw error
  }
}

// Submit payment proof
export async function submitPaymentProof(orderId: string, paymentProofUrl: string): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId)
    await updateDoc(orderRef, {
      paymentProofUrl,
      paymentStatus: "pending", // Set to pending for admin review
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error(`Error submitting payment proof for order ID ${orderId}:`, error)
    throw error
  }
}

// Get all orders for admin
export async function getOrdersForAdmin(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, orderBy("orderDate", "desc"))

    const querySnapshot = await getDocs(q)
    const orders: Order[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const orderData = docSnapshot.data()
      const orderId = docSnapshot.id // Usar el ID del documento de Firestore

      try {
        // Get user info
        const userDocRef = doc(db, "users", orderData.userId)
        const userDoc = await getDoc(userDocRef)
        const user = userDoc.exists() ? (userDoc.data() as User) : null

        // Get order items
        const itemsQuery = query(collection(db, "orderItems"), where("orderId", "==", orderId))
        const itemsSnapshot = await getDocs(itemsQuery)
        const orderItems = await Promise.all(
          itemsSnapshot.docs.map(async (docSnapshot) => {
            const itemData = docSnapshot.data()

            // Get product info for each item
            let product = null
            if (itemData.productId) {
              const productDocRef = doc(db, "products", itemData.productId)
              const productSnapshot = await getDoc(productDocRef)
              product = productSnapshot.exists() ? (productSnapshot.data() as Product) : null
            }

            return {
              id: docSnapshot.id,
              ...itemData,
              product,
            } as OrderItem & { product: Product | null }
          }),
        )

        // Importante: Usar el ID del documento como id de la orden
        orders.push({
          id: orderId,
          ...orderData,
          orderDate:
            orderData.orderDate && typeof orderData.orderDate.toDate === "function"
              ? orderData.orderDate.toDate()
              : new Date(orderData.orderDate || Date.now()),
          updatedAt:
            orderData.updatedAt && typeof orderData.updatedAt.toDate === "function"
              ? orderData.updatedAt.toDate()
              : new Date(orderData.updatedAt || Date.now()),
          expectedDeliveryDate:
            orderData.expectedDeliveryDate && typeof orderData.expectedDeliveryDate.toDate === "function"
              ? orderData.expectedDeliveryDate.toDate()
              : orderData.expectedDeliveryDate
                ? new Date(orderData.expectedDeliveryDate)
                : undefined,
          reviewedAt:
            orderData.reviewedAt && typeof orderData.reviewedAt.toDate === "function"
              ? orderData.reviewedAt.toDate()
              : orderData.reviewedAt
                ? new Date(orderData.reviewedAt)
                : undefined,
          orderItems,
          user,
        } as Order & { user: User | null })
      } catch (err) {
        console.error(`Error processing order ${orderId}:`, err)
        // Skip this order if there was an error
        continue
      }
    }

    return orders
  } catch (error) {
    console.error("Error fetching orders for admin:", error)
    return []
  }
}

// Get pending orders for admin
export async function getPendingOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, where("paymentStatus", "==", "pending"), orderBy("orderDate", "desc"))

    const querySnapshot = await getDocs(q)
    const orders: Order[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const orderData = docSnapshot.data()
      const orderId = docSnapshot.id // Usar el ID del documento de Firestore

      try {
        // Get user info
        const userDocRef = doc(db, "users", orderData.userId)
        const userDoc = await getDoc(userDocRef)
        const user = userDoc.exists() ? (userDoc.data() as User) : null

        // Get order items
        const itemsQuery = query(collection(db, "orderItems"), where("orderId", "==", orderId))
        const itemsSnapshot = await getDocs(itemsQuery)
        const orderItems = itemsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OrderItem)

        // Importante: Usar el ID del documento como id de la orden
        orders.push({
          id: orderId,
          ...orderData,
          orderDate:
            orderData.orderDate && typeof orderData.orderDate.toDate === "function"
              ? orderData.orderDate.toDate()
              : new Date(orderData.orderDate || Date.now()),
          updatedAt:
            orderData.updatedAt && typeof orderData.updatedAt.toDate === "function"
              ? orderData.updatedAt.toDate()
              : new Date(orderData.updatedAt || Date.now()),
          expectedDeliveryDate:
            orderData.expectedDeliveryDate && typeof orderData.expectedDeliveryDate.toDate === "function"
              ? orderData.expectedDeliveryDate.toDate()
              : orderData.expectedDeliveryDate
                ? new Date(orderData.expectedDeliveryDate)
                : undefined,
          orderItems,
          user,
        } as Order & { user: User | null })
      } catch (err) {
        console.error(`Error processing order ${orderId}:`, err)
        // Skip this order if there was an error
        continue
      }
    }

    return orders
  } catch (error) {
    console.error("Error fetching pending orders:", error)
    return []
  }
}
