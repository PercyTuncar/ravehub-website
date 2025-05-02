"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

interface ImageUploaderProps {
  currentImage?: string
  onImageUpload: (file: File) => void
  className?: string
}

export function ImageUploader({ currentImage, onImageUpload, className = "" }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0])
    }
  }

  const handleRemoveImage = () => {
    // This would typically call a function to remove the image
    // For now, we'll just upload a blank image or handle this in the parent
    // This is a placeholder for that functionality
    console.log("Remove image functionality would go here")
  }

  // Helper function to check if the image URL is valid
  const isValidImageUrl = (url?: string): boolean => {
    return typeof url === "string" && url.trim() !== ""
  }

  return (
    <div
      className={`border-2 border-dashed rounded-md ${
        dragActive ? "border-primary bg-primary/10" : "border-gray-300"
      } ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {currentImage && isValidImageUrl(currentImage) ? (
        <div className="relative w-full h-full">
          <Image
            src={currentImage || "/placeholder.svg"}
            alt="Uploaded image"
            fill
            className="object-cover rounded-md"
          />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemoveImage}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Arrastra una imagen o haz clic para seleccionar</p>
          <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}
