"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { ProductCategory } from "@/types"

interface CategoryListProps {
  activeCategorySlug?: string
}

export function CategoryList({ activeCategorySlug }: CategoryListProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const categoriesRef = collection(db, "productCategories")
        const q = query(categoriesRef, where("isActive", "==", true), orderBy("order", "asc"))
        const querySnapshot = await getDocs(q)

        const categoriesData: ProductCategory[] = []
        querySnapshot.forEach((doc) => {
          categoriesData.push({ id: doc.id, ...doc.data() } as ProductCategory)
        })

        setCategories(categoriesData)
        console.log("Fetched categories:", categoriesData)
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Categorías</h3>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-4 pb-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-[200px] rounded-md" />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Categorías</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-6 pb-4">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/tienda/categorias/${category.slug}`}
                passHref
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div
                  className={`w-[200px] h-[180px] rounded-lg overflow-hidden shadow-md transition-all hover:shadow-lg border ${
                    activeCategorySlug === category.slug ? "border-primary border-2" : "border-gray-200"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={category.imageUrl || "/placeholder.svg?height=180&width=200"}
                      alt={category.imageAltText || category.name}
                      fill
                      sizes="200px"
                      className="object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                      <h4 className="font-bold text-white text-xl text-center tracking-wide">
                        {category.name.toUpperCase()}
                      </h4>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-muted-foreground py-8">No hay categorías disponibles</div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
