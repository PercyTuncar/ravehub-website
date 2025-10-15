"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Check, Edit } from "lucide-react"
import { searchEventDJs, createEventDJ, updateEventDJ, getEventDJById } from "@/lib/firebase/event-djs"
import { useToast } from "@/components/ui/use-toast"
import type { EventDJ } from "@/types"

interface ArtistAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onArtistSelect: (artist: EventDJ) => void
  placeholder?: string
  className?: string
}

export function ArtistAutocomplete({
  value,
  onChange,
  onArtistSelect,
  placeholder = "Buscar DJ...",
  className
}: ArtistAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<EventDJ[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<EventDJ | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.length >= 2) {
        setLoading(true)
        try {
          const results = await searchEventDJs(value, 5)
          setSuggestions(results)
          setShowSuggestions(true)
        } catch (error) {
          console.error("Error searching DJs:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar las sugerencias de DJs",
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

  const handleSelectArtist = (artist: EventDJ) => {
    setSelectedArtist(artist)
    onChange(artist.name)
    onArtistSelect(artist)
    setShowSuggestions(false)
    setIsEditing(false)
  }

  const handleCreateNew = async () => {
    if (!value.trim()) return

    setIsCreating(true)
    try {
      const newArtistId = await createEventDJ({
        name: value.trim(),
        imageUrl: "",
        description: "",
        approved: true, // Auto-approved for event creation
        createdBy: "event-form",
      })

      const newArtist = await getEventDJById(newArtistId)
      if (newArtist) {
        handleSelectArtist(newArtist)
        toast({
          title: "DJ creado",
          description: `Se creó el perfil de ${newArtist.name}`,
        })
      }
    } catch (error) {
      console.error("Error creating DJ:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el DJ",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditArtist = () => {
    if (selectedArtist) {
      setIsEditing(true)
      setShowSuggestions(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedArtist(null)
    onChange("")
    setIsEditing(false)
    inputRef.current?.focus()
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

        {selectedArtist && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditArtist}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || value.length >= 2) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-2">
            {suggestions.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => handleSelectArtist(artist)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={artist.imageUrl} alt={artist.name} />
                  <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{artist.name}</div>
                  {artist.country && (
                    <div className="text-xs text-muted-foreground">{artist.country}</div>
                  )}
                </div>
                {artist.genres && artist.genres.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {artist.genres[0]}
                  </Badge>
                )}
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

      {/* Selected Artist Info */}
      {selectedArtist && !isEditing && (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedArtist.imageUrl} alt={selectedArtist.name} />
                <AvatarFallback>{selectedArtist.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{selectedArtist.name}</div>
                {selectedArtist.country && (
                  <div className="text-sm text-muted-foreground">{selectedArtist.country}</div>
                )}
                {selectedArtist.instagramHandle && (
                  <div className="text-sm text-muted-foreground">@{selectedArtist.instagramHandle}</div>
                )}
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