"use client"

import { useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      if (!tags.includes(inputValue.trim())) {
        const newTags = [...tags, inputValue.trim()]
        onChange(newTags)
      }
      setInputValue("")
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      const newTags = tags.slice(0, -1)
      onChange(newTags)
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    onChange(newTags)
  }

  return (
    <div className="border rounded-md p-2 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[120px] border-none focus-visible:ring-0 p-0 h-7"
        placeholder={tags.length === 0 ? "Añade etiquetas y presiona Enter" : ""}
      />
    </div>
  )
}
