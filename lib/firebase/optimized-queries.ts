import { collection, query, where, getDocs, Timestamp, type DocumentData, limit } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

// Función para normalizar la fecha de forma segura
function normalizeDate(date: any): Date {
  if (!date) {
    return new Date() // Devuelve la fecha actual si no hay fecha
  }

  try {
    if (date instanceof Timestamp) {
      return date.toDate()
    } else if (typeof date === "string" || typeof date === "number") {
      return new Date(date)
    }
    console.warn("Unsupported date format, using current date:", date)
    return new Date()
  } catch (error) {
    console.error("Error normalizing date, using current date:", date, error)
    return new Date()
  }
}

// Función optimizada para obtener los slugs y fechas de actualización de los eventos
export async function getSitemapEvents() {
  try {
    const eventsRef = collection(db, "events")
    // Usar status === "published" para eventos publicados
    const q = query(eventsRef, where("status", "==", "published"))

    const querySnapshot = await getDocs(q)
    const events: DocumentData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        events.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      }
    })

    console.log(`Sitemap: Found ${events.length} events`, events.map((e) => e.slug).join(", "))
    return events
  } catch (error) {
    console.error("Error fetching events for sitemap:", error)
    return []
  }
}

// Función optimizada para obtener los slugs y fechas de actualización de los posts
export async function getSitemapPosts() {
  try {
    const postsRef = collection(db, "blog")
    // Usar status === "published" para posts publicados
    const q = query(postsRef, where("status", "==", "published"))

    const querySnapshot = await getDocs(q)
    const posts: DocumentData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        posts.push({
          slug: data.slug,
          updatedDate: data.updatedDate ? normalizeDate(data.updatedDate) : new Date(),
          publishDate: data.publishDate ? normalizeDate(data.publishDate) : new Date(),
        })
      }
    })

    console.log(`Sitemap: Found ${posts.length} blog posts`, posts.map((p) => p.slug).join(", "))
    return posts
  } catch (error) {
    console.error("Error fetching posts for sitemap:", error)
    return []
  }
}

// Función optimizada para obtener los slugs y fechas de actualización de los productos
export async function getSitemapProducts() {
  try {
    const productsRef = collection(db, "products")
    // Usar isActive === true para productos activos
    const q = query(productsRef, where("isActive", "==", true))

    const querySnapshot = await getDocs(q)
    const products: DocumentData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        products.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      }
    })

    console.log(`Sitemap: Found ${products.length} products`, products.map((p) => p.slug).join(", "))
    return products
  } catch (error) {
    console.error("Error fetching products for sitemap:", error)
    return []
  }
}

// Función optimizada para obtener los slugs y fechas de actualización de los álbumes
export async function getSitemapAlbums() {
  try {
    const albumsRef = collection(db, "albums")
    const q = query(albumsRef)

    const querySnapshot = await getDocs(q)
    const albums: DocumentData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        albums.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      }
    })

    console.log(`Sitemap: Found ${albums.length} albums`)
    return albums
  } catch (error) {
    console.error("Error fetching albums for sitemap:", error)
    return []
  }
}

// Función optimizada para obtener los slugs y fechas de actualización de las categorías de blog
export async function getSitemapBlogCategories() {
  try {
    const categoriesRef = collection(db, "blogCategories")
    const q = query(categoriesRef, where("isActive", "==", true))

    const querySnapshot = await getDocs(q)
    const categories: DocumentData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        categories.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      }
    })

    console.log(`Sitemap: Found ${categories.length} blog categories`)
    return categories
  } catch (error) {
    console.error("Error fetching blog categories for sitemap:", error)
    return []
  }
}

// Función optimizada para obtener los slugs y fechas de actualización de las categorías de productos
export async function getSitemapProductCategories() {
  try {
    const categoriesRef = collection(db, "productCategories")
    const q = query(categoriesRef, where("isActive", "==", true))

    const querySnapshot = await getDocs(q)
    const categories: DocumentData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.slug) {
        categories.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      }
    })

    console.log(`Sitemap: Found ${categories.length} product categories`)
    return categories
  } catch (error) {
    console.error("Error fetching product categories for sitemap:", error)
    return []
  }
}

