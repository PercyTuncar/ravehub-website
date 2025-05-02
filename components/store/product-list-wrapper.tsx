"use client"

import { Suspense } from "react"
import { ProductList } from "./product-list"
import { Skeleton } from "@/components/ui/skeleton"

// Componente de carga para la lista de productos
function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="rounded-lg overflow-hidden border border-border">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <div className="pt-2">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}

export function ProductListWrapper() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductList />
    </Suspense>
  )
}
