"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { generateSlug } from "@/lib/utils"
import { getCategoryById, createCategory, updateCategory, uploadBlogImage } from "@/lib/firebase/blog"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { BlogCategory } from "@/types"
import Image from "next/image"

interface BlogCategoryFormProps {
  categoryId?: string
  isEditing: boolean
}

export default function CategoryFormPage({ categoryId, isEditing }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(!!categoryId)

  // Form state
  const [formData, setFormData] = useState<Partial<BlogCategory>>({
    name: "",
    slug: "",
    description: "",
    order: 0,
    isActive: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
  })

  // Image state
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  // Load category data if editing
  useEffect(() => {
    if (isEditing && categoryId) {
      const fetchCategory = async () => {
        try {
          setLoadingCategory(true)
          const category = await getCategoryById(categoryId)
          if (category) {
            setFormData(category)

            if (category.imageUrl) {
              setImagePreview(category.imageUrl)
            }
          } else {
            toast({
              title: "Error",
              description: "No se pudo encontrar la categoría",
              variant: "destructive",
            })
            router.push("/admin/blog")
          }
        } catch (error) {
          console.error("Error fetching category:", error)
          toast({
            title: "Error",
            description: "Ocurrió un error al cargar la categoría",
            variant: "destructive",
          })
        } finally {
          setLoadingCategory(false)
        }
      }

      fetchCategory()
    }
  }, [categoryId, router, isEditing])

  // Handle form input changes
  const handleChange = (name: string, value: any) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }))
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCategoryImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "El nombre es requerido",
          variant: "destructive",
        })
        return
      }

      if (!formData.slug) {
        toast({
          title: "Error",
          description: "El slug es requerido",
          variant: "destructive",
        })
        return
      }

      let imageUrl = formData.imageUrl || ""

      if (categoryImage) {
        const uploadResult = await uploadBlogImage(categoryImage)
        if (uploadResult && uploadResult.imageUrl) {
          imageUrl = uploadResult.imageUrl
        } else {
          toast({
            title: "Error",
            description: "Error al subir la imagen",
            variant: "destructive",
          })
          return
        }
      }

      const categoryData = {
        ...formData,
        imageUrl,
        seoKeywords: typeof formData.seoKeywords === "string" ? formData.seoKeywords.split(",") : formData.seoKeywords,
      }

      if (isEditing && categoryId) {
        await updateCategory(categoryId, categoryData)
        toast({
          title: "Success",
          description: "Categoría actualizada correctamente",
        })
      } else {
        await createCategory(categoryData)
        toast({
          title: "Success",
          description: "Categoría creada correctamente",
        })
      }

      router.push("/admin/blog")
    } catch (error) {
      console.error("Error creating/updating category:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la categoría",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Categoría" : "Crear Categoría"}</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingCategory ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin h-6 w-6" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  type="text"
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  onBlur={(e) => {
                    if (!formData.slug) {
                      handleChange("slug", generateSlug(e.target.value))
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Orden</Label>
                <Input
                  type="number"
                  id="order"
                  value={formData.order || 0}
                  onChange={(e) => handleChange("order", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="isActive">Activo</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive || false}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
              </div>
            </div>
            <Separator />
            <div>
              <Label htmlFor="seoTitle">SEO Título</Label>
              <Input
                type="text"
                id="seoTitle"
                value={formData.seoTitle || ""}
                onChange={(e) => handleChange("seoTitle", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seoDescription">SEO Descripción</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription || ""}
                onChange={(e) => handleChange("seoDescription", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seoKeywords">SEO Palabras Clave (separadas por comas)</Label>
              <Input
                type="text"
                id="seoKeywords"
                value={formData.seoKeywords?.join(",") || ""}
                onChange={(e) => handleChange("seoKeywords", e.target.value)}
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="image">Imagen</Label>
              <Input type="file" id="image" accept="image/*" onChange={handleImageUpload} />
              {imagePreview && (
                <div className="relative w-32 h-32 mt-2">
                  <Image
                    src={imagePreview || "/placeholder.svg"}
                    alt="Category Preview"
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
            <Button disabled={loading} type="submit">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : categoryId ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
