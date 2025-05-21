import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  startAfter,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"
// Importar el tipo Event
import type {
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogRating,
  PostReaction,
  PostReactionsDetail,
  CommentReaction,
} from "@/types"
import type { ReactionType } from "@/types/blog"
import { generateSlug } from "@/lib/utils"
import { filterBlobUrls, cleanAltTexts } from "@/lib/firebase/image-utils"
import { getFirestore, limit as firestoreLimit } from "firebase/firestore"

// Importar las constantes centralizadas
import { VALID_REACTION_TYPES, REACTION_TYPE_MAP } from "@/lib/constants/reaction-types"

// Añadir estas líneas al principio del archivo, después de las importaciones
declare global {
  var __POST_CACHE: Record<string, any> | undefined
  var __CATEGORY_CACHE: Record<string, any> | undefined
  var __TAG_CACHE: Record<string, any> | undefined
}

// Inicializar cachés globales si no existen
if (!globalThis.__POST_CACHE) globalThis.__POST_CACHE = {}
if (!globalThis.__CATEGORY_CACHE) globalThis.__CATEGORY_CACHE = {}
if (!globalThis.__TAG_CACHE) globalThis.__TAG_CACHE = {}

// Función para limpiar cachés antiguas (más de 5 minutos)
function cleanupCaches() {
  const now = Date.now()
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos en milisegundos

  Object.keys(globalThis.__POST_CACHE || {}).forEach((key) => {
    const entry = globalThis.__POST_CACHE?.[key]
    if (entry && entry.timestamp && now - entry.timestamp > CACHE_TTL) {
      delete globalThis.__POST_CACHE?.[key]
    }
  })

  Object.keys(globalThis.__CATEGORY_CACHE || {}).forEach((key) => {
    const entry = globalThis.__CATEGORY_CACHE?.[key]
    if (entry && entry.timestamp && now - entry.timestamp > CACHE_TTL) {
      delete globalThis.__CATEGORY_CACHE?.[key]
    }
  })

  Object.keys(globalThis.__TAG_CACHE || {}).forEach((key) => {
    const entry = globalThis.__TAG_CACHE?.[key]
    if (entry && entry.timestamp && now - entry.timestamp > CACHE_TTL) {
      delete globalThis.__TAG_CACHE?.[key]
    }
  })
}

// Ejecutar limpieza de caché cada 5 minutos
setInterval(cleanupCaches, 5 * 60 * 1000)

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

// Helper function to convert Firestore Timestamp to Date
function convertTimestamps(data: any): any {
  if (!data) return data

  const result = { ...data }

  // Convert Timestamp fields to Date
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate()
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = convertTimestamps(result[key])
    }
  }

  return result
}

/**
 * Obtiene todos los posts para administración
 * @returns {Promise<BlogPost[]>} Lista de posts
 */
export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  try {
    const postsRef = collection(db, "blog")
    const q = query(postsRef, orderBy("updatedAt", "desc"))
    const querySnapshot = await getDocs(q)

    const posts: BlogPost[] = []
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
      } as BlogPost)
    })

    return posts
  } catch (error) {
    console.error("Error al obtener todos los posts:", error)
    throw new Error("No se pudieron cargar los artículos")
  }
}

// Función para obtener todos los posts (con paginación)
export async function getAllPosts(page = 1, pageSize = 9, categoryId?: string, tagName?: string, sortOrder = "recent") {
  try {
    console.log("getAllPosts called with:", { page, pageSize, categoryId, tagName, sortOrder })

    // Crear una clave de caché basada en los parámetros
    const cacheKey = `posts_${page}_${pageSize}_${categoryId || ""}_${tagName || ""}_${sortOrder}`

    // Verificar si tenemos una caché global
    if (globalThis.__POST_CACHE && globalThis.__POST_CACHE[cacheKey]) {
      const cachedEntry = globalThis.__POST_CACHE[cacheKey]
      const now = Date.now()

      // Usar caché si tiene menos de 1 minuto
      if (now - cachedEntry.timestamp < 60000) {
        console.log("Using cached posts data")
        return cachedEntry.data
      }
    }

    const postsRef = collection(db, "blog")

    // Determinar el campo y dirección de ordenamiento
    let sortField = "publishDate"
    let sortDirection: "asc" | "desc" = "desc"

    if (sortOrder === "popular") {
      sortField = "viewCount"
      sortDirection = "desc"
    } else if (sortOrder === "oldest") {
      sortField = "publishDate"
      sortDirection = "asc"
    }

    let q = query(postsRef, where("status", "==", "published"), orderBy(sortField, sortDirection))

    // Filtrar por categoría si se proporciona un categoryId
    if (categoryId) {
      q = query(
        postsRef,
        where("status", "==", "published"),
        where("categories", "array-contains", categoryId),
        orderBy(sortField, sortDirection),
      )
    }

    console.log("Executing Firestore query...")
    const querySnapshot = await getDocs(q)
    console.log(`Query returned ${querySnapshot.size} documents`)

    const allPosts: BlogPost[] = []
    querySnapshot.forEach((doc) => {
      const postData = doc.data()
      // Convertir las fechas de string a objetos Date
      const post: BlogPost = {
        id: doc.id,
        ...postData,
      }

      // Filtrar por tag si se proporciona un nombre de etiqueta
      if (tagName) {
        if (post.tags && post.tags.includes(tagName)) {
          allPosts.push(post)
        }
      } else {
        allPosts.push(post)
      }
    })

    // Calcular los índices para la paginación
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    // Obtener los posts para la página actual
    const paginatedPosts = allPosts.slice(startIndex, endIndex)

    // Determinar si hay más posts para cargar
    const hasMore = endIndex < allPosts.length

    // Para simular el lastVisible que se usaría con startAfter en una consulta real
    const lastVisible = hasMore ? allPosts[endIndex - 1].id : null

    const result = {
      posts: paginatedPosts,
      lastVisible,
      hasMore,
    }

    // Guardar en caché global
    if (!globalThis.__POST_CACHE) {
      globalThis.__POST_CACHE = {}
    }

    globalThis.__POST_CACHE[cacheKey] = {
      data: result,
      timestamp: Date.now(),
    }

    return result
  } catch (error) {
    console.error("Error al obtener los posts:", error)
    return {
      posts: [],
      lastVisible: null,
      hasMore: false,
    }
  }
}

// Función para obtener todos los posts para la gestión administrativa (sin paginación)
export async function getPostsForAdmin() {
  try {
    const postsRef = collection(db, "blog")
    const q = query(postsRef, orderBy("updatedAt", "desc"))
    const querySnapshot = await getDocs(q)

    const posts: BlogPost[] = []
    querySnapshot.forEach((doc) => {
      const postData = doc.data()
      posts.push({
        id: doc.id,
        ...postData,
      })
    })

    return posts
  } catch (error) {
    console.error("Error al obtener los posts para administración:", error)
    return []
  }
}

