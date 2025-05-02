"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"
import type { ProductCategory } from "@/types"
import { getAllCategories } from "@/lib/firebase/products"
import { useCurrency } from "@/context/currency-context"

interface ProductFiltersProps {
  closeModal?: () => void
}

export function ProductFilters({ closeModal }: ProductFiltersProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "")
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number.parseInt(searchParams.get("minPrice") || "0"),
    Number.parseInt(searchParams.get("maxPrice") || "1000"),
  ])
  const [search, setSearch] = useState<string>(searchParams.get("search") || "")
  const [inStock, setInStock] = useState<boolean>(searchParams.get("inStock") === "true")
  const [onSale, setOnSale] = useState<boolean>(searchParams.get("onSale") === "true")
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sortBy") || "newest")

  const { currency } = useCurrency()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const allCategories = await getAllCategories()
      setCategories(allCategories)
    }
    fetchCategories()
  }, [])

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams()

    if (selectedCategory) params.set("category", selectedCategory)
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
    if (priceRange[1] < 1000) params.set("maxPrice", priceRange[1].toString())
    if (search) params.set("search", search)
    if (inStock) params.set("inStock", "true")
    if (onSale) params.set("onSale", "true")
    if (sortBy) params.set("sortBy", sortBy)

    router.push(`/tienda?${params.toString()}`)

    // Si estamos en móvil y hay una función para cerrar el modal, la llamamos
    if (closeModal) {
      closeModal()
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("")
    setPriceRange([0, 1000])
    setSearch("")
    setInStock(false)
    setOnSale(false)
    setSortBy("newest")
    router.push("/tienda")

    // Si estamos en móvil y hay una función para cerrar el modal, la llamamos
    if (closeModal) {
      closeModal()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Rango de precio</Label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice" className="text-xs text-muted-foreground mb-1 block">
                  Mínimo
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground min-w-[20px]">
                    {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}
                  </div>
                  <Input
                    id="minPrice"
                    type="number"
                    min={0}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (!isNaN(value) && value >= 0 && value <= priceRange[1]) {
                        setPriceRange([value, priceRange[1]])
                      }
                    }}
                    className={`${currency.length > 1 ? "pl-12" : "pl-7"}`}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="maxPrice" className="text-xs text-muted-foreground mb-1 block">
                  Máximo
                </Label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground min-w-[20px]">
                    {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}
                  </div>
                  <Input
                    id="maxPrice"
                    type="number"
                    min={priceRange[0]}
                    max={1000}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (!isNaN(value) && value >= priceRange[0] && value <= 1000) {
                        setPriceRange([priceRange[0], value])
                      }
                    }}
                    className={`${currency.length > 1 ? "pl-12" : "pl-7"}`}
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Slider
                min={0}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="mb-2"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-auto py-1.5"
                onClick={() => setPriceRange([0, 250])}
              >
                {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}0 -{" "}
                {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}250
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-auto py-1.5"
                onClick={() => setPriceRange([250, 500])}
              >
                {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}250 -{" "}
                {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}500
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-auto py-1.5"
                onClick={() => setPriceRange([500, 1000])}
              >
                {currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `}500+
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortBy">Ordenar por</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sortBy">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="priceAsc">Precio: menor a mayor</SelectItem>
              <SelectItem value="priceDesc">Precio: mayor a menor</SelectItem>
              <SelectItem value="nameAsc">Nombre: A-Z</SelectItem>
              <SelectItem value="nameDesc">Nombre: Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="inStock" checked={inStock} onCheckedChange={(checked) => setInStock(checked as boolean)} />
            <Label htmlFor="inStock" className="text-sm">
              Solo productos en stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="onSale" checked={onSale} onCheckedChange={(checked) => setOnSale(checked as boolean)} />
            <Label htmlFor="onSale" className="text-sm">
              Solo productos en oferta
            </Label>
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={resetFilters} className="flex items-center">
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
          <Button size="sm" onClick={applyFilters}>
            Aplicar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
