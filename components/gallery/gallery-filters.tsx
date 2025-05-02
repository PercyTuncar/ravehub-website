"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import type { Album } from "@/types/gallery"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAvailableYears } from "@/lib/firebase/gallery"
import { Calendar, Filter, FolderOpen, X } from "lucide-react"

interface GalleryFiltersProps {
  albums: Album[]
}

export function GalleryFilters({ albums }: GalleryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const album = searchParams.get("album") || ""
    const year = searchParams.get("year") || ""

    setSelectedAlbum(album)
    setSelectedYear(year)

    // Cargar años disponibles
    const loadYears = async () => {
      try {
        const availableYears = await getAvailableYears()
        setYears(availableYears)
      } catch (error) {
        console.error("Error al cargar años:", error)
      } finally {
        setLoading(false)
      }
    }

    loadYears()
  }, [searchParams])

  const handleAlbumChange = (value: string) => {
    setSelectedAlbum(value)
    updateFilters(value, selectedYear)
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    updateFilters(selectedAlbum, value)
  }

  const updateFilters = (album: string, year: string) => {
    const params = new URLSearchParams()

    if (album && album !== "all") {
      params.set("album", album)
    }

    if (year && year !== "all") {
      params.set("year", year)
    }

    const queryString = params.toString()
    router.push(`/galeria${queryString ? `?${queryString}` : ""}`)
  }

  const clearFilters = () => {
    setSelectedAlbum("")
    setSelectedYear("")
    router.push("/galeria")
  }

  const hasFilters = selectedAlbum || selectedYear

  return (
    <div className="relative">
      <div className="sm:hidden mb-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </span>
          {hasFilters && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 ml-2">
              {(selectedAlbum ? 1 : 0) + (selectedYear ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      <motion.div
        className={`space-y-4 bg-card rounded-lg border p-4 sm:p-0 sm:border-0 sm:bg-transparent ${isOpen ? "block" : "hidden sm:block"}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="relative">
              <Select value={selectedAlbum} onValueChange={handleAlbumChange}>
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Todos los eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.slug}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
              </div>
            </div>

            <div className="relative">
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Todos los años" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </div>

          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto" size="sm">
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
