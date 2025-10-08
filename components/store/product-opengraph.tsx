import type { Metadata } from "next"
import type { Product, ProductCategory } from "@/types"
import { getProductAggregateRating } from "@/lib/firebase/reviews"

interface GenerateProductMetadataProps {
  product: Product
  category?: ProductCategory
  baseUrl: string
}

export async function generateProductMetadata({
  product,
  category,
  baseUrl,
}: GenerateProductMetadataProps): Promise<Metadata> {
  // Filtrar URLs de blob de las imágenes
  const filteredImages = product.images || []

  // Construir la URL completa de la imagen principal
  const mainImage =
    filteredImages.length > 0
      ? filteredImages[0].startsWith("http")
        ? filteredImages[0]
        : `${baseUrl}${filteredImages[0]}`
      : `${baseUrl}/placeholder.svg?height=1200&width=630`

  // Construir la descripción
  const description = product.shortDescription || product.description || `Descubre ${product.name} en nuestra tienda.`

  // Construir el título
  const title = `${product.name} ${category ? `- ${category.name}` : ""} | Ravehub`

  // Obtener la valoración agregada
  const aggregateRating = await getProductAggregateRating(product.id)

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `${baseUrl}/tienda/${product.slug}`,
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
      type: "product",
      // Añadir propiedades específicas de producto para OpenGraph
      product: {
        price: {
          amount: product.price.toString(),
          currency: product.currency || "MXN",
        },
        availability: product.stock > 0 ? "in stock" : "out of stock",
        ...(product.brand && { brand: product.brand }),
        ...(category && { category: category.name }),
        ...(aggregateRating && {
          rating: {
            value: aggregateRating.averageRating.toString(),
            best: "5",
            count: aggregateRating.reviewCount.toString(),
          },
        }),
      },
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [mainImage],
    },
    // Añadir metadatos estructurados para productos
    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": product.currency || "MXN",
      "product:availability": product.stock > 0 ? "in stock" : "out of stock",
      ...(product.brand && { "product:brand": product.brand }),
    },
  }
}
