"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, SlidersHorizontal, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function EventsFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [country, setCountry] = useState(searchParams.get("country") || "")
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date") as string) : undefined,
  )
  const [priceRange, setPriceRange] = useState<[number, number]>([
    searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0,
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 1000,
  ])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams(searchParams.toString())

    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (country) {
      params.set("country", country)
    } else {
      params.delete("country")
    }

    if (date) {
      params.set("date", date.toISOString().split("T")[0])
    } else {
      params.delete("date")
    }

    params.set("minPrice", priceRange[0].toString())
    params.set("maxPrice", priceRange[1].toString())

    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  const resetFilters = () => {
    setCountry("")
    setDate(undefined)
    setPriceRange([0, 1000])

    const params = new URLSearchParams(searchParams.toString())
    params.delete("country")
    params.delete("date")
    params.delete("minPrice")
    params.delete("maxPrice")

    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  const hasActiveFilters = country || date || priceRange[0] > 0 || priceRange[1] < 1000

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Buscar</Button>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant={hasActiveFilters ? "default" : "outline"} size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h3 className="font-medium">Filtros</h3>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Todos los países" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los países</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="Mexico">México</SelectItem>
                    <SelectItem value="Peru">Perú</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
                {date && (
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => setDate(undefined)}>
                    <X className="h-3 w-3 mr-1" /> Limpiar fecha
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Rango de precio</Label>
                  <span className="text-xs text-muted-foreground">
                    {priceRange[0]} - {priceRange[1] === 1000 ? "+" : priceRange[1]}
                  </span>
                </div>
                <Slider
                  defaultValue={priceRange}
                  min={0}
                  max={1000}
                  step={50}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  className="py-4"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Restablecer
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </form>
    </div>
  )
}
