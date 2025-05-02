"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/store/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/types"

interface ProductsGridProps {
  products: Product[]
  isLoading?: boolean
}

export function ProductsGrid({ products, isLoading = false }: ProductsGridProps) {
  const [key, setKey] = useState(0)

  // Forzar re-render cuando cambia la moneda
  useEffect(() => {
    const handleCurrencyChange = () => {
      // Incrementar la key para forzar un re-render completo
      setKey((prev) => prev + 1)
    }

    window.addEventListener("currency-changed", handleCurrencyChange)

    return () => {
      window.removeEventListener("currency-changed", handleCurrencyChange)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return <p className="text-center py-8">No hay productos disponibles.</p>
  }

  return (
    <div key={key} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
