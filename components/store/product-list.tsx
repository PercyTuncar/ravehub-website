"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/store/product-card"
import { getAllProducts, getProductsByCategory } from "@/lib/firebase/products"
import type { Product } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function ProductList() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categoryId = searchParams.get("category")
  const minPrice = searchParams.get("minPrice") ? Number.parseInt(searchParams.get("minPrice") as string) : 0
  const maxPrice = searchParams.get("maxPrice")
    ? Number.parseInt(searchParams.get("maxPrice") as string)
    : Number.POSITIVE_INFINITY
  const search = searchParams.get("search")
  const inStock = searchParams.get("inStock") === "true"
  const onSale = searchParams.get("onSale") === "true"
  const sortBy = searchParams.get("sortBy") || "newest"

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch products based on category filter
        let fetchedProducts: Product[]
        if (categoryId) {
          fetchedProducts = await getProductsByCategory(categoryId)
        } else {
          fetchedProducts = await getAllProducts()
        }

        // Apply price filter
        fetchedProducts = fetchedProducts.filter((product) => {
          const finalPrice = product.discountPercentage
            ? product.price * (1 - product.discountPercentage / 100)
            : product.price
          return finalPrice >= minPrice && finalPrice <= maxPrice
        })

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase()
          fetchedProducts = fetchedProducts.filter(
            (product) =>
              product.name.toLowerCase().includes(searchLower) ||
              product.shortDescription.toLowerCase().includes(searchLower) ||
              product.description.toLowerCase().includes(searchLower),
          )
        }

        // Apply in stock filter
        if (inStock) {
          fetchedProducts = fetchedProducts.filter((product) => product.stock > 0)
        }

        // Apply on sale filter
        if (onSale) {
          fetchedProducts = fetchedProducts.filter(
            (product) => product.discountPercentage && product.discountPercentage > 0,
          )
        }

        // Apply sorting
        switch (sortBy) {
          case "priceAsc":
            fetchedProducts.sort((a, b) => {
              const priceA = a.discountPercentage ? a.price * (1 - a.discountPercentage / 100) : a.price
              const priceB = b.discountPercentage ? b.price * (1 - b.discountPercentage / 100) : b.price
              return priceA - priceB
            })
            break
          case "priceDesc":
            fetchedProducts.sort((a, b) => {
              const priceA = a.discountPercentage ? a.price * (1 - a.discountPercentage / 100) : a.price
              const priceB = b.discountPercentage ? b.price * (1 - b.discountPercentage / 100) : b.price
              return priceB - priceA
            })
            break
          case "nameAsc":
            fetchedProducts.sort((a, b) => a.name.localeCompare(b.name))
            break
          case "nameDesc":
            fetchedProducts.sort((a, b) => b.name.localeCompare(a.name))
            break
          case "newest":
          default:
            fetchedProducts.sort((a, b) => {
              const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
              const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
              return dateB.getTime() - dateA.getTime()
            })
            break
        }

        setProducts(fetchedProducts)
      } catch (err) {
        console.error("Error fetching products:", err)
        setError("Ocurrió un error al cargar los productos. Por favor, intenta de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId, minPrice, maxPrice, search, inStock, onSale, sortBy])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (products.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No se encontraron productos</AlertTitle>
        <AlertDescription>
          No hay productos que coincidan con los filtros seleccionados. Intenta con otros criterios de búsqueda.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
