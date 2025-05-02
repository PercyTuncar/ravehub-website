"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateSlug } from "@/lib/utils"
import {
  getCategoryById,
  createCategory,
  updateCategory,
  uploadProductImage,
  getAllCategories,
} from "@/lib/firebase/products"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, Trash } from "lucide-react"
import type { ProductCategory } from "@/types"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategoryFormProps {
  categoryId?: string
}

export function CategoryForm({ categoryId }: CategoryFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingCategory, setLoadingCategory] = useState(!!categoryId)
  const [activeTab, setActiveTab] = useState("basic")

  // Form state
  const [formData, setFormData] = useState<Partial<ProductCategory>>({
    name: "",
    description: "",
    slug: "",
    imageUrl: "",
    isActive: true,
    order: 0,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    imageAltText: "",
    isSubcategory: false,
    parentCategoryId: "",
    subcategories: [],
  })

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  // Keywords state
  const [keywordInput, setKeywordInput] = useState("")

  // Add a new state for parent categories
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([])

  // Load category data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If editing, fetch category data
        if (categoryId) {
          setLoadingCategory(true)
          const category = await getCategoryById(categoryId)
          if (category) {
            setFormData({
              ...category,
              // Ensure numeric values are numbers
              order: typeof category.order === "number" ? category.order : Number.parseInt(category.order as any),
              seoKeywords: category.seoKeywords || [],
              isSubcategory: category.isSubcategory || false,
              parentCategoryId: category.parentCategoryId || "",
              subcategories: category.subcategories || [],
            })
            if (category.imageUrl) {
              setImagePreview(category.imageUrl)
            }
          } else {
            toast({
              title: "Error",
              description: "No se pudo encontrar la categoría",
              variant: "destructive",
            })
            router.push("/admin?tab=categories")
          }
        }

        // Fetch parent categories (categories that are not subcategories)
        const allCategories = await getAllCategories()
        const parentCats = allCategories.filter((cat) => !cat.isSubcategory)

        // If editing a category, filter out the current category from parent options
        if (categoryId) {
          setParentCategories(parentCats.filter((cat) => cat.id !== categoryId))
        } else {
          setParentCategories(parentCats)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos",
          variant: "destructive",
        })
      } finally {
        setLoadingCategory(false)
      }
    }

    fetchData()
  }, [categoryId, router])

  // Handle form input changes
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Remove image
  const removeImage = () => {
    setImagePreview("")
    setImageFile(null)
    handleChange("imageUrl", "")
  }

  // Generate slug from name
  const generateSlugFromName = () => {
    if (formData.name) {
      const slug = generateSlug(formData.name)
      handleChange("slug", slug)
    } else {
      toast({
        title: "Error",
        description: "Primero debes ingresar un nombre para la categoría",
        variant: "destructive",
      })
    }
  }

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim()) {
      const keywords = [...(formData.seoKeywords || [])]
      if (!keywords.includes(keywordInput.trim())) {
        keywords.push(keywordInput.trim())
        handleChange("seoKeywords", keywords)
      }
      setKeywordInput("")
    }
  }

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    const keywords = [...(formData.seoKeywords || [])]
    const index = keywords.indexOf(keyword)
    if (index !== -1) {
      keywords.splice(index, 1)
      handleChange("seoKeywords", keywords)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear una categoría",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!formData.name || !formData.slug) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validate subcategory requirements
    if (formData.isSubcategory && !formData.parentCategoryId) {
      toast({
        title: "Error",
        description: "Si es una subcategoría, debes seleccionar una categoría padre",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Upload image if any
      let imageUrl = formData.imageUrl || ""
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile, categoryId || "categories")
      }

      // Prepare category data
      const categoryData: ProductCategory = {
        ...(formData as ProductCategory),
        imageUrl,
        order: formData.order || 0,
        createdAt: categoryId ? formData.createdAt! : new Date(),
        updatedAt: new Date(),
      }

      if (categoryId) {
        // Update existing category
        await updateCategory(categoryId, categoryData)
        toast({
          title: "Categoría actualizada",
          description: "La categoría ha sido actualizada exitosamente",
        })
      } else {
        // Create new category
        await createCategory(categoryData)
        toast({
          title: "Categoría creada",
          description: "La categoría ha sido creada exitosamente",
        })
      }

      router.push("/admin?tab=categories")
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la categoría",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingCategory) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{categoryId ? "Editar Categoría" : "Crear Nueva Categoría"}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=categories")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : categoryId ? (
              "Actualizar Categoría"
            ) : (
              "Crear Categoría"
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="image">Imagen</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Categoría *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="slug">URL amigable (slug) *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={generateSlugFromName} className="text-xs">
                    Generar desde nombre
                  </Button>
                </div>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="mi-categoria"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL única para la categoría. Solo letras, números y guiones.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Orden</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order || "0"}
                  onChange={(e) => handleChange("order", Number.parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Determina el orden de aparición de la categoría (menor número = mayor prioridad)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Categoría activa</Label>
              </div>

              <div className="space-y-4 mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isSubcategory"
                    checked={formData.isSubcategory}
                    onCheckedChange={(checked) => handleChange("isSubcategory", checked)}
                  />
                  <Label htmlFor="isSubcategory">Es una subcategoría</Label>
                </div>

                {formData.isSubcategory && (
                  <div className="space-y-2">
                    <Label htmlFor="parentCategoryId">Categoría padre *</Label>
                    <Select
                      value={formData.parentCategoryId || ""}
                      onValueChange={(value) => handleChange("parentCategoryId", value)}
                    >
                      <SelectTrigger id="parentCategoryId" className="w-full">
                        <SelectValue placeholder="Seleccionar categoría padre" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.parentCategoryId && formData.isSubcategory && (
                      <p className="text-xs text-red-500">
                        Debes seleccionar una categoría padre para crear una subcategoría
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Tab */}
        <TabsContent value="image" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagen de la Categoría</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Subir imagen</Label>
                <div className="flex items-center gap-2">
                  <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                  <Button variant="outline" size="icon" type="button">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {imagePreview && (
                <div className="relative group mt-4">
                  <div className="relative h-40 w-full rounded-md overflow-hidden border">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt={formData.name || "Preview"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={removeImage}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="imageAltText">Texto alternativo para la imagen</Label>
                <Input
                  id="imageAltText"
                  value={formData.imageAltText || ""}
                  onChange={(e) => handleChange("imageAltText", e.target.value)}
                  placeholder="Descripción de la imagen para SEO"
                />
                <p className="text-xs text-muted-foreground">
                  Texto descriptivo que se mostrará si la imagen no puede cargarse. También es importante para SEO y
                  accesibilidad.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimización para Motores de Búsqueda (SEO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">Título SEO</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle || ""}
                  onChange={(e) => handleChange("seoTitle", e.target.value)}
                  placeholder="Título optimizado para SEO"
                />
                <p className="text-xs text-muted-foreground">
                  Si se deja en blanco, se utilizará el nombre de la categoría. Recomendado: 50-60 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">Descripción SEO</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription || ""}
                  onChange={(e) => handleChange("seoDescription", e.target.value)}
                  placeholder="Descripción optimizada para SEO"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Breve descripción que aparecerá en los resultados de búsqueda. Recomendado: 150-160 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">Palabras clave SEO</Label>
                <div className="flex gap-2">
                  <Input
                    id="seoKeywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Añadir palabra clave"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addKeyword()
                      }
                    }}
                  />
                  <Button type="button" onClick={addKeyword} variant="outline">
                    Añadir
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Palabras clave relevantes para esta categoría. Presiona Enter o haz clic en Añadir para agregar.
                </p>

                {formData.seoKeywords && formData.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.seoKeywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="text-secondary-foreground/70 hover:text-secondary-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=categories")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : categoryId ? (
            "Actualizar Categoría"
          ) : (
            "Crear Categoría"
          )}
        </Button>
      </div>
    </form>
  )
}
