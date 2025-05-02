"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Trash2, Upload, Youtube, ImageIcon, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { createStoreBanner, updateStoreBanner, uploadBannerImage, getStoreBannerById } from "@/lib/firebase/banners"
import { getAllProducts } from "@/lib/firebase/products"
import { toast } from "@/components/ui/use-toast"
import type { StoreBanner, Product } from "@/types"
import { cn } from "@/lib/utils"

interface BannerFormProps {
  bannerId?: string
  onSuccess?: () => void
}

export function BannerForm({ bannerId, onSuccess }: BannerFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mediaTab, setMediaTab] = useState<"image" | "video">("image")
  const [hasDiscount, setHasDiscount] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState<Partial<StoreBanner>>({
    title: "",
    description: "",
    linkUrl: "",
    price: 0,
    hasDiscount: false,
    discountPercentage: 0,
    mediaType: "image",
    mediaUrl: "",
    videoProvider: "youtube",
    videoId: "",
    isActive: true,
    order: 0,
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getAllProducts()
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        })
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    if (bannerId) {
      const fetchBanner = async () => {
        try {
          const banner = await getStoreBannerById(bannerId)
          if (banner) {
            setFormData(banner)
            setHasDiscount(banner.hasDiscount || false)
            setMediaTab(banner.mediaType || "image")
            if (banner.mediaType === "image" && banner.mediaUrl) {
              setPreviewUrl(banner.mediaUrl)
            }
          }
        } catch (error) {
          console.error("Error fetching banner:", error)
          toast({
            title: "Error",
            description: "No se pudo cargar la información del banner",
            variant: "destructive",
          })
        }
      }
      fetchBanner()
    }
  }, [bannerId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "price" || name === "discountPercentage") {
      setFormData({
        ...formData,
        [name]: Number.parseFloat(value) || 0,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSwitchChange = (checked: boolean, name: string) => {
    if (name === "hasDiscount") {
      setHasDiscount(checked)
    }

    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      const url = await uploadBannerImage(file)
      setPreviewUrl(url)
      setFormData({
        ...formData,
        mediaType: "image",
        mediaUrl: url,
      })
      toast({
        title: "Imagen subida",
        description: "La imagen se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    let videoId = ""
    let provider = "other"

    // Extraer ID de YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      provider = "youtube"
      if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] || ""
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || ""
      }
    }
    // Extraer ID de Vimeo
    else if (url.includes("vimeo.com")) {
      provider = "vimeo"
      videoId = url.split("vimeo.com/")[1]?.split("?")[0] || ""
    }

    setFormData({
      ...formData,
      mediaType: "video",
      mediaUrl: url,
      videoProvider: provider as "youtube" | "vimeo" | "other",
      videoId,
    })
  }

  const handleProductSelect = (productSlug: string) => {
    setFormData({
      ...formData,
      linkUrl: `/tienda/${productSlug}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.mediaUrl) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios: título y media",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const bannerData = {
        ...formData,
        mediaType: mediaTab,
      }

      if (!hasDiscount) {
        bannerData.discountPercentage = 0
      }

      if (bannerId) {
        await updateStoreBanner(bannerId, bannerData)
        toast({
          title: "Banner actualizado",
          description: "El banner se ha actualizado correctamente",
        })
      } else {
        // Si es un nuevo banner, asignar el orden más alto
        if (!bannerData.order) {
          bannerData.order = Date.now() // Usar timestamp como orden por defecto
        }
        await createStoreBanner(bannerData as Omit<StoreBanner, "id" | "createdAt" | "updatedAt">)
        toast({
          title: "Banner creado",
          description: "El banner se ha creado correctamente",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/store/banners")
      }
    } catch (error) {
      console.error("Error saving banner:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el banner",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" name="title" value={formData.title || ""} onChange={handleInputChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">URL del producto</Label>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {formData.linkUrl
                      ? products.find((product) => `/tienda/${product.slug}` === formData.linkUrl)?.name ||
                        "Selecciona un producto"
                      : "Selecciona un producto"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar producto..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.slug}
                            onSelect={(currentValue) => {
                              handleProductSelect(currentValue)
                              document.dispatchEvent(new Event("popover.close"))
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.linkUrl === `/tienda/${product.slug}` ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.linkUrl ? `URL: ${formData.linkUrl}` : "Selecciona un producto para generar la URL"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ""}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasDiscount">Tiene descuento</Label>
                <Switch
                  id="hasDiscount"
                  checked={hasDiscount}
                  onCheckedChange={(checked) => handleSwitchChange(checked, "hasDiscount")}
                />
              </div>

              {hasDiscount && (
                <div className="pt-2">
                  <Label htmlFor="discountPercentage">Porcentaje de descuento</Label>
                  <Input
                    id="discountPercentage"
                    name="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.discountPercentage || ""}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Activo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleSwitchChange(checked, "isActive")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Contenido multimedia *</Label>
          <Tabs value={mediaTab} onValueChange={(value) => setMediaTab(value as "image" | "video")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Imagen</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  {previewUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-md">
                      <Image src={previewUrl || "/placeholder.svg"} alt="Vista previa" fill className="object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreviewUrl(null)
                          setFormData({
                            ...formData,
                            mediaUrl: "",
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Haz clic para subir una imagen</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </CardContent>
              </Card>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {isLoading ? "Subiendo..." : "Subir imagen"}
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">URL del video (YouTube, Vimeo, etc.)</Label>
                    <div className="flex items-center space-x-2">
                      <Youtube className="h-5 w-5 text-muted-foreground" />
                      <Input
                        id="videoUrl"
                        name="mediaUrl"
                        value={formData.mediaUrl || ""}
                        onChange={handleVideoUrlChange}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  </div>

                  {formData.videoId && formData.videoProvider === "youtube" && (
                    <div className="mt-4">
                      <Label>Vista previa</Label>
                      <div className="aspect-video mt-2 rounded-md overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${formData.videoId}`}
                          title="YouTube video player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}

                  {formData.videoId && formData.videoProvider === "vimeo" && (
                    <div className="mt-4">
                      <Label>Vista previa</Label>
                      <div className="aspect-video mt-2 rounded-md overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://player.vimeo.com/video/${formData.videoId}`}
                          title="Vimeo video player"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/store/banners")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : bannerId ? "Actualizar banner" : "Crear banner"}
        </Button>
      </div>
    </form>
  )
}
