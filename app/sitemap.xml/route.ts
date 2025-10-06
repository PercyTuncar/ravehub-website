import { NextResponse } from "next/server"
import {
  getSitemapEvents,
  getSitemapPosts,
  getSitemapProducts,
  getSitemapAlbums,
  getSitemapBlogCategories,
  getSitemapProductCategories,
  getSitemapBlogTags,
} from "@/lib/firebase/optimized-queries"

const SITE_URL = "https://www.weareravehub.com"

export const revalidate = 3600 // Revalidate every hour

function formatDate(date: Date | number | string | undefined): string {
  if (!date) return new Date().toISOString()

  try {
    const dateObj = date instanceof Date ? date : new Date(date)

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date found:", date)
      return new Date().toISOString() // Retornar una fecha válida por defecto
    }

    return dateObj.toISOString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return new Date().toISOString() // Retornar una fecha válida por defecto
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    console.log("Generating sitemap.xml...")

    const [events, posts, products, albums, blogCategories, productCategories, blogTags] = await Promise.all([
      getSitemapEvents(),
      getSitemapPosts(),
      getSitemapProducts(),
      getSitemapAlbums(),
      getSitemapBlogCategories(),
      getSitemapProductCategories(),
      getSitemapBlogTags(),
    ])

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/eventos</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tienda</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/galeria</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/perfil</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/registro</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  ${events
    .map(
      (event) => `
  <url>
    <loc>${SITE_URL}/eventos/${event.slug}</loc>
    <lastmod>${formatDate(event.updatedAt || event.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("")}
  ${posts
    .map(
      (post) => `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${formatDate(post.updatedDate || post.publishDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("")}
  ${products
    .map(
      (product) => `
  <url>
    <loc>${SITE_URL}/tienda/${product.slug}</loc>
    <lastmod>${formatDate(product.updatedAt || product.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join("")}
  ${albums
    .map(
      (album) => `
  <url>
    <loc>${SITE_URL}/galeria/${album.slug}</loc>
    <lastmod>${formatDate(album.updatedAt || album.createdAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("")}
  ${blogCategories
    .map(
      (category) => `
  <url>
    <loc>${SITE_URL}/blog/categorias/${category.slug}</loc>
    <lastmod>${formatDate(category.updatedAt || category.createdAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("")}
  ${blogTags
    .map(
      (tag) => `
  <url>
    <loc>${SITE_URL}/blog/etiquetas/${tag.slug}</loc>
    <lastmod>${formatDate(tag.updatedAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`,
    )
    .join("")}
  ${productCategories
    .map(
      (category) => `
  <url>
    <loc>${SITE_URL}/tienda/categorias/${category.slug}</loc>
    <lastmod>${formatDate(category.updatedAt || category.createdAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("")}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return new NextResponse("Error generating sitemap", { status: 500 })
  }
}
