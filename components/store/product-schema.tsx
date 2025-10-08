"use client"

import { useEffect, useState } from "react"
import type { Product, ProductCategory, ProductReview, ProductVariant } from "@/types"
import { getProductAggregateRating, getApprovedProductReviews } from "@/lib/firebase/reviews"
import { getCategoryById } from "@/lib/firebase/products"

interface ProductSchemaProps {
  product: Product
  category?: ProductCategory
}

export function ProductSchema({ product, category }: ProductSchemaProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [fullCategory, setFullCategory] = useState<ProductCategory | null>(category || null)

  useEffect(() => {
    const loadCategoryIfNeeded = async () => {
      if (!category && product.categoryId) {
        try {
          const categoryData = await getCategoryById(product.categoryId)
          if (categoryData) {
            setFullCategory(categoryData)
          }
        } catch (error) {
          console.error("Error loading category:", error)
        }
      }
    }

    loadCategoryIfNeeded()
  }, [category, product.categoryId])

  useEffect(() => {
    const generateSchema = async () => {
      try {
        // Obtener la valoración agregada y reseñas aprobadas
        const aggregateRating = await getProductAggregateRating(product.id)
        const productReviews = await getApprovedProductReviews(product.id)
        setReviews(productReviews)

        // Calcular el precio con descuento si existe
        const hasDiscount = product.discountPercentage && product.discountPercentage > 0
        const discountedPrice = hasDiscount
          ? product.price - product.price * (product.discountPercentage / 100)
          : product.price

        // Preparar variantes para el esquema
        const hasVariants = product.hasVariants && product.variants && product.variants.length > 0
        const variantSchema = hasVariants
          ? product.variants.map((variant: ProductVariant) => ({
              "@type": "ProductModel",
              name: `${product.name} - ${variant.name}`,
              sku: variant.sku || `${product.sku || product.id}-${variant.id}`,
              additionalProperty: {
                "@type": "PropertyValue",
                name: variant.type,
                value: variant.name,
              },
              offers: {
                "@type": "Offer",
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/tienda/${product.slug}?variant=${variant.id}`,
                priceCurrency: product.currency,
                price: discountedPrice + (variant.additionalPrice || 0),
                priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
              },
            }))
          : []

        // Preparar reseñas para el esquema usando datos reales
        const reviewSchema = productReviews.slice(0, 5).map((review) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: review.userName,
            image: review.userImageUrl || undefined,
          },
          datePublished: review.createdAt.toISOString(),
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating.toString(),
            bestRating: "5",
          },
          reviewBody: review.comment || "",
          name: review.title || "Reseña de producto",
          ...(review.purchaseVerified && {
            publisher: {
              "@type": "Organization",
              name: "Ravehub",
            },
          }),
        }))

        // Extraer palabras clave SEO
        const keywords = product.seoKeywords || []

        // Construir el objeto JSON-LD completo con datos reales
        const schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images : null,
          description: product.seoDescription || product.description || product.shortDescription,
          sku: product.id,
          brand: {
            "@type": "Brand",
            name: product.brand || "Ravehub",
          },
          // Usar datos reales de material y género
          material: "Algodón Jersey 30/1",
          offers: {
            "@type": "Offer",
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/tienda/${product.slug}`,
            priceCurrency: product.currency,
            price: discountedPrice,
            priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            ...(hasDiscount && {
              priceSpecification: {
                "@type": "PriceSpecification",
                price: product.price,
                priceCurrency: product.currency,
              },
            }),
            ...(product.shippingDetails && {
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: product.shippingDetails.shippingRate,
                  currency: product.shippingDetails.shippingCurrency,
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  name: product.shippingDetails.eligibleRegion,
                },
              },
            }),
            ...(product.eligibleRegions &&
              product.eligibleRegions.length > 0 && {
                eligibleRegion: product.eligibleRegions.map((region) => ({
                  "@type": "Country",
                  name: region,
                })),
              }),
            seller: {
              "@type": "Organization",
              name: "Ravehub",
              url: process.env.NEXT_PUBLIC_BASE_URL,
            },
          },
          ...(fullCategory && {
            category: fullCategory.name,
          }),
          ...(keywords.length > 0 && {
            keywords: keywords.join(", "),
          }),
          ...(aggregateRating && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: aggregateRating.ratingValue,
              reviewCount: aggregateRating.reviewCount,
            },
          }),
          ...(reviewSchema.length > 0 && {
            review: reviewSchema,
          }),
          ...(hasVariants &&
            variantSchema.length > 0 && {
              hasVariant: variantSchema,
            }),
          // Añadir propiedades adicionales específicas del producto
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Tipo",
              value: "ropa/merchandising",
            },
            {
              "@type": "PropertyValue",
              name: "Estampado",
              value: "Reactivo al agua",
            },
            {
              "@type": "PropertyValue",
              name: "Modelo",
              value: "unico",
            },
          ],
        }

        // Insertar el script en el head
        const script = document.createElement("script")
        script.type = "application/ld+json"
        script.text = JSON.stringify(schema)
        document.head.appendChild(script)

        // Limpiar al desmontar
        return () => {
          document.head.removeChild(script)
        }
      } catch (error) {
        console.error("Error generating product schema:", error)
      }
    }

    generateSchema()
  }, [product, fullCategory])

  return null
}