// Función para obtener etiquetas de blog
export async function getSitemapBlogTags() {
  try {
    const postsRef = collection(db, "blog")
    const q = query(postsRef, where("status", "==", "published"), limit(100))

    const querySnapshot = await getDocs(q)
    const tags = new Set<string>()

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          if (tag && typeof tag === "string") {
            tags.add(tag.toLowerCase().replace(/\s+/g, "-"))
          }
        })
      }
    })

    const tagsList = Array.from(tags).map((tag) => ({
      slug: tag,
      updatedAt: new Date(),
    }))

    console.log(`Sitemap: Found ${tagsList.length} blog tags`)
    return tagsList
  } catch (error) {
    console.error("Error fetching blog tags for sitemap:", error)
    return []
  }
}

// Función para obtener datos específicos cuando las consultas principales fallan
export async function getSpecificContent() {
  try {
    // Intentar obtener eventos, posts y productos específicos por slug
    const specificEvents = await getSpecificEventsBySlug(["ultra-peru-2025"])
    const specificPosts = await getSpecificPostsBySlug(["as-fue-el-show-de-martin-garrix-en-ultra-music-festival-2025"])
    const specificProducts = await getSpecificProductsBySlug([
      "hoddie-ultra-peru-2024-music-vibes",
      "black-silver-tshirt",
    ])

    return {
      events: specificEvents,
      posts: specificPosts,
      products: specificProducts,
    }
  } catch (error) {
    console.error("Error fetching specific content:", error)
    return {
      events: [],
      posts: [],
      products: [],
    }
  }
}

// Función auxiliar para obtener eventos específicos por slug
async function getSpecificEventsBySlug(slugs: string[]) {
  try {
    const events: DocumentData[] = []

    for (const slug of slugs) {
      const eventsRef = collection(db, "events")
      const q = query(eventsRef, where("slug", "==", slug))
      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        events.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      })
    }

    return events
  } catch (error) {
    console.error("Error fetching specific events:", error)
    return []
  }
}

// Función auxiliar para obtener posts específicos por slug
async function getSpecificPostsBySlug(slugs: string[]) {
  try {
    const posts: DocumentData[] = []

    for (const slug of slugs) {
      const postsRef = collection(db, "blog")
      const q = query(postsRef, where("slug", "==", slug))
      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        posts.push({
          slug: data.slug,
          updatedDate: data.updatedDate ? normalizeDate(data.updatedDate) : new Date(),
          publishDate: data.publishDate ? normalizeDate(data.publishDate) : new Date(),
        })
      })
    }

    return posts
  } catch (error) {
    console.error("Error fetching specific posts:", error)
    return []
  }
}

// Función auxiliar para obtener productos específicos por slug
async function getSpecificProductsBySlug(slugs: string[]) {
  try {
    const products: DocumentData[] = []

    for (const slug of slugs) {
      const productsRef = collection(db, "products")
      const q = query(productsRef, where("slug", "==", slug))
      const querySnapshot = await getDocs(q)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        products.push({
          slug: data.slug,
          updatedAt: data.updatedAt ? normalizeDate(data.updatedAt) : new Date(),
          createdAt: data.createdAt ? normalizeDate(data.createdAt) : new Date(),
        })
      })
    }

    return products
  } catch (error) {
    console.error("Error fetching specific products:", error)
    return []
  }
}

// Add a new function to ensure we get all main pages for the sitemap
export async function getMainPagesForSitemap() {
  return [
    {
      url: "/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "/eventos",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "/tienda",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "/galeria",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "/dj-ranking",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "/contacto",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "/team",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "/sugerir-dj",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "/votar",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]
}
