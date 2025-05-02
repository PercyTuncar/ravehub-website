"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/store/product-card"
import { getProductsByCategory } from "@/lib/firebase/products"
import type { Product } from "@/types"
import { Loader2 } from "lucide-react"

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true)
        const categoryProducts = await getProductsByCategory(categoryId)
        // Filter out current product and limit to 4 products
        const relatedProducts = categoryProducts.filter((product) => product.id !== currentProductId).slice(0, 4)
        setProducts(relatedProducts)
      } catch (error) {
        console.error("Error fetching related products:", error)
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchRelatedProducts()
    }
  }, [categoryId, currentProductId])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
