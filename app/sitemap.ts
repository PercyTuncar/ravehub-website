import type { MetadataRoute } from "next"
import {
  getSitemapEvents,
  getSitemapPosts,
  getSitemapProducts,
  getSitemapAlbums,
  getSitemapBlogCategories,
  getSitemapProductCategories,
  getSitemapBlogTags,
  getSpecificContent,
} from "@/lib/firebase/optimized-queries"

// Dominio base del sitio
const SITE_URL = "https://www.ravehublatam.com"

// Función para formatear la fecha en formato ISO
function formatDate(date: Date | number | string | undefined): string {
  if (!date) return new Date().toISOString()

  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toISOString()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    console.log("Generating sitemap.ts...")

    // Rutas estáticas importantes
    const staticRoutes = [
      {
        url: `${SITE_URL}/`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/eventos`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/tienda`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/galeria`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/perfil`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/login`,
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
      {
        url: `${SITE_URL}/registro`,
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
    ]

    // Obtener datos dinámicos de Firestore usando las funciones optimizadas
    const [events, posts, products, albums, blogCategories, productCategories, blogTags] = await Promise.all([
      getSitemapEvents(),
      getSitemapPosts(),
      getSitemapProducts(),
      getSitemapAlbums(),
      getSitemapBlogCategories(),
      getSitemapProductCategories(),
      getSitemapBlogTags(),
    ])

    // Si alguna de las consultas principales devuelve resultados vacíos, intentar con consultas específicas
    let specificContent = { events: [], posts: [], products: [] }
    if (!events.length || !posts.length || !products.length) {
      console.log("Some content types are empty, trying direct query...")
      specificContent = await getSpecificContent()
    }

    // Combinar los resultados, prefiriendo los resultados de la consulta principal si están disponibles
    const finalEvents = events.length ? events : specificContent.events
    const finalPosts = posts.length ? posts : specificContent.posts
    const finalProducts = products.length ? products : specificContent.products

    // Mapear eventos a rutas de sitemap
    const eventRoutes = finalEvents.map((event) => ({
      url: `${SITE_URL}/eventos/${event.slug}`,
      lastModified: new Date(formatDate(event.updatedAt || event.createdAt)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    // Mapear posts a rutas de sitemap
    const postRoutes = finalPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(formatDate(post.updatedDate || post.publishDate)),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    // Mapear productos a rutas de sitemap
    const productRoutes = finalProducts.map((product) => ({
      url: `${SITE_URL}/tienda/${product.slug}`,
      lastModified: new Date(formatDate(product.updatedAt || product.createdAt)),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))

    // Mapear álbumes a rutas de sitemap
    const albumRoutes = albums.map((album) => ({
      url: `${SITE_URL}/galeria/${album.slug}`,
      lastModified: new Date(formatDate(album.updatedAt || album.createdAt)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    // Mapear categorías de blog a rutas de sitemap
    const blogCategoryRoutes = blogCategories.map((category) => ({
      url: `${SITE_URL}/blog/categorias/${category.slug}`,
      lastModified: new Date(formatDate(category.updatedAt || category.createdAt)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    // Mapear etiquetas de blog a rutas de sitemap
    const blogTagRoutes = blogTags.map((tag) => ({
      url: `${SITE_URL}/blog/etiquetas/${tag.slug}`,
      lastModified: new Date(formatDate(tag.updatedAt)),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))

    // Mapear categorías de productos a rutas de sitemap
    const productCategoryRoutes = productCategories.map((category) => ({
      url: `${SITE_URL}/tienda/categorias/${category.slug}`,
      lastModified: new Date(formatDate(category.updatedAt || category.createdAt)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    // Combinar todas las rutas
    const allRoutes = [
      ...staticRoutes,
      ...eventRoutes,
      ...postRoutes,
      ...productRoutes,
      ...albumRoutes,
      ...blogCategoryRoutes,
      ...blogTagRoutes,
      ...productCategoryRoutes,
    ]

    console.log(`Sitemap.ts: Generated ${allRoutes.length} total URLs`)
    console.log(`Events: ${eventRoutes.length}, Posts: ${postRoutes.length}, Products: ${productRoutes.length}`)

    return allRoutes
  } catch (error) {
    console.error("Error generando sitemap:", error)

    // En caso de error, intentar obtener al menos los contenidos específicos
    try {
      const specificContent = await getSpecificContent()

      // Crear rutas para los contenidos específicos
      const specificRoutes = [
        ...specificContent.events.map((event) => ({
          url: `${SITE_URL}/eventos/${event.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
        ...specificContent.posts.map((post) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
        ...specificContent.products.map((product) => ({
          url: `${SITE_URL}/tienda/${product.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ]

      // Devolver rutas estáticas más las específicas
      return [
        {
          url: `${SITE_URL}/`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 1.0,
        },
        {
          url: `${SITE_URL}/eventos`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${SITE_URL}/blog`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${SITE_URL}/tienda`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${SITE_URL}/galeria`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
        ...specificRoutes,
      ]
    } catch (fallbackError) {
      // Si todo falla, devolver un sitemap básico con solo las rutas estáticas
      return [
        {
          url: `${SITE_URL}/`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 1.0,
        },
        {
          url: `${SITE_URL}/eventos`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${SITE_URL}/blog`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${SITE_URL}/tienda`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.9,
        },
        {
          url: `${SITE_URL}/galeria`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ]
    }
  }
}
