"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Check } from "lucide-react"
import { searchCountries, createCountry, getCountryById } from "@/lib/firebase/countries"
import { useToast } from "@/hooks/use-toast"
import type { Country } from "@/lib/firebase/countries"

interface CountryAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onCountrySelect: (country: Country) => void
  placeholder?: string
  className?: string
}

export function CountryAutocomplete({
  value,
  onChange,
  onCountrySelect,
  placeholder = "Buscar país...",
  className
}: CountryAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length >= 2) {
        setLoading(true)
        try {
          const results = await searchCountries(value, 5)
          setSuggestions(results)
          setShowSuggestions(true)
        } catch (error) {
          console.error("Error searching countries:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar las sugerencias de países",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [value, toast])

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country)
    onChange(country.name)
    onCountrySelect(country)
    setShowSuggestions(false)
  }

  const handleCreateNew = async () => {
    if (!value.trim()) return

    // Ask for country code
    const code = prompt(`Ingresa la abreviatura de 2 letras para "${value.trim()}" (ej: PE para Perú, NL para Países Bajos):`)
    if (!code || code.length !== 2) {
      toast({
        title: "Código requerido",
        description: "Debes ingresar una abreviatura de exactamente 2 letras",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      // Determine region based on common knowledge (can be improved)
      const region = getRegionForCountry(value.trim())

      const newCountryId = await createCountry({
        name: value.trim(),
        code: code.toUpperCase(),
        region,
        flag: "🏳️", // Default flag, can be updated later
      })

      const newCountry = await getCountryById(newCountryId)
      if (newCountry) {
        handleSelectCountry(newCountry)
        toast({
          title: "País creado",
          description: `Se agregó "${newCountry.name}" (${newCountry.code}) a la base de datos`,
        })
      }
    } catch (error) {
      console.error("Error creating country:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el país",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedCountry(null)
    onChange("")
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-10"
            onFocus={() => value.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || value.length >= 2) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-2">
            {suggestions.map((country) => (
              <button
                key={country.id}
                type="button"
                onClick={() => handleSelectCountry(country)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left"
              >
                <span className="text-lg">{country.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{country.name}</div>
                  <div className="text-xs text-muted-foreground">{country.code} • {country.region}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {country.code}
                </Badge>
              </button>
            ))}

            {value.length >= 2 && !suggestions.some(s => s.name.toLowerCase() === value.toLowerCase()) && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left border-t mt-2 pt-3"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">
                  {isCreating ? "Creando..." : `Crear "${value}"`}
                </span>
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Country Info */}
      {selectedCountry && (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{selectedCountry.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{selectedCountry.name}</div>
                <div className="text-sm text-muted-foreground">{selectedCountry.code} • {selectedCountry.region}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to determine region based on country name
function getRegionForCountry(countryName: string): string {
  const name = countryName.toLowerCase()

  // South America
  if (['argentina', 'bolivia', 'brasil', 'chile', 'colombia', 'ecuador', 'guyana', 'paraguay', 'perú', 'surinam', 'uruguay', 'venezuela'].some(c => name.includes(c))) {
    return 'América del Sur'
  }

  // Central America
  if (['belice', 'costa rica', 'el salvador', 'guatemala', 'honduras', 'nicaragua', 'panamá'].some(c => name.includes(c))) {
    return 'América Central'
  }

  // North America
  if (['canadá', 'estados unidos', 'méxico', 'canada', 'usa', 'mexico'].some(c => name.includes(c))) {
    return 'América del Norte'
  }

  // Europe
  if (['alemania', 'españa', 'francia', 'italia', 'reino unido', 'portugal', 'holanda', 'belgica', 'suecia', 'noruega', 'dinamarca', 'finlandia', 'irlanda', 'austria', 'suiza', 'polonia', 'rumania', 'grecia', 'turquia'].some(c => name.includes(c))) {
    return 'Europa'
  }

  // Asia
  if (['china', 'japón', 'corea', 'india', 'tailandia', 'vietnam', 'indonesia', 'malasia', 'singapur', 'filipinas', 'rusia', 'arabia saudita', 'emiratos', 'israel'].some(c => name.includes(c))) {
    return 'Asia'
  }

  // Africa
  if (['egipto', 'marruecos', 'sudáfrica', 'nigeria', 'kenia', 'ghana', 'senegal', 'tanzania'].some(c => name.includes(c))) {
    return 'África'
  }

  // Oceania
  if (['australia', 'nueva zelanda', 'fiji', 'samoa'].some(c => name.includes(c))) {
    return 'Oceanía'
  }

  // Caribbean
  if (['cuba', 'jamaica', 'haití', 'republica dominicana', 'puerto rico', 'trinidad', 'tobago', 'barbados', 'bahamas'].some(c => name.includes(c))) {
    return 'Caribe'
  }

  return 'Otro'
}