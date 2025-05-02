"use client"

import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { generateSlug } from "@/lib/utils"
import {
  getAllCategories,
  getProductById,
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/lib/firebase/products"
import { Plus, Trash, Upload, Loader2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Product, ProductCategory, ProductVariant } from "@/types"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { filterBlobUrls, cleanAltTexts } from "@/lib/firebase/image-utils"

// Después de las importaciones existentes, añadir estas nuevas:

import { PlusCircle, XCircle, Video, ImageIcon, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { ProductVideo } from "@/types"

// Add this constant for Latin American countries
const latinAmericanCountries = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Haití",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
]

interface ProductFormProps {
  productId?: string
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(!!productId)
  const [activeTab, setActiveTab] = useState("basic")

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    shortDescription: "",
    slug: "",
    categoryId: "",
    price: 0,
    currency: "USD",
    discountPercentage: 0,
    stock: 0,
    images: [],
    hasVariants: false,
    gender: "unisex",
    isActive: true,
    // SEO fields
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    imageAltTexts: {},
    // New fields
    eligibleRegions: [],
    videoUrl: "",
    shippingDetails: {
      shippingRate: 0,
      shippingCurrency: "PEN",
      eligibleRegion: "Latinoamérica",
    },
    brand: "RaveHub",
  })

  // Videos state
  const [videos, setVideos] = useState<ProductVideo[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState<string>("")
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null)
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState<string>("")
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState<boolean>(false)
  const [videoProvider, setVideoProvider] = useState<string>("youtube")
  const [mediaItems, setMediaItems] = useState<
    Array<{ id: string; type: "image" | "video"; url: string; thumbnailUrl?: string }>
  >([])
  const { toast } = useToast()

  // Categories
  const [categories, setCategories] = useState<ProductCategory[]>([])

  // Images state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageAltTexts, setImageAltTexts] = useState<{ [key: string]: string }>({})

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    type: "size",
    name: "",
    additionalPrice: 0,
    stock: 0,
    sku: "",
    isActive: true,
  })

  // Keywords state
  const [keywordInput, setKeywordInput] = useState("")

  // Load product data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const allCategories = await getAllCategories()
        setCategories(allCategories)

        // If editing, fetch product data
        if (productId) {
          setLoadingProduct(true)
          const product = await getProductById(productId)
          if (product) {
            setFormData({
              ...product,
              // Ensure numeric values are numbers
              price: typeof product.price === "number" ? product.price : Number.parseFloat(product.price as any),
              discountPercentage:
                typeof product.discountPercentage === "number"
                  ? product.discountPercentage
                  : Number.parseFloat(product.discountPercentage as any) || 0,
              stock: typeof product.stock === "number" ? product.stock : Number.parseInt(product.stock as any),
              seoKeywords: product.seoKeywords || [],
              imageAltTexts: product.imageAltTexts || {},
            })
            setImagePreviews(product.images || [])
            setVariants(product.variants || [])
            setImageAltTexts(product.imageAltTexts || {})
            setVideos(product.videos || [])

            // Initialize media items with both images and videos
            const initialMediaItems = [
              ...(product.images || []).map((url) => ({
                id: url,
                type: "image" as const,
                url,
              })),
              ...(product.videos || []).map((video) => ({
                id: video.id,
                type: "video" as const,
                url: video.url,
                thumbnailUrl: video.thumbnailUrl,
              })),
            ]

            // Sort based on mediaOrder if available
            if (product.mediaOrder && product.mediaOrder.length > 0) {
              initialMediaItems.sort((a, b) => {
                const indexA = product.mediaOrder!.indexOf(a.id)
                const indexB = product.mediaOrder!.indexOf(b.id)
                return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
              })
            }

            setMediaItems(initialMediaItems)
          } else {
            toast({
              title: "Error",
              description: "No se pudo encontrar el producto",
              variant: "destructive",
            })
            router.push("/admin?tab=products")
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos",
          variant: "destructive",
        })
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchData()
  }, [productId, router])

  // Handle form input changes
  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle image uploads
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setImageFiles((prev) => [...prev, ...files])

      // Create previews
      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])

      // Initialize alt texts for new images
      const newAltTexts = { ...imageAltTexts }
      newPreviews.forEach((preview) => {
        newAltTexts[preview] = ""
      })
      setImageAltTexts(newAltTexts)
    }
  }

  // Handle image alt text change
  const handleAltTextChange = (imageUrl: string, altText: string) => {
    const newAltTexts = { ...imageAltTexts }
    newAltTexts[imageUrl] = altText
    setImageAltTexts(newAltTexts)
    handleChange("imageAltTexts", newAltTexts)
  }

  // Remove image
  const removeImage = (index: number) => {
    const imageToRemove = imagePreviews[index]
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))

    // Remove alt text for this image
    const newAltTexts = { ...imageAltTexts }
    delete newAltTexts[imageToRemove]
    setImageAltTexts(newAltTexts)
    handleChange("imageAltTexts", newAltTexts)
  }

  // Función para detectar el tipo de video
  const detectVideoProvider = (url: string): { provider: string; videoId: string | null } => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return { provider: "youtube", videoId: youtubeMatch[1] }
    }

    // Vimeo
    const vimeoRegex =
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?))/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return { provider: "vimeo", videoId: vimeoMatch[3] }
    }

    // Si no coincide con patrones conocidos
    return { provider: "unknown", videoId: null }
  }

  // Función para obtener miniatura de YouTube
  const fetchYouTubeThumbnail = async (videoId: string): Promise<string> => {
    // YouTube proporciona estas URLs de miniatura directamente
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  }

  // Función para añadir un video
  const addVideo = async () => {
    if (!newVideoUrl) {
      toast({
        title: "Error",
        description: "Por favor, ingresa la URL del video",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoadingThumbnail(true)

      const { provider, videoId } = detectVideoProvider(newVideoUrl)
      let thumbnailUrl = ""

      // Si es YouTube y tiene videoId, obtener miniatura automáticamente
      if (provider === "youtube" && videoId) {
        thumbnailUrl = await fetchYouTubeThumbnail(videoId)
      }
      // Si se ha subido una miniatura personalizada
      else if (videoThumbnailFile) {
        // Aquí subiríamos la miniatura y obtendríamos su URL
        const uploadedUrl = await uploadProductImage(videoThumbnailFile, productId || uuidv4())
        thumbnailUrl = uploadedUrl
      }
      // Si no es YouTube o no se proporciona miniatura
      else {
        toast({
          title: "Error",
          description: "Se requiere una miniatura para videos que no son de YouTube",
          variant: "destructive",
        })
        setIsLoadingThumbnail(false)
        return
      }

      const newVideo: ProductVideo = {
        id: uuidv4(),
        url: newVideoUrl,
        thumbnailUrl,
        isExternal: true,
        provider,
        videoId,
        title: `Video de ${provider}`,
        order: videos.length,
      }

      setVideos((prev) => [...prev, newVideo])

      // Añadir a la lista de medios
      setMediaItems((prev) => [
        ...prev,
        {
          id: newVideo.id,
          type: "video",
          url: newVideo.url,
          thumbnailUrl: newVideo.thumbnailUrl,
        },
      ])

      // Limpiar formulario
      setNewVideoUrl("")
      setVideoThumbnailFile(null)
      setVideoThumbnailPreview("")

      toast({
        title: "Video agregado",
        description: "El video ha sido agregado correctamente",
      })
    } catch (error) {
      console.error("Error al agregar video:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al agregar el video",
        variant: "destructive",
      })
    } finally {
      setIsLoadingThumbnail(false)
    }
  }

  // Manejar cambio de archivo de miniatura
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setVideoThumbnailFile(file)
      const preview = URL.createObjectURL(file)
      setVideoThumbnailPreview(preview)
    }
  }

  // Remover video
  const removeVideo = (videoId: string) => {
    setVideos((prev) => prev.filter((video) => video.id !== videoId))
    setMediaItems((prev) => prev.filter((item) => item.id !== videoId))
  }

  // Mover un elemento de media hacia arriba en la lista
  const moveMediaItemUp = (index: number) => {
    if (index === 0) return
    const newMediaItems = [...mediaItems]
    ;[newMediaItems[index - 1], newMediaItems[index]] = [newMediaItems[index], newMediaItems[index - 1]]
    setMediaItems(newMediaItems)
  }

  // Mover un elemento de media hacia abajo en la lista
  const moveMediaItemDown = (index: number) => {
    if (index === mediaItems.length - 1) return
    const newMediaItems = [...mediaItems]
    ;[newMediaItems[index], newMediaItems[index + 1]] = [newMediaItems[index + 1], newMediaItems[index]]
    setMediaItems(newMediaItems)
  }

  // Generate slug from name
  const generateSlugFromName = () => {
    if (formData.name) {
      const slug = generateSlug(formData.name)
      handleChange("slug", slug)
    } else {
      toast({
        title: "Error",
        description: "Primero debes ingresar un nombre para el producto",
        variant: "destructive",
      })
    }
  }

  // Handle variant changes
  const handleVariantChange = (name: string, value: any) => {
    setNewVariant((prev) => ({ ...prev, [name]: value }))
  }

  // Add variant
  const addVariant = () => {
    if (!newVariant.name) {
      toast({
        title: "Error",
        description: "El nombre de la variante es obligatorio",
        variant: "destructive",
      })
      return
    }

    const variant: ProductVariant = {
      id: uuidv4(),
      productId: productId || "",
      type: newVariant.type || "size",
      name: newVariant.name,
      additionalPrice: newVariant.additionalPrice || 0,
      stock: newVariant.stock || 0,
      sku: newVariant.sku || `${formData.name?.substring(0, 3).toUpperCase()}-${newVariant.name}`,
      isActive: newVariant.isActive !== undefined ? newVariant.isActive : true,
    }

    setVariants((prev) => [...prev, variant])
    setNewVariant({
      type: newVariant.type,
      name: "",
      additionalPrice: 0,
      stock: 0,
      sku: "",
      isActive: true,
    })
  }

  // Remove variant
  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id))
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
        description: "Debes iniciar sesión para crear un producto",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!formData.name || !formData.shortDescription || !formData.categoryId) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (imagePreviews.length === 0) {
      toast({
        title: "Error",
        description: "Debes subir al menos una imagen",
        variant: "destructive",
      })
      return
    }

    if (formData.hasVariants && variants.length === 0) {
      toast({
        title: "Error",
        description: "Has indicado que el producto tiene variantes, pero no has agregado ninguna",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Upload new images if any
      let imageUrls: string[] = []

      // Filter out blob URLs from existing images
      const existingImages = filterBlobUrls(imagePreviews)
      imageUrls = [...existingImages]

      // Upload new image files
      const newImageFiles = imageFiles.filter((file) => {
        // Only include files that don't already have a non-blob URL
        const objectUrl = URL.createObjectURL(file)
        return !existingImages.includes(objectUrl)
      })

      let uploadedUrls: string[] = []

      if (newImageFiles.length > 0) {
        const uploadPromises = newImageFiles.map((file) => uploadProductImage(file, productId || uuidv4()))
        uploadedUrls = await Promise.all(uploadPromises)
        imageUrls = [...imageUrls, ...uploadedUrls]
      }

      // Generate slug if not editing
      const slug = formData.slug || generateSlug(formData.name || "")

      // Map alt texts from blob URLs to actual URLs
      const finalAltTexts: { [key: string]: string } = {}

      // First, clean existing alt texts to remove blob entries
      const cleanedAltTexts = cleanAltTexts(imageAltTexts)

      // Then add the cleaned alt texts to our final object
      Object.assign(finalAltTexts, cleanedAltTexts)

      // For newly uploaded images, try to map the alt texts from their blob previews
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i]
        const objectUrl = URL.createObjectURL(file)
        if (imageAltTexts[objectUrl] && i < uploadedUrls.length) {
          finalAltTexts[uploadedUrls[i]] = imageAltTexts[objectUrl]
        }
      }

      // Preparar orden de medios
      const mediaOrder = mediaItems.map((item) => item.id)

      // Prepare product data
      const productData: Product = {
        ...(formData as Product),
        slug,
        images: imageUrls, // Use the filtered image URLs
        videos,
        mediaOrder,
        variants,
        hasVariants: variants.length > 0,
        imageAltTexts: finalAltTexts, // Use the cleaned alt texts
        createdAt: productId ? formData.createdAt! : new Date(),
        updatedAt: new Date(),
      }

      if (productId) {
        // Update existing product
        await updateProduct(productId, productData)
        toast({
          title: "Producto actualizado",
          description: "El producto ha sido actualizado exitosamente",
        })
      } else {
        // Create new product
        await createProduct(productData)
        toast({
          title: "Producto creado",
          description: "El producto ha sido creado exitosamente",
        })
      }

      router.push("/admin?tab=products")
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el producto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{productId ? "Editar Producto" : "Crear Nuevo Producto"}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=products")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : productId ? (
              "Actualizar Producto"
            ) : (
              "Crear Producto"
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="images">Imágenes</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSlugFromName}
                      className="text-xs"
                    >
                      Generar desde nombre
                    </Button>
                  </div>
                  <Input
                    id="slug"
                    value={formData.slug || ""}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="mi-producto-increible"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL única para el producto. Solo letras, números y guiones.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Descripción Corta *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription || ""}
                  onChange={(e) => handleChange("shortDescription", e.target.value)}
                  rows={2}
                  required
                />
                <p className="text-xs text-muted-foreground">Máximo 150 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Completa</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={formData.categoryId || ""}
                    onValueChange={(value) => handleChange("categoryId", value)}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select value={formData.gender || "unisex"} onValueChange={(value) => handleChange("gender", value)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Hombre</SelectItem>
                      <SelectItem value="female">Mujer</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price || ""}
                    onChange={(e) => handleChange("price", Number.parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage || ""}
                    onChange={(e) => handleChange("discountPercentage", Number.parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={formData.currency || "USD"} onValueChange={(value) => handleChange("currency", value)}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="PEN">PEN (S/)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock || ""}
                    onChange={(e) => handleChange("stock", Number.parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist">Artista (opcional)</Label>
                  <Input
                    id="artist"
                    value={formData.artist || ""}
                    onChange={(e) => handleChange("artist", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Producto activo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hasVariants"
                  checked={formData.hasVariants}
                  onCheckedChange={(checked) => handleChange("hasVariants", checked)}
                />
                <Label htmlFor="hasVariants">Tiene variantes (tallas, colores, etc.)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imágenes del Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="images">Subir imágenes</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                    multiple
                  />
                  <Button variant="outline" size="icon" type="button">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Puedes subir múltiples imágenes. La primera imagen será la principal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="space-y-2 border p-4 rounded-md">
                    <div className="relative group">
                      <div className="relative h-40 rounded-md overflow-hidden border">
                        <Image
                          src={preview || "/placeholder.svg"}
                          alt={imageAltTexts[preview] || `Imagen ${index + 1} del producto`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      {index === 0 && <Badge className="absolute bottom-2 left-2">Principal</Badge>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`alt-text-${index}`}>Texto alternativo (Alt)</Label>
                      <Input
                        id={`alt-text-${index}`}
                        value={imageAltTexts[preview] || ""}
                        onChange={(e) => handleAltTextChange(preview, e.target.value)}
                        placeholder="Describe la imagen para SEO y accesibilidad"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-semibold">Videos</h2>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="space-y-2 border p-4 rounded-md">
                    <h3 className="font-medium">Agregar nuevo video</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="videoUrl">URL del video (YouTube, Vimeo, etc.)</Label>
                        <Input
                          id="videoUrl"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="videoThumbnail">Miniatura personalizada (opcional para YouTube)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="videoThumbnail"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {videoProvider === "youtube"
                            ? "Para videos de YouTube, la miniatura se obtendrá automáticamente si no subes una personalizada"
                            : "Para otros proveedores, debes subir una miniatura personalizada"}
                        </p>
                      </div>
                    </div>

                    {videoThumbnailPreview && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Vista previa de miniatura:</p>
                        <div className="relative h-20 w-36 rounded-md overflow-hidden border">
                          <Image
                            src={videoThumbnailPreview || "/placeholder.svg"}
                            alt="Vista previa de miniatura"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <Button type="button" onClick={addVideo} className="mt-2" disabled={isLoadingThumbnail}>
                      {isLoadingThumbnail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Agregar Video
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-semibold">Orden de Imágenes y Videos</h2>
                <p className="text-sm text-muted-foreground">
                  Arrastra y suelta para reordenar las imágenes y videos. El primer elemento será el principal.
                </p>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  {mediaItems.length > 0 ? (
                    mediaItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-4 border p-3 rounded-md">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden border flex-shrink-0">
                          <Image
                            src={item.type === "video" ? item.thumbnailUrl || "/placeholder.svg" : item.url}
                            alt={item.type === "video" ? "Miniatura de video" : "Imagen de producto"}
                            fill
                            className="object-cover"
                          />
                          {item.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <p className="font-medium flex items-center gap-2">
                            {item.type === "video" ? (
                              <>
                                <Video className="h-4 w-4" />
                                Video
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-4 w-4" />
                                Imagen
                              </>
                            )}
                            {index === 0 && <Badge variant="outline">Principal</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => moveMediaItemUp(index)}
                            disabled={index === 0}
                            className="h-8 w-8"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => moveMediaItemDown(index)}
                            disabled={index === mediaItems.length - 1}
                            className="h-8 w-8"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (item.type === "video") {
                                removeVideo(item.id)
                              } else {
                                removeImage(imagePreviews.indexOf(item.url))
                              }
                            }}
                            className="h-8 w-8 text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No hay imágenes ni videos agregados</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variantes del Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.hasVariants ? (
                <Alert>
                  <p>
                    Has indicado que este producto no tiene variantes. Si deseas agregar variantes, activa la opción en
                    la pestaña de Información Básica.
                  </p>
                </Alert>
              ) : (
                <>
                  <div className="space-y-4 border rounded-md p-4">
                    <h3 className="text-lg font-medium">Agregar Nueva Variante</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="variantType">Tipo de Variante</Label>
                        <Select
                          value={newVariant.type || "size"}
                          onValueChange={(value) => handleVariantChange("type", value)}
                        >
                          <SelectTrigger id="variantType">
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="size">Talla</SelectItem>
                            <SelectItem value="color">Color</SelectItem>
                            <SelectItem value="style">Estilo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="variantName">Nombre de la Variante *</Label>
                        <Input
                          id="variantName"
                          value={newVariant.name || ""}
                          onChange={(e) => handleVariantChange("name", e.target.value)}
                          placeholder="Ej: S, M, L, Rojo, Azul, etc."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="variantPrice">Precio Adicional</Label>
                        <Input
                          id="variantPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newVariant.additionalPrice || ""}
                          onChange={(e) => handleVariantChange("additionalPrice", Number.parseFloat(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="variantStock">Stock</Label>
                        <Input
                          id="variantStock"
                          type="number"
                          min="0"
                          value={newVariant.stock || ""}
                          onChange={(e) => handleVariantChange("stock", Number.parseInt(e.target.value))}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="variantSku">SKU (opcional)</Label>
                        <Input
                          id="variantSku"
                          value={newVariant.sku || ""}
                          onChange={(e) => handleVariantChange("sku", e.target.value)}
                          placeholder="Código único"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="variantActive"
                        checked={newVariant.isActive !== undefined ? newVariant.isActive : true}
                        onCheckedChange={(checked) => handleVariantChange("isActive", checked)}
                      />
                      <Label htmlFor="variantActive">Variante activa</Label>
                    </div>

                    <Button type="button" onClick={addVariant} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Variante
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Variantes Agregadas</h3>
                    {variants.length > 0 ? (
                      <div className="space-y-2">
                        {variants.map((variant) => (
                          <div key={variant.id} className="flex justify-between items-center border p-3 rounded-md">
                            <div>
                              <p className="font-medium">
                                {variant.name}{" "}
                                <span className="text-sm text-muted-foreground">
                                  ({variant.type === "size" ? "Talla" : variant.type === "color" ? "Color" : "Estilo"})
                                </span>
                              </p>
                              <div className="text-sm text-muted-foreground">
                                <p>
                                  Precio adicional: ${variant.additionalPrice.toFixed(2)} | Stock: {variant.stock}
                                </p>
                                {variant.sku && <p>SKU: {variant.sku}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!variant.isActive && <Badge variant="outline">Inactivo</Badge>}
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeVariant(variant.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay variantes agregadas</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Field */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marca del Producto</Label>
                <Input
                  id="brand"
                  value={formData.brand || ""}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  placeholder="Nombre de la marca"
                />
                <p className="text-xs text-muted-foreground">
                  Marca del producto. Por defecto es "RaveHub" si se deja en blanco.
                </p>
              </div>

              {/* Video URL Field */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl">URL del Video</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl || ""}
                  onChange={(e) => handleChange("videoUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=exampleVideo"
                />
                <p className="text-xs text-muted-foreground">
                  URL del video de YouTube, Vimeo u otra plataforma que muestre el producto.
                </p>
              </div>

              {/* Shipping Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Detalles de Envío</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingRate">Costo de Envío</Label>
                    <Input
                      id="shippingRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shippingDetails?.shippingRate || ""}
                      onChange={(e) =>
                        handleChange("shippingDetails", {
                          ...formData.shippingDetails,
                          shippingRate: Number.parseFloat(e.target.value),
                        })
                      }
                      placeholder="15.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingCurrency">Moneda de Envío</Label>
                    <Select
                      value={formData.shippingDetails?.shippingCurrency || "PEN"}
                      onValueChange={(value) =>
                        handleChange("shippingDetails", {
                          ...formData.shippingDetails,
                          shippingCurrency: value,
                        })
                      }
                    >
                      <SelectTrigger id="shippingCurrency">
                        <SelectValue placeholder="Selecciona moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="PEN">PEN (S/)</SelectItem>
                        <SelectItem value="MXN">MXN ($)</SelectItem>
                        <SelectItem value="ARS">ARS ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eligibleRegion">Región Elegible</Label>
                    <Input
                      id="eligibleRegion"
                      value={formData.shippingDetails?.eligibleRegion || ""}
                      onChange={(e) =>
                        handleChange("shippingDetails", {
                          ...formData.shippingDetails,
                          eligibleRegion: e.target.value,
                        })
                      }
                      placeholder="Latinoamérica"
                    />
                  </div>
                </div>
              </div>

              {/* Eligible Regions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Regiones Disponibles</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecciona los países donde este producto estará disponible para la venta.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {latinAmericanCountries.map((country) => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-${country}`}
                        checked={(formData.eligibleRegions || []).includes(country)}
                        onCheckedChange={(checked) => {
                          const currentRegions = formData.eligibleRegions || []
                          if (checked) {
                            handleChange("eligibleRegions", [...currentRegions, country])
                          } else {
                            handleChange(
                              "eligibleRegions",
                              currentRegions.filter((r) => r !== country),
                            )
                          }
                        }}
                      />
                      <Label htmlFor={`country-${country}`} className="text-sm font-normal">
                        {country}
                      </Label>
                    </div>
                  ))}
                </div>
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
                  Si se deja en blanco, se utilizará el nombre del producto. Recomendado: 50-60 caracteres.
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
                  Palabras clave relevantes para este producto. Presiona Enter o haz clic en Añadir para agregar.
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
        <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=products")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : productId ? (
            "Actualizar Producto"
          ) : (
            "Crear Producto"
          )}
        </Button>
      </div>
    </form>
  )
}
