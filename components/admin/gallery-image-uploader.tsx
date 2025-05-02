"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import type { Album, GalleryImage } from "@/types/gallery"
import { uploadImage } from "@/lib/firebase/gallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"

interface GalleryImageUploaderProps {
  album: Album
  onImageUploaded: (image: GalleryImage) => void
}

export function GalleryImageUploader({ album, onImageUploaded }: GalleryImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filtrar solo archivos de imagen
    const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"))

    // Crear URLs para previsualizaciones
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file))

    setFiles((prev) => [...prev, ...imageFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 10485760, // 10MB
  })

  const removeFile = (index: number) => {
    // Liberar URL de objeto
    URL.revokeObjectURL(previews[index])

    // Eliminar archivo y preview
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    progressRef.current = 0
    setProgress(0)

    const incrementPerFile = 100 / files.length

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Subir imagen
        const image = await uploadImage(file, album.id, album.slug)

        // Actualizar progreso
        progressRef.current += incrementPerFile
        setProgress(Math.min(Math.round(progressRef.current), 100))

        // Notificar que se ha subido una imagen
        onImageUploaded(image)
      }

      // Limpiar después de subir
      setFiles([])
      setPreviews([])
      setProgress(100)

      toast({
        title: "Imágenes subidas",
        description: `Se han subido ${files.length} imágenes correctamente`,
      })
    } catch (error) {
      console.error("Error al subir imágenes:", error)
      toast({
        title: "Error",
        description: "Ha ocurrido un error al subir las imágenes",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-medium">Arrastra imágenes aquí</h3>
          <p className="text-sm text-muted-foreground">O haz clic para seleccionar archivos (máximo 10MB por imagen)</p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <Card key={index} className="overflow-hidden relative group">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image src={preview || "/placeholder.svg"} alt={`Preview ${index}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            {uploading && <Progress value={progress} className="h-2" />}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFiles([])
                  setPreviews([])
                }}
                disabled={uploading}
              >
                Limpiar
              </Button>
              <Button type="button" onClick={uploadFiles} disabled={uploading || files.length === 0}>
                {uploading ? "Subiendo..." : `Subir ${files.length} imágenes`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
