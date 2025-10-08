import type { Product, ProductCategory } from "@/types"

interface ProductSchemaProps {
  product: Product
  category?: ProductCategory
}

export function ProductSchema({ product, category }: ProductSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.vercel.app"

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.sku,
    image:
      product.images && product.images.length > 0
        ? product.images.map((img) => (img.startsWith("http") ? img : `${baseUrl}${img}`))
        : undefined,
    brand: {
      "@type": "Brand",
      name: product.brand || "Ravehub",
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "MXN",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${baseUrl}/tienda/${product.slug}`,
      // Move eligibleRegion here, outside of shippingDetails
      ...(product.eligibleRegions &&
        product.eligibleRegions.length > 0 && {
          eligibleRegion: product.eligibleRegions.map((region) => ({
            "@type": "Place",
            name: region,
          })),
        }),
      ...(product.shippingDetails && {
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "PriceSpecification",
            priceCurrency: product.shippingDetails.shippingCurrency || "PEN",
            price: product.shippingDetails.shippingRate.toString(),
          },
          // Removed eligibleRegion from here
        },
      }),
    },
    // Añadir videos como subjectOf para cumplir con schema.org
    ...(product.videos &&
      product.videos.length > 0 && {
        subjectOf: product.videos.map((video) => ({
          "@type": "VideoObject",
          name: video.title || `Video de ${product.name}`,
          description: video.description || product.shortDescription,
          thumbnailUrl: video.thumbnailUrl,
          uploadDate:
            product.updatedAt instanceof Date
              ? product.updatedAt.toISOString()
              : new Date(product.updatedAt?.seconds * 1000 || Date.now()).toISOString(),
          ...(video.provider === "youtube" && video.videoId
            ? { embedUrl: `https://www.youtube.com/embed/${video.videoId}` }
            : { contentUrl: video.url }),
        })),
      }),
    ...(category && {
      category: category.name,
    }),
  }
}

interface CategorySchemaProps {
  category: ProductCategory
  products: Product[]
}

export function CategorySchema({ category, products }: CategorySchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.vercel.app"

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${baseUrl}/tienda/categorias/${category.slug}`,
    ...(category.image && {
      image: category.image.startsWith("http") ? category.image : `${baseUrl}${category.image}`,
    }),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          url: `${baseUrl}/tienda/${product.slug}`,
          ...(product.images &&
            product.images.length > 0 && {
              image: product.images[0].startsWith("http") ? product.images[0] : `${baseUrl}${product.images[0]}`,
            }),
          ...(product.brand && {
            brand: {
              "@type": "Brand",
              name: product.brand,
            },
          }),
        },
      })),
    },
  }
}
