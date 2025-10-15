"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Pencil, Trash, Star } from "lucide-react"
import type { Artist } from "@/types"

interface ArtistListDraggableProps {
  artists: Artist[]
  onReorder: (fromIndex: number, toIndex: number) => void
  onEdit: (artistId: string) => void
  onRemove: (artistId: string) => void
  onToggleFeatured: (artistId: string) => void
}

export function ArtistListDraggable({
  artists,
  onReorder,
  onEdit,
  onRemove,
  onToggleFeatured,
}: ArtistListDraggableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay artistas agregados
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {artists.map((artist, index) => (
        <Card
          key={artist.id}
          className={`transition-all duration-200 ${
            draggedIndex === index ? "opacity-50 scale-95" : ""
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Artist Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={artist.imageUrl} alt={artist.name} />
                <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
              </Avatar>

              {/* Artist Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{artist.name}</h4>
                  {artist.isFeatured && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Destacado
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                {artist.instagramHandle && (
                  <p className="text-sm text-muted-foreground">
                    @{artist.instagramHandle}
                  </p>
                )}
                {artist.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {artist.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFeatured(artist.id)}
                  className={`${
                    artist.isFeatured
                      ? "text-yellow-600 hover:text-yellow-700"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className={`h-4 w-4 ${artist.isFeatured ? "fill-current" : ""}`} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(artist.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(artist.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}