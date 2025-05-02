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
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import type { StoreBanner } from "@/types"

// Obtener todos los banners ordenados por el campo order
export async function getStoreBanners() {
  const bannersRef = collection(db, "storeBanners")
  const q = query(bannersRef, orderBy("order", "asc"))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as StoreBanner[]
}

// Obtener solo los banners activos para mostrar en la tienda
export async function getActiveStoreBanners() {
  const bannersRef = collection(db, "storeBanners")
  const q = query(bannersRef, orderBy("order", "asc"))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((banner) => banner.isActive) as StoreBanner[]
}

// Obtener un banner por su ID
export async function getStoreBannerById(id: string) {
  const docRef = doc(db, "storeBanners", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as StoreBanner
  }

  return null
}

// Crear un nuevo banner
export async function createStoreBanner(banner: Omit<StoreBanner, "id" | "createdAt" | "updatedAt">) {
  const bannersRef = collection(db, "storeBanners")
  const docRef = await addDoc(bannersRef, {
    ...banner,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

// Actualizar un banner existente
export async function updateStoreBanner(id: string, banner: Partial<StoreBanner>) {
  const docRef = doc(db, "storeBanners", id)
  await updateDoc(docRef, {
    ...banner,
    updatedAt: serverTimestamp(),
  })
}

// Eliminar un banner
export async function deleteStoreBanner(id: string) {
  const docRef = doc(db, "storeBanners", id)
  await deleteDoc(docRef)
}

// Subir una imagen para un banner
export async function uploadBannerImage(file: File) {
  const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}

// Eliminar una imagen de banner
export async function deleteBannerImage(url: string) {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting banner image:", error)
  }
}

// Actualizar el orden de los banners
export async function updateBannersOrder(banners: { id: string; order: number }[]) {
  const batch = db.batch()

  banners.forEach((banner) => {
    const docRef = doc(db, "storeBanners", banner.id)
    batch.update(docRef, { order: banner.order, updatedAt: serverTimestamp() })
  })

  await batch.commit()
}
