"use client"

import { useEffect, useState } from "react"
import { ProductForm } from "@/components/admin/product-form"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function EditProductPage() {
  const params = useParams()
  const productId = params.id as string
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar que el ID del producto existe
    if (productId) {
      setIsLoading(false)
    }
  }, [productId])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductForm productId={productId} />
    </div>
  )
}