// Get featured posts for homepage
export async function getFeaturedPosts(limitCount = 3): Promise<BlogPost[]> {
  try {
    const postsRef = collection(db, "blog") // Cambiado de 'blogPosts' a 'blog'
    const q = query(
      postsRef,
      where("status", "==", "published"),
      where("isFeatured", "==", true),
      orderBy("publishDate", "desc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    const posts: BlogPost[] = []

    querySnapshot.forEach((doc) => {
      const postData = doc.data()
      posts.push({ id: doc.id, ...postData } as BlogPost)
    })

    return posts
  } catch (error) {
    console.error("Error fetching featured posts:", error)
    return []
  }
}

// Get recent posts
export async function getRecentPosts(limitCount = 5, excludeId?: string): Promise<BlogPost[]> {
  try {
    const postsRef = collection(db, "blog")
    const q = query(postsRef, where("status", "==", "published"), orderBy("publishDate", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    const posts: BlogPost[] = []

    querySnapshot.forEach((doc) => {
      if (!excludeId || doc.id !== excludeId) {
        const postData = convertTimestamps(doc.data())
        posts.push({ id: doc.id, ...postData } as BlogPost)
      }
    })

    return posts
  } catch (error) {
    console.error("Error fetching recent posts:", error)
    return []
  }
}

// Get popular posts
export async function getPopularPosts(limitCount = 5, excludeId?: string): Promise<BlogPost[]> {
  try {
    const postsRef = collection(db, "blog")
    const q = query(
      postsRef,
      where("status", "==", "published"),
      orderBy("viewCount", "desc"),
      limit(limitCount + (excludeId ? 1 : 0)),
    )

    const querySnapshot = await getDocs(q)
    const posts: BlogPost[] = []

    querySnapshot.forEach((doc) => {
      if (!excludeId || doc.id !== excludeId) {
        const postData = convertTimestamps(doc.data())
        posts.push({ id: doc.id, ...postData } as BlogPost)
      }
    })

    return posts.slice(0, limitCount)
  } catch (error) {
    console.error("Error fetching popular posts:", error)
    return []
  }
}

// Modificar la función getAllPosts para soportar ordenamiento
// export async function getAllPosts(
//   page = 1,
//   pageSize = 10,
//   lastVisible?: any,
//   sortOrder = "recent",
// ): Promise<{ posts: BlogPost[]; lastVisible: any; hasMore: boolean }> {
//   try {
//     const postsRef = collection(db, "blog")
//     let q

//     // Determine sort field and direction
//     let sortField = "publishDate"
//     let sortDirection: "asc" | "desc" = "desc"

//     if (sortOrder === "popular") {
//       sortField = "viewCount"
//       sortDirection = "desc"
//     } else if (sortOrder === "oldest") {
//       sortField = "publishDate"
//       sortDirection = "asc"
//     }

//     if (lastVisible) {
//       q = query(
//         postsRef,
//         where("status", "==", "published"),
//         orderBy(sortField, sortDirection),
//         startAfter(lastVisible),
//         limit(pageSize),
//       )
//     } else {
//       q = query(postsRef, where("status", "==", "published"), orderBy(sortField, sortDirection), limit(pageSize))
//     }

//     const querySnapshot = await getDocs(q)
//     const posts: BlogPost[] = []

//     querySnapshot.forEach((doc) => {
//       const postData = convertTimestamps(doc.data())
//       posts.push({ id: doc.id, ...postData } as BlogPost)
//     })

//     // Get the last document for pagination
//     const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]

//     // Check if there are more posts
//     const hasMore = querySnapshot.docs.length === pageSize

//     return { posts, lastVisible: lastDoc, hasMore }
//   } catch (error) {
//     console.error("Error fetching posts:", error)
//     return { posts: [], lastVisible: null, hasMore: false }
//   }
// }

// Modificar la función getPostsByCategory para soportar ordenamiento
export async function getPostsByCategory(
  categoryId: string,
  page = 1,
  pageSize = 10,
  lastVisible?: any,
  sortOrder = "recent",
): Promise<{ posts: BlogPost[]; lastVisible: any; hasMore: boolean }> {
  try {
    const postsRef = collection(db, "blog")
    let q

    // Determine sort field and direction
    let sortField = "publishDate"
    let sortDirection: "asc" | "desc" = "desc"

    if (sortOrder === "popular") {
      sortField = "viewCount"
      sortDirection = "desc"
    } else if (sortOrder === "oldest") {
      sortField = "publishDate"
      sortDirection = "asc"
    }

    if (lastVisible) {
      q = query(
        postsRef,
        where("status", "==", "published"),
        where("categoryId", "==", categoryId),
        orderBy(sortField, sortDirection),
        startAfter(lastVisible),
        limit(pageSize),
      )
    } else {
      q = query(
        postsRef,
        where("status", "==", "published"),
        where("categoryId", "==", categoryId),
        orderBy(sortField, sortDirection),
        limit(pageSize),
      )
    }

    const querySnapshot = await getDocs(q)
    const posts: BlogPost[] = []

    querySnapshot.forEach((doc) => {
      const postData = convertTimestamps(doc.data())
      posts.push({ id: doc.id, ...postData } as BlogPost)
    })

    // Get the last document for pagination
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]

    // Check if there are more posts
    const hasMore = querySnapshot.docs.length === pageSize

    return { posts, lastVisible: lastDoc, hasMore }
  } catch (error) {
    console.error(`Error fetching posts for category ${categoryId}:`, error)
    return { posts: [], lastVisible: null, hasMore: false }
  }
}

// Modificar la función getPostsByTag para mejorar el manejo de errores
// Find the getPostsByTag function and replace it with this improved version that looks for tag ID in the tags array objects

export async function getPostsByTag(
  tagId: string,
  page = 1,
  pageSize = 10,
  lastVisible?: any,
  sortOrder = "recent",
): Promise<{ posts: BlogPost[]; lastVisible: any; hasMore: boolean }> {
  try {
    if (!tagId) {
      console.error("No tagId provided to getPostsByTag")
      return { posts: [], lastVisible: null, hasMore: false }
    }

    console.log(`Buscando posts con tagId: ${tagId}`)
    const postsRef = collection(db, "blog")

    // Fetch all published posts since we can't directly query for objects in arrays with specific field values
    const q = query(postsRef, where("status", "==", "published"), orderBy("publishDate", "desc"))

    const querySnapshot = await getDocs(q)
    console.log(`Query devolvió ${querySnapshot.size} documentos totales`)

    // Filter posts that contain the tag ID in their tags array
    const allFilteredPosts: BlogPost[] = []

    querySnapshot.forEach((doc) => {
      const postData = doc.data() as BlogPost

      // Check if the post has tags and if any tag has the matching ID
      if (postData.tags && Array.isArray(postData.tags)) {
        const hasTag = postData.tags.some((tag) => {
          // Handle both string tag IDs and object tags with IDs
          if (typeof tag === "string") {
            return tag === tagId
          } else if (typeof tag === "object" && tag !== null) {
            return tag.id === tagId
          }
          return false
        })

        if (hasTag) {
          allFilteredPosts.push({ id: doc.id, ...postData })
        }
      }
    })

    console.log(`Filtered ${allFilteredPosts.length} posts with tagId: ${tagId}`)

    // Sort posts based on sortOrder parameter
    const sortedPosts = [...allFilteredPosts]
    if (sortOrder === "popular") {
      sortedPosts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    } else if (sortOrder === "oldest") {
      sortedPosts.sort((a, b) => {
        const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0
        const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0
        return dateA - dateB
      })
    }
    // Default is "recent" which is already sorted by publishDate desc

    // Calculate pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedPosts = sortedPosts.slice(startIndex, endIndex)
    const hasMore = endIndex < sortedPosts.length

    return {
      posts: paginatedPosts,
      lastVisible: hasMore ? sortedPosts[endIndex - 1] : null,
      hasMore,
    }
  } catch (error) {
    console.error(`Error fetching posts for tag ${tagId}:`, error)
    return { posts: [], lastVisible: null, hasMore: false }
  }
}

// Buscar la función getPostBySlug y reemplazarla con esta versión optimizada
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    if (!slug) {
      console.error("No slug provided to getPostBySlug")
      return null
    }

    // Usar caché si está disponible y no ha expirado
    const cacheKey = `post_${slug}`
    const cachedEntry = globalThis.__POST_CACHE?.[cacheKey]
    const now = Date.now()

    // Si hay una entrada en caché y no ha expirado (5 minutos)
    if (cachedEntry && now - cachedEntry.timestamp < 5 * 60 * 1000) {
      console.log(`Using cached post for slug: ${slug}`)
      return cachedEntry.data
    }

    console.log(`Buscando post con slug: ${slug}`)
    const postsRef = collection(db, "blog")
    const q = query(postsRef, where("slug", "==", slug))

    const querySnapshot = await getDocs(q)
    console.log(`Query devolvió ${querySnapshot.size} documentos`)

    if (querySnapshot.empty) {
      console.log(`No post found with slug: ${slug}`)
      return null
    }

    // Get document data
    const docData = querySnapshot.docs[0].data()
    const postId = querySnapshot.docs[0].id
    console.log(`Post encontrado con ID: ${postId}`)

    // Increment view count (hacer esto en segundo plano)
    try {
      // Usar setTimeout para no bloquear la respuesta
      setTimeout(() => {
        updateDoc(doc(db, "blog", postId), {
          viewCount: increment(1),
        }).catch((err) => console.error(`Error incrementando vistas: ${err}`))
      }, 100)
    } catch (updateError) {
      console.error(`Error al incrementar las vistas: ${updateError}`)
      // Continuamos aunque falle la actualización de vistas
    }

    // Fetch category data
    let category = null
    if (docData.categoryId) {
      try {
        const categoryDoc = await getCategoryById(docData.categoryId)
        category = categoryDoc
      } catch (e) {
        console.error("Failed to fetch category", e)
      }
    }

    const post = {
      id: postId,
      ...docData,
      category,
      averageRating: docData.averageRating || 0,
      ratingCount: docData.ratingCount || 0,
    } as BlogPost

    // Guardar en caché con timestamp
    if (!globalThis.__POST_CACHE) {
      globalThis.__POST_CACHE = {}
    }
    globalThis.__POST_CACHE[cacheKey] = {
      data: post,
      timestamp: now,
    }

    return post
  } catch (error) {
    console.error(`Error fetching post with slug ${slug}:`, error)
    return null
  }
}

// Get post by ID
export async function getPostById(id: string): Promise<BlogPost | null> {
  try {
    const postDoc = await getDoc(doc(db, "blog", id)) // Cambiado de "blogPosts" a "blog"

    if (!postDoc.exists()) {
      return null
    }

    const postData = postDoc.data()
    return { id: postDoc.id, ...postData } as BlogPost
  } catch (error) {
    console.error(`Error fetching post with ID ${id}:`, error)
    return null
  }
}

// Create a new post
export async function createPost(postData: Omit<BlogPost, "id">): Promise<string> {
  try {
    // Add server timestamp and remove undefined values
    const postWithTimestamp = removeUndefinedValues({
      ...postData,
      publishDate: postData.publishDate || new Date(),
      updatedDate: new Date(),
      viewCount: 0,
      imageGallery: filterBlobUrls(postData.imageGallery),
      imageAltTexts: cleanAltTexts(postData.imageAltTexts),
    })

    const docRef = await addDoc(collection(db, "blog"), postWithTimestamp)
    return docRef.id
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}

// Actualizar la función updatePost para manejar redirecciones de slug
// Buscar la función updatePost y reemplazarla con esta versión mejorada

// Update an existing post
export async function updatePost(id: string, postData: Partial<BlogPost>): Promise<void> {
  try {
    const postRef = doc(db, "blog", id)

    // Verificar si el slug ha cambiado para crear una redirección
    if (postData.slug) {
      // Obtener el post actual para comparar slugs
      const currentPostDoc = await getDoc(postRef)

      if (currentPostDoc.exists()) {
        const currentPost = currentPostDoc.data()
        const oldSlug = currentPost.slug
        const newSlug = postData.slug

        // Si el slug ha cambiado, crear una redirección
        if (oldSlug && newSlug && oldSlug !== newSlug) {
          console.log(`Slug cambiado: ${oldSlug} -> ${newSlug}. Creando redirección...`)

          // Importar la función de redirección de forma dinámica para evitar dependencias circulares
          const { createSlugRedirect } = await import("@/lib/firebase/slug-redirects")
          await createSlugRedirect(oldSlug, newSlug)
        }
      }
    }

    // Add server timestamp for update and remove undefined values
    const postWithTimestamp = removeUndefinedValues({
      ...postData,
      updatedDate: new Date(),
      imageGallery: filterBlobUrls(postData.imageGallery),
      imageAltTexts: cleanAltTexts(postData.imageAltTexts),
    })

    await updateDoc(postRef, postWithTimestamp)
  } catch (error) {
    console.error(`Error updating post with ID ${id}:`, error)
    throw error
  }
}

// Delete a post
export async function deletePost(id: string): Promise<void> {
  try {
    const postRef = doc(db, "blog", id)
    await deleteDoc(postRef)
  } catch (error) {
    console.error(`Error deleting post with ID ${id}:`, error)
    throw error
  }
}

// Añadir la siguiente función después de la función deletePost y antes de deletePostWithImages

// Upload blog image
export async function uploadBlogImage(file: File): Promise<{ imageUrl: string } | null> {
  try {
    if (!file) {
      console.error("No file provided for upload")
      return null
    }

    // Importar lo necesario de Firebase Storage
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
    const storage = getStorage()

    // Crear una referencia única para la imagen
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `blog-images/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

    // Crear referencia al storage
    const storageRef = ref(storage, fileName)

    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file)

    // Obtener la URL de descarga
    const imageUrl = await getDownloadURL(snapshot.ref)

    return { imageUrl }
  } catch (error) {
    console.error("Error uploading blog image:", error)
    return null
  }
}

// Función para eliminar un post
export async function deletePostWithImages(postId: string) {
  try {
    // Primero obtener el post para ver si tiene imágenes que eliminar
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (postDoc.exists()) {
      const postData = postDoc.data()

      // Lista de URLs de imagen que podrían necesitar ser eliminadas
      const imageUrls = []
      if (postData.featuredImage) imageUrls.push(postData.featuredImage)
      if (postData.seo?.ogImage) imageUrls.push(postData.seo.ogImage)

      // Eliminar el documento de Firestore
      await deleteDoc(postRef)

      // Eliminar imágenes relacionadas de Storage
      // Nota: Esto es complicado porque las URLs no contienen directamente la ruta en Storage
      // Para una implementación completa, deberíamos almacenar la ruta del storage con cada imagen

      return true
    } else {
      throw new Error("Post no encontrado")
    }
  } catch (error) {
    console.error("Error al eliminar el post:", error)
    throw error
  }
}

// Get related posts
export async function getRelatedPosts(
  currentPostId: string,
  categoryId: string,
  tags: string[] = [],
  limitCount = 3,
): Promise<BlogPost[]> {
  try {
    const db = getFirestore()
    const postsRef = collection(db, "blog")
    const relatedPosts: BlogPost[] = []

    // Consulta base: posts publicados que no sean el actual
    const baseQuery = query(
      postsRef,
      where("status", "==", "published"),
      orderBy("publishDate", "desc"),
      firestoreLimit(limitCount * 3), // Obtenemos más para filtrar después
    )

    const querySnapshot = await getDocs(baseQuery)
    const allPosts: BlogPost[] = []

    querySnapshot.forEach((doc) => {
      const post = { id: doc.id, ...doc.data() } as BlogPost
      if (post.id !== currentPostId) {
        allPosts.push(post)
      }
    })

    // Filtrar por categoría (prioridad alta)
    if (categoryId) {
      const categoryPosts = allPosts.filter((post) => post.categoryId === categoryId)
      for (const post of categoryPosts) {
        if (relatedPosts.length < limitCount && !relatedPosts.some((p) => p.id === post.id)) {
          relatedPosts.push(post)
        }
      }
    }

    // Filtrar por tags (prioridad media)
    if (relatedPosts.length < limitCount && tags && tags.length > 0) {
      const tagPosts = allPosts.filter((post) => {
        if (!post.tags) return false
        return post.tags.some((tag) => {
          const tagName = typeof tag === "string" ? tag : tag.name
          return tags.some((t) => {
            const tName = typeof t === "string" ? t : t.name
            return tagName === tName
          })
        })
      })

      for (const post of tagPosts) {
        if (relatedPosts.length < limitCount && !relatedPosts.some((p) => p.id === post.id)) {
          relatedPosts.push(post)
        }
      }
    }

    // Añadir posts recientes si aún no tenemos suficientes (prioridad baja)
    if (relatedPosts.length < limitCount) {
      for (const post of allPosts) {
        if (relatedPosts.length < limitCount && !relatedPosts.some((p) => p.id === post.id)) {
          relatedPosts.push(post)
        }
      }
    }

    return relatedPosts.slice(0, limitCount)
  } catch (error) {
    console.error("Error fetching related posts for post", currentPostId, ":", error)
    return []
  }
}

// Get all blog categories
export async function getAllCategories(): Promise<BlogCategory[]> {
  try {
    const categoriesRef = collection(db, "blogCategories")
    const q = query(categoriesRef, where("isActive", "==", true), orderBy("order", "asc"))

    const querySnapshot = await getDocs(q)
    const categories: BlogCategory[] = []

    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as BlogCategory)
    })

    return categories
  } catch (error) {
    console.error("Error fetching blog categories:", error)
    return []
  }
}

// Modificar la función getTagBySlug para mejorar el manejo de errores y depuración
export async function getTagBySlug(slug: string): Promise<BlogTag | null> {
  try {
    if (!slug) {
      console.error("No slug provided to getTagBySlug")
      return null
    }

    // Usar caché si está disponible
    const cacheKey = `tag_${slug}`
    const cachedEntry = globalThis.__TAG_CACHE?.[cacheKey]
    const now = Date.now()

    if (cachedEntry && now - cachedEntry.timestamp < 5 * 60 * 1000) {
      console.log(`Using cached tag for slug: ${slug}`)
      return cachedEntry.data
    }

    console.log(`Buscando tag con slug: ${slug}`)
    const tagsRef = collection(db, "blogTags")
    const q = query(tagsRef, where("slug", "==", slug))

    const querySnapshot = await getDocs(q)
    console.log(`Query devolvió ${querySnapshot.size} documentos para tag`)

    if (querySnapshot.empty) {
      console.log(`No tag found with slug: ${slug}`)
      return null
    }

    const tagData = querySnapshot.docs[0].data()
    const tagId = querySnapshot.docs[0].id
    console.log(`Tag encontrado con ID: ${tagId}`)

    const tag = { id: tagId, ...tagData } as BlogTag

    // Guardar en caché
    if (!globalThis.__TAG_CACHE) {
      globalThis.__TAG_CACHE = {}
    }
    globalThis.__TAG_CACHE[cacheKey] = {
      data: tag,
      timestamp: now,
    }

    return tag
  } catch (error) {
    console.error(`Error fetching tag with slug ${slug}:`, error)
    return null
  }
}

// Get category by ID
export async function getCategoryById(id: string): Promise<BlogCategory | null> {
  try {
    const categoryDoc = await getDoc(doc(db, "blogCategories", id))

    if (!categoryDoc.exists()) {
      return null
    }

    return { id: categoryDoc.id, ...categoryDoc.data() } as BlogCategory
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error)
    return null
  }
}

// Asegurarse de que la función getCategoryBySlug existe y funciona correctamente

// Añadir o modificar la función getCategoryBySlug
export async function getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  try {
    if (!slug) {
      console.error("No slug provided to getCategoryBySlug")
      return null
    }

    // Usar caché si está disponible
    const cacheKey = `category_${slug}`
    const cachedEntry = globalThis.__CATEGORY_CACHE?.[cacheKey]
    const now = Date.now()

    if (cachedEntry && now - cachedEntry.timestamp < 5 * 60 * 1000) {
      console.log(`Using cached category for slug: ${slug}`)
      return cachedEntry.data
    }

    console.log(`Buscando categoría con slug: ${slug}`)
    const categoriesRef = collection(db, "blogCategories")
    const q = query(categoriesRef, where("slug", "==", slug))

    const querySnapshot = await getDocs(q)
    console.log(`Query devolvió ${querySnapshot.size} documentos para categoría`)

    if (querySnapshot.empty) {
      console.log(`No category found with slug: ${slug}`)
      return null
    }

    const categoryData = querySnapshot.docs[0].data()
    const categoryId = querySnapshot.docs[0].id
    console.log(`Categoría encontrada con ID: ${categoryId}`)

    const category = { id: categoryId, ...categoryData } as BlogCategory

    // Guardar en caché
    if (!globalThis.__CATEGORY_CACHE) {
      globalThis.__CATEGORY_CACHE = {}
    }
    globalThis.__CATEGORY_CACHE[cacheKey] = {
      data: category,
      timestamp: now,
    }

    return category
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error)
    return null
  }
}

// Create a new category
export async function createCategory(categoryData: Omit<BlogCategory, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "blogCategories"), removeUndefinedValues(categoryData))
    return docRef.id
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

// Update an existing category
export async function updateCategory(id: string, categoryData: Partial<BlogCategory>): Promise<void> {
  try {
    const categoryRef = doc(db, "blogCategories", id)
    await updateDoc(categoryRef, removeUndefinedValues(categoryData))
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error)
    throw error
  }
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
  try {
    const categoryRef = doc(db, "blogCategories", id)
    await deleteDoc(categoryRef)
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error)
    throw error
  }
}

// Get all tags
export async function getAllTags(): Promise<BlogTag[]> {
  try {
    const tagsRef = collection(db, "blogTags")
    const q = query(tagsRef, orderBy("name", "asc"))

    const querySnapshot = await getDocs(q)
    const tags: BlogTag[] = []

    querySnapshot.forEach((doc) => {
      tags.push({ id: doc.id, ...doc.data() } as BlogTag)
    })

    return tags
  } catch (error) {
    console.error("Error fetching blog tags:", error)
    return []
  }
}

// Create or update a tag
export async function createOrUpdateTag(name: string): Promise<string> {
  try {
    const slug = generateSlug(name)
    const tagsRef = collection(db, "blogTags")
    const q = query(tagsRef, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Tag already exists, update post count
      const tagId = querySnapshot.docs[0].id
      await updateDoc(doc(db, "blogTags", tagId), {
        postCount: increment(1),
      })
      return tagId
    } else {
      // Create new tag
      const newTag = {
        name,
        slug,
        postCount: 1,
      }
      const docRef = await addDoc(collection(db, "blogTags"), newTag)
      return docRef.id
    }
  } catch (error) {
    console.error(`Error creating or updating tag ${name}:`, error)
    throw error
  }
}

// Get comments for a post
export async function getComments(postId: string): Promise<BlogComment[]> {
  try {
    const commentsRef = collection(db, "blogComments")
    const q = query(commentsRef, where("postId", "==", postId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const comments: BlogComment[] = []

    querySnapshot.forEach((doc) => {
      const commentData = convertTimestamps(doc.data())
      comments.push({
        id: doc.id,
        ...commentData,
        likes: commentData.likes || 0,
        likedBy: commentData.likedBy || [],
      } as BlogComment)
    })

    return comments
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error)
    return []
  }
}

// Add a comment
export async function addComment(commentData: Omit<BlogComment, "id">): Promise<string> {
  try {
    const commentWithTimestamp = {
      ...commentData,
      createdAt: new Date(),
      isApproved: false, // All comments start as unapproved
    }

    const docRef = await addDoc(collection(db, "blogComments"), commentWithTimestamp)
    return docRef.id
  } catch (error) {
    console.error("Error adding comment:", error)
    throw error
  }
}

// Get unapproved comments
export async function getUnapprovedComments(): Promise<BlogComment[]> {
  try {
    const commentsRef = collection(db, "blogComments")
    const q = query(commentsRef, where("isApproved", "==", false), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const comments: BlogComment[] = []

    querySnapshot.forEach((doc) => {
      const commentData = convertTimestamps(doc.data())
      comments.push({ id: doc.id, ...commentData } as BlogComment)
    })

    return comments
  } catch (error) {
    console.error("Error fetching unapproved comments:", error)
    return []
  }
}

// Approve a comment
export async function approveComment(id: string, adminId: string): Promise<void> {
  try {
    const commentRef = doc(db, "blogComments", id)
    await updateDoc(commentRef, {
      isApproved: true,
      approvedBy: adminId,
      approvedAt: new Date(),
    })
  } catch (error) {
    console.error(`Error approving comment with ID ${id}:`, error)
    throw error
  }
}

// Delete a comment
export async function deleteComment(commentId: string): Promise<void> {
  try {
    // Option 1: Hard delete
    // await deleteDoc(doc(db, "blogComments", commentId))

    // Option 2: Soft delete (preferred to maintain thread integrity)
    await updateDoc(doc(db, "blogComments", commentId), {
      content: "[Comentario eliminado]",
      isDeleted: true,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error)
    throw error
  }
}

// Incrementar el contador de vistas de un post
export async function incrementPostView(postId: string): Promise<void> {
  try {
    const postRef = doc(db, "blog", postId)
    await updateDoc(postRef, {
      viewCount: increment(1),
    })
  } catch (error) {
    console.error(`Error incrementing view count for post ${postId}:`, error)
  }
}

// Obtener la calificación de un usuario para un post
export async function getUserRating(postId: string, userId: string): Promise<BlogRating | null> {
  try {
    // Check if postId or userId is undefined or empty
    if (!postId || !userId) {
      console.log(`Missing required parameters: postId=${postId}, userId=${userId}`)
      return null
    }

    const ratingsRef = collection(db, "blogRatings")
    const q = query(ratingsRef, where("postId", "==", postId), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const ratingDoc = querySnapshot.docs[0]
    return { id: ratingDoc.id, ...ratingDoc.data() } as BlogRating
  } catch (error) {
    console.error(`Error fetching user rating for post ${postId}:`, error)
    return null
  }
}

// Calificar un post
export async function ratePost(ratingData: Omit<BlogRating, "id">): Promise<string> {
  try {
    // Validar que los campos requeridos no sean undefined
    if (!ratingData.postId || !ratingData.userId) {
      throw new Error("postId and userId are required for rating a post")
    }

    // Check if user already rated this post
    const ratingsRef = collection(db, "blogRatings")
    const q = query(ratingsRef, where("postId", "==", ratingData.postId), where("userId", "==", ratingData.userId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Update existing rating
      const ratingDoc = querySnapshot.docs[0]
      await updateDoc(doc(db, "blogRatings", ratingDoc.id), {
        rating: ratingData.rating,
        comment: ratingData.comment,
        updatedAt: new Date(),
      })
      return ratingDoc.id
    } else {
      // Create new rating
      const docRef = await addDoc(collection(db, "blogRatings"), {
        ...ratingData,
        createdAt: ratingData.createdAt || new Date(),
      })
      return docRef.id
    }
  } catch (error) {
    console.error("Error rating post:", error)
    throw error
  }
}

// Actualizar la calificación promedio de un post
export async function updatePostRating(postId: string): Promise<{ averageRating: number; ratingCount: number }> {
  try {
    const ratingsRef = collection(db, "blogRatings")
    const q = query(ratingsRef, where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { averageRating: 0, ratingCount: 0 }
    }

    let totalRating = 0
    const ratingCount = querySnapshot.size

    querySnapshot.forEach((doc) => {
      const rating = doc.data().rating
      totalRating += rating
    })

    const averageRating = totalRating / ratingCount

    // Update post with new rating data
    const postRef = doc(db, "blog", postId)
    await updateDoc(postRef, {
      averageRating,
      ratingCount,
    })

    return { averageRating, ratingCount }
  } catch (error) {
    console.error(`Error updating post rating for ${postId}:`, error)
    throw error
  }
}

// Dar like a un comentario
export async function likeComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, "blogComments", commentId)
    const commentDoc = await getDoc(commentRef)

    if (!commentDoc.exists()) {
      throw new Error("Comment not found")
    }

    const commentData = commentDoc.data()
    const likedBy = commentData.likedBy || []

    if (!likedBy.includes(userId)) {
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: [...likedBy, userId],
      })
    }
  } catch (error) {
    console.error(`Error liking comment ${commentId}:`, error)
    throw error
  }
}

// Quitar like de un comentario
export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, "blogComments", commentId)
    const commentDoc = await getDoc(commentRef)

    if (!commentDoc.exists()) {
      throw new Error("Comment not found")
    }

    const commentData = commentDoc.data()
    const likedBy = commentData.likedBy || []

    if (likedBy.includes(userId)) {
      await updateDoc(commentRef, {
        likes: increment(-1),
        likedBy: likedBy.filter((id) => id !== userId),
      })
    }
  } catch (error) {
    console.error(`Error unliking comment ${commentId}:`, error)
    throw error
  }
}

// Editar un comentario
export async function editComment(commentId: string, content: string): Promise<void> {
  try {
    const commentRef = doc(db, "blogComments", commentId)
    await updateDoc(commentRef, {
      content,
      updatedAt: new Date(),
      isEdited: true,
    })
  } catch (error) {
    console.error(`Error editing comment ${commentId}:`, error)
    throw error
  }
}

// NUEVAS FUNCIONES PARA EL SISTEMA DE REACCIONES

// Obtener todas las reacciones de un post
export async function getPostReactions(postId: string): Promise<PostReactionsDetail> {
  try {
    // Definición de tipos de reacciones válidos para normalización
    const validReactionTypes = VALID_REACTION_TYPES

    // Mapa para normalizar los tipos de reacciones
    const reactionTypeMap = REACTION_TYPE_MAP

    // Primero, obtener el documento del post para verificar si tiene el campo reactions
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      console.error(`Post no encontrado con ID: ${postId}`)
      return {
        summary: {
          total: 0,
          types: {},
          topReactions: [],
        },
        reactions: [],
      }
    }

    const postData = postDoc.data()
    const postReactions = postData.reactions || { total: 0, types: {} }

    // Obtener las reacciones individuales de la colección blogReactions
    const reactionsRef = collection(db, "blogReactions")
    const q = query(reactionsRef, where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    const reactions: PostReaction[] = []
    const reactionCounts: Record<string, number> = {}

    // Procesar las reacciones individuales y normalizar los tipos
    querySnapshot.forEach((doc) => {
      const reactionData = convertTimestamps(doc.data())

      // Normalizar el tipo de reacción
      let normalizedType = reactionTypeMap[reactionData.reactionType] || reactionData.reactionType

      // Asegurarse de que el tipo normalizado es válido, si no, usar 'like' como fallback
      if (!validReactionTypes.includes(normalizedType as ReactionType)) {
        console.warn(`Tipo de reacción desconocido: ${reactionData.reactionType}, normalizando a 'like'`)
        normalizedType = "like"
      }

      // Actualizar el tipo de reacción normalizado
      reactionData.reactionType = normalizedType

      const reaction = { id: doc.id, ...reactionData } as PostReaction
      reactions.push(reaction)

      // Contar por tipo de reacción normalizado
      reactionCounts[normalizedType] = (reactionCounts[normalizedType] || 0) + 1
    })

    // Calcular el total real de reacciones
    const totalFromReactions = reactions.length

    // Verificar si hay discrepancia entre el contador del post y las reacciones reales
    const totalFromPost = postReactions.total || 0
    const typesFromPost = postReactions.types || {}

    // Verificar si hay inconsistencias en los tipos de reacciones
    let needsUpdate = totalFromReactions !== totalFromPost

    // Comprobar si los tipos y conteos coinciden
    const normalizedTypes = Object.keys(reactionCounts)
    for (const type of normalizedTypes) {
      if (reactionCounts[type] !== (typesFromPost[type] || 0)) {
        needsUpdate = true
        break
      }
    }

    // Si hay discrepancia, actualizar el contador en el post
    if (needsUpdate) {
      console.log(`Discrepancia detectada en reacciones para post ${postId}: 
        Post tiene ${totalFromPost}, pero hay ${totalFromReactions} reacciones reales.
        Actualizando contador y normalizando tipos...`)

      // Actualizar el contador en el post con los datos normalizados
      await updateDoc(postRef, {
        reactions: {
          total: totalFromReactions,
          types: reactionCounts,
        },
      })

      // Usar los contadores reales normalizados
      postReactions.total = totalFromReactions
      postReactions.types = reactionCounts
    }

    // Obtener las 3 reacciones más populares
    const topReactions = Object.entries(reactionCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([type]) => type as ReactionType)

    return {
      summary: {
        total: totalFromReactions,
        types: reactionCounts,
        topReactions,
      },
      reactions,
    }
  } catch (error) {
    console.error(`Error fetching reactions for post ${postId}:`, error)
    // Lanzar el error para que el componente pueda manejarlo adecuadamente
    throw new Error(`No se pudieron cargar las reacciones: ${error.message}`)
  }
}

// Obtener la reacción de un usuario específico a un post
export async function getUserReaction(postId: string, userId: string): Promise<PostReaction | null> {
  try {
    if (!postId || !userId) {
      return null
    }

    // Usar caché local para reducir llamadas a Firestore
    const cacheKey = `user_reaction_${postId}_${userId}`
    const cachedData = sessionStorage.getItem(cacheKey)
    const now = Date.now()

    // Si hay datos en caché y tienen menos de 5 segundos, usarlos
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData)
        // Usar caché solo si tiene menos de 5 segundos
        if (now - timestamp < 5000) {
          console.log("Usando reacción de usuario en caché")
          return data
        }
      } catch (e) {
        console.error("Error parsing cached user reaction:", e)
      }
    }

    const reactionsRef = collection(db, "blogReactions")
    const q = query(reactionsRef, where("postId", "==", postId), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Guardar en caché que no hay reacción
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: null,
            timestamp: now,
          }),
        )
      } catch (e) {
        console.error("Error caching user reaction:", e)
      }
      return null
    }

    const reactionDoc = querySnapshot.docs[0]
    const reaction = { id: reactionDoc.id, ...reactionDoc.data() } as PostReaction

    // Guardar en caché
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: reaction,
          timestamp: now,
        }),
      )
    } catch (e) {
      console.error("Error caching user reaction:", e)
    }

    return reaction
  } catch (error) {
    console.error(`Error fetching user reaction for post ${postId}:`, error)
    return null
  }
}

// Añadir o actualizar una reacción
export async function addOrUpdateReaction(
  postId: string,
  userId: string,
  userName: string,
  userImageUrl: string | undefined,
  reactionType: ReactionType,
): Promise<void> {
  try {
    // Validar datos con mensajes de error más específicos
    if (!postId) {
      console.error("Missing postId in addOrUpdateReaction")
      throw new Error("postId is required")
    }

    if (!userId) {
      console.error("Missing userId in addOrUpdateReaction")
      throw new Error("userId is required")
    }

    if (!reactionType) {
      console.error("Missing reactionType in addOrUpdateReaction")
      throw new Error("reactionType is required")
    }

    console.log("Adding/updating reaction with:", { postId, userId, reactionType })

    // Verificar si el usuario ya reaccionó a este post
    const reactionsRef = collection(db, "blogReactions")
    const q = query(reactionsRef, where("postId", "==", postId), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    // Preparar la operación de actualización o creación
    if (!querySnapshot.empty) {
      // El usuario ya reaccionó, actualizar su reacción
      const reactionDoc = querySnapshot.docs[0]
      const oldReaction = reactionDoc.data().reactionType as ReactionType

      // Si la reacción es la misma, no hacer nada
      if (oldReaction === reactionType) {
        console.log("User already has the same reaction, no changes needed")
        return
      }

      console.log(`Updating reaction from ${oldReaction} to ${reactionType}`)

      // Actualizar la reacción
      await updateDoc(doc(db, "blogReactions", reactionDoc.id), {
        reactionType,
        updatedAt: new Date(),
        timestamp: new Date(), // Añadir timestamp para ordenación
      })

      // Actualizar contadores en el post en una operación separada
      const postRef = doc(db, "blog", postId)
      const postDoc = await getDoc(postRef)

      if (postDoc.exists()) {
        const postData = postDoc.data()
        const reactions = postData.reactions || { total: 0, types: {} }
        const updatedReactions = { ...reactions }

        // Decrementar el contador de la reacción anterior
        if (updatedReactions.types[oldReaction]) {
          updatedReactions.types[oldReaction] = Math.max(0, updatedReactions.types[oldReaction] - 1)
        }

        // Incrementar el contador de la nueva reacción
        updatedReactions.types[reactionType] = (updatedReactions.types[reactionType] || 0) + 1

        console.log("Updated reaction counts:", updatedReactions)
        await updateDoc(postRef, { reactions: updatedReactions })
      }
    } else {
      // Nueva reacción
      console.log("Adding new reaction")
      const newReaction = {
        postId,
        userId,
        userName: userName || "Usuario",
        userImageUrl,
        reactionType,
        createdAt: new Date(),
        timestamp: new Date(), // Añadir timestamp para ordenación
      }

      await addDoc(collection(db, "blogReactions"), newReaction)

      // Actualizar contadores en el post en una operación separada
      const postRef = doc(db, "blog", postId)
      const postDoc = await getDoc(postRef)

      if (postDoc.exists()) {
        const postData = postDoc.data()
        const reactions = postData.reactions || { total: 0, types: {} }
        const updatedReactions = { ...reactions }

        updatedReactions.total = (updatedReactions.total || 0) + 1
        updatedReactions.types[reactionType] = (updatedReactions.types[reactionType] || 0) + 1

        console.log("New reaction counts:", updatedReactions)
        await updateDoc(postRef, { reactions: updatedReactions })
      }
    }

    console.log("Reaction successfully added/updated")
  } catch (error) {
    console.error(`Error adding/updating reaction for post ${postId}:`, error)
    throw error
  }
}

// Eliminar una reacción
export async function removeReaction(postId: string, userId: string): Promise<void> {
  try {
    // Validar datos
    if (!postId || !userId) {
      throw new Error("postId and userId are required")
    }

    // Verificar si el usuario ya reaccionó a este post
    const reactionsRef = collection(db, "blogReactions")
    const q = query(reactionsRef, where("postId", "==", postId), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("No reaction found to remove")
      return // No hay reacción para eliminar
    }

    const reactionDoc = querySnapshot.docs[0]
    const reactionType = reactionDoc.data().reactionType as ReactionType

    // Eliminar la reacción
    await deleteDoc(doc(db, "blogReactions", reactionDoc.id))

    // Actualizar contadores en el post en una operación separada
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (postDoc.exists()) {
      const postData = postDoc.data()
      const reactions = postData.reactions || { total: 0, types: {} }
      const updatedReactions = { ...reactions }

      // Decrementar el total solo si es mayor que 0
      if (updatedReactions.total > 0) {
        updatedReactions.total -= 1
      }

      // Decrementar el contador del tipo solo si existe y es mayor que 0
      if (updatedReactions.types[reactionType] && updatedReactions.types[reactionType] > 0) {
        updatedReactions.types[reactionType] -= 1
      }

      await updateDoc(postRef, { reactions: updatedReactions })
    }

    console.log("Reaction successfully removed")
  } catch (error) {
    console.error(`Error removing reaction for post ${postId}:`, error)
    throw error
  }
}

// Modificar la función getUsersByReactionType para soportar paginación
export async function getUsersByReactionType(
  postId: string,
  reactionType: ReactionType,
  limitCount = 10,
  lastVisible?: any,
): Promise<{ reactions: PostReaction[]; lastVisible: any; hasMore: boolean }> {
  try {
    const reactionsRef = collection(db, "blogReactions")
    let q

    if (reactionType === "all") {
      // Para "all", necesitamos una consulta diferente
      if (lastVisible) {
        q = query(
          reactionsRef,
          where("postId", "==", postId),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(limitCount),
        )
      } else {
        q = query(reactionsRef, where("postId", "==", postId), orderBy("createdAt", "desc"), limit(limitCount))
      }
    } else {
      // Para un tipo específico
      if (lastVisible) {
        q = query(
          reactionsRef,
          where("postId", "==", postId),
          where("reactionType", "==", reactionType),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(limitCount),
        )
      } else {
        q = query(
          reactionsRef,
          where("postId", "==", postId),
          where("reactionType", "==", reactionType),
          orderBy("createdAt", "desc"),
          limit(limitCount),
        )
      }
    }

    const querySnapshot = await getDocs(q)
    const reactions: PostReaction[] = []

    querySnapshot.forEach((doc) => {
      const reactionData = convertTimestamps(doc.data())
      reactions.push({ id: doc.id, ...reactionData } as PostReaction)
    })

    // Obtener el último documento visible para la próxima consulta
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]

    // Determinar si hay más reacciones para cargar
    const hasMore = querySnapshot.docs.length === limitCount

    return {
      reactions,
      lastVisible: lastDoc,
      hasMore,
    }
  } catch (error) {
    console.error(`Error fetching users by reaction type for post ${postId}:`, error)
    return { reactions: [], lastVisible: null, hasMore: false }
  }
}

// Add these new functions at the end of the file

// Types for comment reactions
export type CommentReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry"

// Get all reactions for a comment
export async function getCommentReactions(commentId: string): Promise<CommentReaction[]> {
  try {
    const reactionsRef = collection(db, "commentReactions")
    const q = query(reactionsRef, where("commentId", "==", commentId))
    const querySnapshot = await getDocs(q)

    const reactions: CommentReaction[] = []
    querySnapshot.forEach((doc) => {
      const reactionData = convertTimestamps(doc.data())
      reactions.push({ id: doc.id, ...reactionData } as CommentReaction)
    })

    return reactions
  } catch (error) {
    console.error(`Error fetching reactions for comment ${commentId}:`, error)
    return []
  }
}

// Get reaction counts by type for a comment
export async function getCommentReactionCounts(commentId: string): Promise<Record<CommentReactionType, number>> {
  try {
    const reactions = await getCommentReactions(commentId)
    const counts: Partial<Record<CommentReactionType, number>> = {}

    reactions.forEach((reaction) => {
      const type = reaction.reactionType
      counts[type] = (counts[type] || 0) + 1
    })

    return counts as Record<CommentReactionType, number>
  } catch (error) {
    console.error(`Error getting reaction counts for comment ${commentId}:`, error)
    return {} as Record<CommentReactionType, number>
  }
}

// Get user's reaction to a comment
export async function getUserCommentReaction(commentId: string, userId: string): Promise<CommentReaction | null> {
  try {
    // Validate input parameters
    if (!commentId || !userId) {
      console.log(`Invalid parameters for getUserCommentReaction: commentId=${commentId}, userId=${userId}`)
      return null
    }

    const reactionsRef = collection(db, "commentReactions")
    const q = query(reactionsRef, where("commentId", "==", commentId), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...convertTimestamps(doc.data()) } as CommentReaction
  } catch (error) {
    console.error(`Error getting user reaction for comment ${commentId}:`, error)
    return null
  }
}

// Add or update a reaction to a comment
export async function addCommentReaction(
  commentId: string,
  userId: string,
  userName: string,
  userImageUrl: string | undefined,
  reactionType: CommentReactionType,
): Promise<string> {
  try {
    // Check if user already reacted to this comment
    const existingReaction = await getUserCommentReaction(commentId, userId)

    if (existingReaction) {
      // Update existing reaction if it's different
      if (existingReaction.reactionType !== reactionType) {
        await updateDoc(doc(db, "commentReactions", existingReaction.id), {
          reactionType,
          updatedAt: new Date(),
        })
      }
      return existingReaction.id
    } else {
      // Add new reaction
      const reactionData = {
        commentId,
        userId,
        userName,
        userImageUrl,
        reactionType,
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "commentReactions"), reactionData)
      return docRef.id
    }
  } catch (error) {
    console.error(`Error adding reaction to comment ${commentId}:`, error)
    throw error
  }
}

// Remove a reaction from a comment
export async function removeCommentReaction(commentId: string, userId: string): Promise<void> {
  try {
    const existingReaction = await getUserCommentReaction(commentId, userId)

    if (existingReaction) {
      await deleteDoc(doc(db, "commentReactions", existingReaction.id))
    }
  } catch (error) {
    console.error(`Error removing reaction from comment ${commentId}:`, error)
    throw error
  }
}

// Get users who reacted with a specific type
export async function getUsersByCommentReactionType(
  commentId: string,
  reactionType: CommentReactionType,
): Promise<CommentReaction[]> {
  try {
    const reactionsRef = collection(db, "commentReactions")
    const q = query(reactionsRef, where("commentId", "==", commentId), where("reactionType", "==", reactionType))
    const querySnapshot = await getDocs(q)

    const reactions: CommentReaction[] = []
    querySnapshot.forEach((doc) => {
      const reactionData = convertTimestamps(doc.data())
      reactions.push({ id: doc.id, ...reactionData } as CommentReaction)
    })

    return reactions
  } catch (error) {
    console.error(`Error fetching users by reaction type for comment ${commentId}:`, error)
    return []
  }
}

// Add this function at the end of the file to track shares

// Incrementar el contador de compartidos de un post
export async function incrementPostShare(
  postId: string,
  platform: "facebook" | "twitter" | "linkedin" | "whatsapp" | "generic" = "generic",
): Promise<void> {
  try {
    const postRef = doc(db, "blog", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      console.error(`Post ${postId} does not exist`)
      return
    }

    // Create update object
    const updateObj: any = {
      "socialShares.total": increment(1),
    }

    // Also increment the specific platform counter if provided
    if (platform !== "generic") {
      updateObj[`socialShares.${platform}`] = increment(1)
    }

    await updateDoc(postRef, updateObj)
  } catch (error) {
    console.error(`Error incrementing share count for post ${postId}:`, error)
  }
}

// Nuevas funciones para la gestión de etiquetas

// Obtener etiqueta por ID
export async function getTagById(id: string): Promise<BlogTag | null> {
  try {
    const tagDoc = await getDoc(doc(db, "blogTags", id))

    if (!tagDoc.exists()) {
      return null
    }

    return { id: tagDoc.id, ...convertTimestamps(tagDoc.data()) } as BlogTag
  } catch (error) {
    console.error(`Error fetching tag with ID ${id}:`, error)
    return null
  }
}

// Crear una nueva etiqueta
export async function createTag(tagData: Omit<BlogTag, "id">): Promise<string> {
  try {
    // Asegurarse de que los campos requeridos estén presentes
    if (!tagData.name) {
      throw new Error("El nombre de la etiqueta es obligatorio")
    }

    // Generar slug si no se proporciona
    if (!tagData.slug) {
      tagData.slug = generateSlug(tagData.name)
    }

    // Añadir timestamps
    const tagWithTimestamp = {
      ...tagData,
      createdAt: new Date(),
      updatedAt: new Date(),
      postCount: tagData.postCount || 0,
      isActive: tagData.isActive !== undefined ? tagData.isActive : true,
    }

    const docRef = await addDoc(collection(db, "blogTags"), removeUndefinedValues(tagWithTimestamp))
    return docRef.id
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}

// Actualizar una etiqueta existente
export async function updateTag(id: string, tagData: Partial<BlogTag>): Promise<void> {
  try {
    const tagRef = doc(db, "blogTags", id)

    // Añadir timestamp de actualización
    const tagWithTimestamp = {
      ...tagData,
      updatedAt: new Date(),
    }

    await updateDoc(tagRef, removeUndefinedValues(tagWithTimestamp))
  } catch (error) {
    console.error(`Error updating tag with ID ${id}:`, error)
    throw error
  }
}

// Eliminar una etiqueta
export async function deleteTag(id: string): Promise<void> {
  try {
    const tagRef = doc(db, "blogTags", id)
    await deleteDoc(tagRef)
  } catch (error) {
    console.error(`Error deleting tag with ID ${id}:`, error)
    throw error
  }
}

// Obtener etiquetas destacadas
export async function getFeaturedTags(limitCount = 10): Promise<BlogTag[]> {
  try {
    const tagsRef = collection(db, "blogTags")
    const q = query(
      tagsRef,
      where("isActive", "==", true),
      where("featured", "==", true),
      orderBy("featuredOrder", "asc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    const tags: BlogTag[] = []

    querySnapshot.forEach((doc) => {
      tags.push({ id: doc.id, ...convertTimestamps(doc.data()) } as BlogTag)
    })

    return tags
  } catch (error) {
    console.error("Error fetching featured tags:", error)
    return []
  }
}

// Obtener etiquetas populares (con más posts)
export async function getPopularTags(limitCount = 10): Promise<BlogTag[]> {
  try {
    const tagsRef = collection(db, "blogTags")
    const q = query(tagsRef, where("isActive", "==", true), orderBy("postCount", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    const tags: BlogTag[] = []

    querySnapshot.forEach((doc) => {
      tags.push({ id: doc.id, ...convertTimestamps(doc.data()) } as BlogTag)
    })

    return tags
  } catch (error) {
    console.error("Error fetching popular tags:", error)
    return []
  }
}

// Asumiendo que estas funciones no existen, las añadimos
// Si ya existen, no es necesario modificar este archivo

// export async function getRecentPosts(limit = 5) {
//   try {
//     // Implementación existente o nueva
//     // Esta es una implementación de ejemplo si no existe
//     const postsRef = collection(db, 'blog');
//     const q = query(
//       postsRef,
//       where('status', '==', 'published'),
//       orderBy('publishDate', 'desc'),
//       limit(limit)
//     );

//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     })) as BlogPost[];
//   } catch (error) {
//     console.error('Error fetching recent posts:', error);
//     return [];
//   }
// }

// export async function getPopularPosts(limit = 5) {
//   try {
//     // Implementación existente o nueva
//     // Esta es una implementación de ejemplo si no existe
//     const postsRef = collection(db, 'blog');
//     const q = query(
//       postsRef,
//       where('status', '==', 'published'),
//       orderBy('viewCount', 'desc'),
//       limit(limit)
//     );

//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     })) as BlogPost[];
//   } catch (error) {
//     console.error('Error fetching popular posts:', error);
//     return [];
//   }
// }

// Pin a comment (admin only)
export async function pinComment(commentId: string, adminId: string): Promise<void> {
  try {
    // First check how many pinned comments we already have
    const commentsRef = collection(db, "blogComments")
    const q = query(commentsRef, where("isPinned", "==", true))
    const querySnapshot = await getDocs(q)

    // Limit to 3 pinned comments
    if (querySnapshot.size >= 3) {
      // Find the oldest pinned comment to replace
      let oldestPinnedComment: { id: string; pinnedAt: Date } | null = null

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const pinnedAt = data.pinnedAt ? new Date(data.pinnedAt.toDate()) : new Date(0)

        if (!oldestPinnedComment || pinnedAt < oldestPinnedComment.pinnedAt) {
          oldestPinnedComment = { id: doc.id, pinnedAt }
        }
      })

      // Unpin the oldest comment
      if (oldestPinnedComment) {
        await updateDoc(doc(db, "blogComments", oldestPinnedComment.id), {
          isPinned: false,
          pinnedAt: null,
          pinnedBy: null,
        })
      }
    }

    // Pin the new comment
    const commentRef = doc(db, "blogComments", commentId)
    await updateDoc(commentRef, {
      isPinned: true,
      pinnedAt: new Date(),
      pinnedBy: adminId,
    })
  } catch (error) {
    console.error(`Error pinning comment ${commentId}:`, error)
    throw error
  }
}

// Unpin a comment
export async function unpinComment(commentId: string): Promise<void> {
  try {
    const commentRef = doc(db, "blogComments", commentId)
    await updateDoc(commentRef, {
      isPinned: false,
      pinnedAt: null,
      pinnedBy: null,
    })
  } catch (error) {
    console.error(`Error unpinning comment ${commentId}:`, error)
    throw error
  }
}
