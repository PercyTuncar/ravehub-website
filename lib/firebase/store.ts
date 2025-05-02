import { db, storage } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { Product, ProductCategory, Order } from "@/types"

// Products
export async function getProducts() {
  const productsRef = collection(db, "products")
  const snapshot = await getDocs(productsRef)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[]
}

export async function getProductById(id: string) {
  const docRef = doc(db, "products", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Product
  }

  return null
}

export async function getProductBySlug(slug: string) {
  const productsRef = collection(db, "products")
  const q = query(productsRef, where("slug", "==", slug), limit(1))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    } as Product
  }

  return null
}

export async function createProduct(product: Omit<Product, "id">) {
  const productsRef = collection(db, "products")
  const docRef = await addDoc(productsRef, {
    ...product,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const docRef = doc(db, "products", id)
  await updateDoc(docRef, {
    ...product,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(id: string) {
  const docRef = doc(db, "products", id)
  await deleteDoc(docRef)
}

// Categories
export async function getCategories() {
  const categoriesRef = collection(db, "productCategories")
  const snapshot = await getDocs(categoriesRef)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProductCategory[]
}

export async function getCategoryById(id: string) {
  const docRef = doc(db, "productCategories", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ProductCategory
  }

  return null
}

export async function getCategoryBySlug(slug: string) {
  const categoriesRef = collection(db, "productCategories")
  const q = query(categoriesRef, where("slug", "==", slug), limit(1))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    } as ProductCategory
  }

  return null
}

export async function createCategory(category: Omit<ProductCategory, "id">) {
  const categoriesRef = collection(db, "productCategories")
  const docRef = await addDoc(categoriesRef, {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function updateCategory(id: string, category: Partial<ProductCategory>) {
  const docRef = doc(db, "productCategories", id)
  await updateDoc(docRef, {
    ...category,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCategory(id: string) {
  const docRef = doc(db, "productCategories", id)
  await deleteDoc(docRef)
}

// Orders
export async function getOrders() {
  const ordersRef = collection(db, "orders")
  const q = query(ordersRef, orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Order[]
}

export async function getOrderById(id: string) {
  const docRef = doc(db, "orders", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Order
  }

  return null
}

export async function createOrder(order: Omit<Order, "id">) {
  const ordersRef = collection(db, "orders")
  const docRef = await addDoc(ordersRef, {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Update product stock
  for (const item of order.items) {
    const productRef = doc(db, "products", item.id)
    const productSnap = await getDoc(productRef)

    if (productSnap.exists()) {
      const product = productSnap.data() as Product
      const newStock = Math.max(0, product.stock - item.quantity)

      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp(),
      })
    }
  }

  return docRef.id
}

export async function updateOrder(id: string, order: Partial<Order>) {
  const docRef = doc(db, "orders", id)
  await updateDoc(docRef, {
    ...order,
    updatedAt: serverTimestamp(),
  })
}

// File uploads
export async function uploadProductImage(file: File) {
  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}

export async function deleteProductImage(url: string) {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting image:", error)
  }
}
