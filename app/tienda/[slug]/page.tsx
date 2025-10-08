import type { Metadata, ResolvingMetadata } from "next"
import { Suspense } from "react"
import { getProductBySlug, getCategoryById } from "@/lib/firebase/store"
import { ProductDetail } from "@/components/store/product-detail"
import { RelatedProducts } from "@/components/store/related-products"
import { ProductReviews } from "@/components/store/product-reviews"
import { getProductAggregateRating } from "@/lib/firebase/reviews"
import { notFound } from "next/navigation"
import { filterBlobUrls } from "@/lib/firebase/image-utils"
import { ProductSchema } from "@/components/store/product-schema"

interface ProductPageProps {
  params: {
    slug: string
  }
}

// Función para generar metadatos con manejo de errores
export async function generateMetadata({ params }: ProductPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    // Obtener el slug del producto
    const { slug } = await params

    // Obtener los datos del producto
    const product = await getProductBySlug(slug)

    // Si no existe el producto, devolver metadatos por defecto
    if (!product) {
      return {
        title: "Producto no encontrado | Ravehub",
        description: "El producto que buscas no existe o ha sido eliminado.",
      }
    }

    // Filtrar URLs de blob de las imágenes de forma segura
    const filteredImages = product.images ? filterBlobUrls(product.images) : []

    // Obtener la URL base con fallback seguro
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.vercel.app"

    // Construir la URL completa de la imagen principal con validación
    let mainImage = `${baseUrl}/placeholder.svg?height=1200&width=630`
    if (filteredImages.length > 0) {
      mainImage = filteredImages[0].startsWith("http") ? filteredImages[0] : `${baseUrl}${filteredImages[0]}`
    }

    // Construir la descripción con fallbacks seguros
    const description = product.shortDescription || product.description || `Descubre ${product.name} en nuestra tienda.`

    // Construir el título con validación
    const title = `${product.name} | Ravehub`

    // Construir y devolver los metadatos con validaciones
    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: `${baseUrl}/tienda/${slug}`,
        siteName: "Ravehub",
        images: [
          {
            url: mainImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        locale: "es_ES",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: [mainImage],
      },
    }
  } catch (error) {
    // En caso de cualquier error, devolver metadatos mínimos
    console.error("Error generating metadata:", error)
    return {
      title: "Tienda Ravehub",
      description: "Descubre productos exclusivos en la tienda de Ravehub.",
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)

    if (!product) {
      notFound()
    }

    // Filter out blob URLs from product images
    if (product.images) {
      product.images = filterBlobUrls(product.images)
    }

    // Fetch category if available (with error handling)
    let category = undefined
    try {
      if (product.categoryId) {
        category = await getCategoryById(product.categoryId)
      }
    } catch (error) {
      console.error("Error fetching category:", error)
      // Continue without category
    }

    // Fetch aggregate rating and reviews
    let aggregateRating = undefined
    try {
      aggregateRating = await getProductAggregateRating(product.id)
    } catch (error) {
      console.error("Error fetching rating:", error)
      // Continue without rating
    }

    return (
      <>
        <ProductSchema product={product} category={category} />

        <div className="container mx-auto px-4 py-8">
          <ProductDetail product={product} />

          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Valoraciones y reseñas</h2>
            <ProductReviews productId={product.id} productName={product.name} />
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
            <Suspense fallback={<div>Cargando productos relacionados...</div>}>
              <RelatedProducts productId={product.id} categoryId={product.categoryId} />
            </Suspense>
          </div>
        </div>
      </>
    )
  } catch (error) {
    // En caso de error, mostrar un mensaje genérico
    console.error("Error rendering product page:", error)
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Ha ocurrido un error</h1>
        <p>No se pudo cargar la información del producto. Por favor, inténtalo de nuevo más tarde.</p>
      </div>
    )
  }
}
