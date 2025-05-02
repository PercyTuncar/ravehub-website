"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { formatCurrency } from "@/lib/utils"
import { getFeaturedProducts } from "@/lib/firebase/products"
import type { Product } from "@/types"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { currency } = useCurrency()
  const { addItem } = useCart()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const featuredProducts = await getFeaturedProducts(6)
        setProducts(featuredProducts)
      } catch (error) {
        console.error("Error fetching featured products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1))
  }

  const handleAddToCart = (product: Product) => {
    const finalPrice = product.discountPercentage
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price

    addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      currency: product.currency,
      quantity: 1,
      image: product.images[0] || "/placeholder.svg?height=200&width=200",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          className="rounded-full bg-white/80 backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="rounded-full bg-white/80 backdrop-blur-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Productos Destacados</h2>
        <p className="text-muted-foreground">Descubre nuestros productos más populares</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.slice(currentIndex, currentIndex + 3).map((product) => {
          const finalPrice = product.discountPercentage
            ? product.price * (1 - product.discountPercentage / 100)
            : product.price

          return (
            <Card
              key={product.id}
              className="overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow"
            >
              <Link href={`/tienda/${product.slug}`} className="block relative h-48">
                <Image
                  src={product.images[0] || "/placeholder.svg?height=200&width=200"}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                />
                {product.discountPercentage && (
                  <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                    -{product.discountPercentage}%
                  </Badge>
                )}
              </Link>
              <CardContent className="p-4">
                <Link href={`/tienda/${product.slug}`}>
                  <h3 className="font-bold text-lg hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    {product.discountPercentage ? (
                      <div className="flex flex-col">
                        <span className="text-sm line-through text-muted-foreground">
                          {formatCurrency(product.price, product.currency, currency)}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(finalPrice, product.currency, currency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(product.price, product.currency, currency)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleAddToCart(product)} disabled={product.stock <= 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
