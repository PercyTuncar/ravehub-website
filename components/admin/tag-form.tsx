"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createTag, updateTag, getTagById } from "@/lib/firebase/blog"
import type { BlogTag } from "@/types"
import { generateSlug } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/admin/image-uploader"
import { SeoPreview } from "@/components/admin/seo-preview"
import { Editor } from "@/components/admin/editor"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"

interface TagFormProps {
  tagId?: string
}

export function TagForm({ tagId }: TagFormProps) {
  const router = useRouter()
  const isEditing = !!tagId

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const [tag, setTag] = useState<Partial<BlogTag>>({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    color: "#3b82f6", // Default color (blue)
    isActive: true,
    featured: false,
    featuredOrder: 0,
    seoTitle: "",
    seoDescription: "",
    metaKeywords: [],
  })

  useEffect(() => {
    if (isEditing) {
      const fetchTag = async () => {
        try {
          const fetchedTag = await getTagById(tagId)
          if (fetchedTag) {
            setTag(fetchedTag)
          } else {
            toast({
              title: "Error",
              description: "No se pudo encontrar la etiqueta",
              variant: "destructive",
            })
            router.push("/admin/blog/etiquetas")
          }
        } catch (error) {
          console.error("Error fetching tag:", error)
          toast({
            title: "Error",
            description: "No se pudo cargar la etiqueta",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }

      fetchTag()
    }
  }, [tagId, isEditing, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Auto-generate slug when name changes
    if (name === "name" && (!tag.slug || tag.slug === generateSlug(tag.name || ""))) {
      setTag({
        ...tag,
        name: value,
        slug: generateSlug(value),
        seoTitle: tag.seoTitle || value,
      })
    } else {
      setTag({ ...tag, [name]: value })
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setTag({ ...tag, [name]: checked })
  }

  const handleDescriptionChange = (content: string) => {
    setTag({ ...tag, description: content })
  }

  const handleImageUpload = async (file: File) => {
    try {
      // Create a reference to Firebase Storage
      const storage = getStorage()
      const fileRef = ref(storage, `blog/tags/${Date.now()}-${file.name}`)

      // Upload the file
      const uploadTask = uploadBytesResumable(fileRef, file)

      // Show loading state
      toast({
        title: "Subiendo imagen",
        description: "Por favor espera mientras se sube la imagen...",
      })

      // Wait for upload to complete
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Optional: Track upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            console.log(`Upload progress: ${progress}%`)
          },
          (error) => {
            reject(error)
          },
          () => {
            resolve()
          },
        )
      })

      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef)

      // Update tag state with the new image URL
      setTag({ ...tag, imageUrl: downloadURL })

      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (!tag.name) {
        throw new Error("El nombre de la etiqueta es obligatorio")
      }

      if (!tag.slug) {
        throw new Error("El slug de la etiqueta es obligatorio")
      }

      // Ensure SEO fields are filled
      const tagToSave = {
        ...tag,
        seoTitle: tag.seoTitle || tag.name,
        seoDescription: tag.seoDescription || `Artículos relacionados con ${tag.name} en RaveHub`,
      }

      if (isEditing) {
        await updateTag(tagId, tagToSave)
        toast({
          title: "Etiqueta actualizada",
          description: "La etiqueta se ha actualizado correctamente",
        })
      } else {
        await createTag(tagToSave as Omit<BlogTag, "id">)
        toast({
          title: "Etiqueta creada",
          description: "La etiqueta se ha creado correctamente",
        })
      }

      router.push("/admin/blog/etiquetas")
    } catch (error) {
      console.error("Error saving tag:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la etiqueta",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="display">Visualización</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre de la Etiqueta *</Label>
                <Input
                  id="name"
                  name="name"
                  value={tag.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Festivales de Verano"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={tag.slug}
                  onChange={handleInputChange}
                  placeholder="festivales-de-verano"
                  required
                />
                <p className="text-sm text-gray-500">
                  El slug se usa en la URL: /blog/etiquetas/<strong>{tag.slug || "ejemplo"}</strong>
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Editor
                  initialContent={tag.description || ""}
                  onChange={handleDescriptionChange}
                  placeholder="Describe esta etiqueta..."
                />
                <p className="text-sm text-gray-500">
                  Esta descripción aparecerá en la página de la etiqueta y ayuda al SEO.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id="color"
                    name="color"
                    value={tag.color}
                    onChange={handleInputChange}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    name="color"
                    value={tag.color}
                    onChange={handleInputChange}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-gray-500">Este color se usará para representar visualmente la etiqueta.</p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Etiqueta Activa</Label>
                <Switch
                  id="isActive"
                  checked={tag.isActive}
                  onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Optimización para Motores de Búsqueda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="seoTitle">Título SEO</Label>
                <Input
                  id="seoTitle"
                  name="seoTitle"
                  value={tag.seoTitle}
                  onChange={handleInputChange}
                  placeholder={tag.name ? `Posts etiquetados con ${tag.name} | RaveHub Blog` : "Título SEO"}
                  maxLength={70}
                />
                <p className="text-sm text-gray-500">{tag.seoTitle?.length || 0}/70 caracteres recomendados</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seoDescription">Descripción SEO</Label>
                <Textarea
                  id="seoDescription"
                  name="seoDescription"
                  value={tag.seoDescription}
                  onChange={handleInputChange}
                  placeholder={
                    tag.name
                      ? `Explora todos los artículos relacionados con ${tag.name} en nuestro blog.`
                      : "Descripción SEO"
                  }
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-gray-500">{tag.seoDescription?.length || 0}/160 caracteres recomendados</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaKeywords">Palabras Clave (separadas por comas)</Label>
                <Input
                  id="metaKeywords"
                  name="metaKeywords"
                  value={Array.isArray(tag.metaKeywords) ? tag.metaKeywords.join(", ") : ""}
                  onChange={(e) => {
                    const keywords = e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean)
                    setTag({ ...tag, metaKeywords: keywords })
                  }}
                  placeholder="rave, festival, música electrónica"
                />
              </div>

              <div className="mt-6 border p-4 rounded-md">
                <h3 className="font-medium mb-2">Vista previa en Google</h3>
                <SeoPreview
                  title={
                    tag.seoTitle ||
                    (tag.name ? `Posts etiquetados con ${tag.name} | RaveHub Blog` : "Título de la Etiqueta")
                  }
                  description={
                    tag.seoDescription ||
                    (tag.name
                      ? `Explora todos los artículos relacionados con ${tag.name} en nuestro blog.`
                      : "Descripción de la etiqueta...")
                  }
                  url={`ravehub.es/blog/etiquetas/${tag.slug || "ejemplo"}`}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Opciones de Visualización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Imagen de la Etiqueta</Label>
                <ImageUploader currentImage={tag.imageUrl} onImageUpload={handleImageUpload} className="h-40" />
                <p className="text-sm text-gray-500">
                  Esta imagen se mostrará en la cabecera de la página de la etiqueta. Tamaño recomendado: 1200x400px.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured">Etiqueta Destacada</Label>
                  <p className="text-sm text-gray-500">
                    Las etiquetas destacadas aparecen en lugares prominentes del sitio.
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={tag.featured}
                  onCheckedChange={(checked) => handleSwitchChange("featured", checked)}
                />
              </div>

              {tag.featured && (
                <div className="grid gap-2">
                  <Label htmlFor="featuredOrder">Orden de Destacado</Label>
                  <Input
                    id="featuredOrder"
                    name="featuredOrder"
                    type="number"
                    min={0}
                    value={tag.featuredOrder}
                    onChange={(e) => setTag({ ...tag, featuredOrder: Number.parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-gray-500">Número menor = mayor prioridad (0 es la más alta)</p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="icon">Ícono (nombre de Lucide)</Label>
                <Input id="icon" name="icon" value={tag.icon || ""} onChange={handleInputChange} placeholder="music" />
                <p className="text-sm text-gray-500">
                  Nombre del ícono de Lucide React (opcional). Ej: music, headphones, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/blog/etiquetas")}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Actualizando..." : "Creando..."}
            </>
          ) : isEditing ? (
            "Actualizar Etiqueta"
          ) : (
            "Crear Etiqueta"
          )}
        </Button>
      </div>
    </form>
  )
}
