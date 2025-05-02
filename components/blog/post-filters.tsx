"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, ChevronDown, Filter, ArrowUpDown } from "lucide-react"
import { getAllCategories } from "@/lib/firebase/blog"
import type { BlogCategory } from "@/types"

export function PostFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  // Añadir un estado para el ordenamiento
  const [sortOrder, setSortOrder] = useState("recent")

  useEffect(() => {
    loadCategories()

    // Set search query from URL
    const queryParam = searchParams.get("q")
    if (queryParam) {
      setSearchQuery(queryParam)
    }

    // Set sort order from URL
    const sortParam = searchParams.get("sort")
    if (sortParam) {
      setSortOrder(sortParam)
    }
  }, [searchParams])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const categoriesData = await getAllCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/blog?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/blog")
    }
  }

  // Añadir un manejador para el cambio de ordenamiento
  const handleSortChange = (value: string) => {
    setSortOrder(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.push(`/blog?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
      <form onSubmit={handleSearch} className="relative w-full md:w-auto md:min-w-[320px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar artículos..."
          className="pl-9 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="flex gap-2 w-full md:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1 md:flex-auto">
              <Filter className="h-4 w-4 mr-2" />
              Categorías
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem asChild>
              <Link href="/blog" className="w-full cursor-pointer">
                Todas las categorías
              </Link>
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem key={category.id} asChild>
                <Link href={`/blog/categorias/${category.slug}`} className="w-full cursor-pointer">
                  {category.name} {category.postCount && `(${category.postCount})`}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Añadir el selector de ordenamiento después del dropdown de categorías */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1 md:flex-auto">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === "recent"
                ? "Más recientes"
                : sortOrder === "popular"
                  ? "Más populares"
                  : sortOrder === "oldest"
                    ? "Más antiguos"
                    : "Ordenar por"}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => handleSortChange("recent")}>Más recientes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("popular")}>Más populares</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange("oldest")}>Más antiguos</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
