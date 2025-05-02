import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

// Función para obtener solo los campos necesarios para el sitemap
export async function getOptimizedSitemapData() {
  try {
    // Consultas optimizadas para cada colección
    const eventsQuery = query(
      collection(db, "events"),
      where("status", "==", "published"),
      orderBy("updatedAt", "desc"),
    )

    const postsQuery = query(collection(db, "blog"), where("status", "==", "published"), orderBy("updatedDate", "desc"))

    const productsQuery = query(collection(db, "products"), where("isActive", "==", true), orderBy("updatedAt", "desc"))

    const albumsQuery = query(collection(db, "albums"), orderBy("updatedAt", "desc"))

    const blogCategoriesQuery = query(collection(db, "blogCategories"), where("isActive", "==", true))

    const productCategoriesQuery = query(collection(db, "productCategories"), where("isActive", "==", true))

    // Ejecutar todas las consultas en paralelo
    const [
      eventsSnapshot,
      postsSnapshot,
      productsSnapshot,
      albumsSnapshot,
      blogCategoriesSnapshot,
      productCategoriesSnapshot,
    ] = await Promise.all([
      getDocs(eventsQuery),
      getDocs(postsQuery),
      getDocs(productsQuery),
      getDocs(albumsQuery),
      getDocs(blogCategoriesQuery),
      getDocs(productCategoriesQuery),
    ])

    // Procesar los resultados
    const events = eventsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        slug: data.slug,
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      }
    })

    const posts = postsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        slug: data.slug,
        updatedDate: data.updatedDate?.toDate?.() || new Date(data.updatedDate),
        publishDate: data.publishDate?.toDate?.() || new Date(data.publishDate || Date.now()),
      }
    })

    const products = productsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        slug: data.slug,
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      }
    })

    const albums = albumsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        slug: data.slug,
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      }
    })

    const blogCategories = blogCategoriesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        slug: data.slug,
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      }
    })

    const productCategories = productCategoriesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        slug: data.slug,
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      }
    })

    return {
      events,
      posts,
      products,
      albums,
      blogCategories,
      productCategories,
    }
  } catch (error) {
    console.error("Error obteniendo datos para el sitemap:", error)
    throw error
  }
}
