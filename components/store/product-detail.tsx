"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, Video } from "lucide-react"
import type { Product, ProductVariant } from "@/types"
import { getApprovedProductReviews } from "@/lib/firebase/reviews"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  // Verificar que el producto tenga todas las propiedades necesarias
  if (!product || typeof product !== "object") {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Error al cargar el producto</h2>
        <p>No se pudo cargar la información del producto correctamente.</p>
      </div>
    )
  }

  // Asegurarse de que todas las propiedades requeridas existan
  const safeProduct = {
    ...product,
    images: Array.isArray(product.images) ? product.images : [],
    videos: Array.isArray(product.videos) ? product.videos : [],
    mediaOrder: Array.isArray(product.mediaOrder) ? product.mediaOrder : [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    specifications: Array.isArray(product.specifications) ? product.specifications : [],
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    stock: typeof product.stock === "number" ? product.stock : 0,
    price: typeof product.price === "number" ? product.price : 0,
    discountPercentage: typeof product.discountPercentage === "number" ? product.discountPercentage : 0,
    currency: product.currency || "USD",
    rating: typeof product.rating === "number" ? product.rating : 5,
  }

  // Función para formatear precios con separador de miles
  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Función para obtener el símbolo de la moneda
  const getCurrencySymbol = (currencyCode: string): string => {
    switch (currencyCode?.toUpperCase()) {
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "GBP":
        return "£"
      case "JPY":
        return "¥"
      case "CNY":
        return "¥"
      case "PEN":
        return "S/"
      case "CLP":
        return "$"
      case "COP":
        return "$"
      case "MXN":
        return "$"
      case "ARS":
        return "$"
      case "BRL":
        return "R$"
      default:
        return ""
    }
  }
  const { currency, formatCurrency } = useCurrency()
  const { addItem } = useCart()
  const [selectedImage, setSelectedImage] = useState(safeProduct.images[0] || "/placeholder.svg?height=400&width=400")
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    safeProduct.variants && safeProduct.variants.length > 0 ? safeProduct.variants[0] : null,
  )
  const [selectedSize, setSelectedSize] = useState<string>(
    safeProduct.sizes && safeProduct.sizes.length > 0 ? safeProduct.sizes[0] : "",
  )
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [, forceUpdate] = useState(0)
  const [reviewCount, setReviewCount] = useState<number>(0)

  const [displayPrice, setDisplayPrice] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const mountedRef = useRef(true)
  const requestAttemptsRef = useRef(0)
  const maxRequestAttempts = 5 // Número máximo de intentos
  const requestIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Organizar medios (imágenes y videos) según mediaOrder
  const organizedMedia = useMemo(() => {
    try {
      const allMedia = [
        ...safeProduct.images.map((url) => ({ id: url, type: "image" as const, url })),
        ...(safeProduct.videos || []).map((video) => ({
          id: video.id || `video-${Math.random().toString(36).substring(7)}`,
          type: "video" as const,
          url: video.url || "",
          thumbnailUrl: video.thumbnailUrl || "",
          provider: video.provider || "custom",
          videoId: video.videoId || "",
        })),
      ]

      // Si hay un orden definido, usarlo para ordenar los medios
      if (safeProduct.mediaOrder && safeProduct.mediaOrder.length > 0) {
        allMedia.sort((a, b) => {
          const indexA = safeProduct.mediaOrder!.indexOf(a.id)
          const indexB = safeProduct.mediaOrder!.indexOf(b.id)
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
        })
      }

      return allMedia
    } catch (error) {
      console.error("Error organizing media:", error)
      return []
    }
  }, [safeProduct.images, safeProduct.videos, safeProduct.mediaOrder])

  // Imagen o video principal seleccionado
  const [selectedMediaItem, setSelectedMediaItem] = useState(() => {
    return organizedMedia.length > 0 ? organizedMedia[0] : null
  })

  // Función para reproducir/pausar video
  const toggleVideoPlayback = (videoItem: any) => {
    if (currentVideoId === videoItem.id) {
      // Ya está seleccionado este video, toggle play/pause
      if (isPlayingVideo) {
        videoRef.current?.pause()
        setIsPlayingVideo(false)
      } else {
        videoRef.current?.play()
        setIsPlayingVideo(true)
      }
    } else {
      // Nuevo video seleccionado
      setSelectedMediaItem(videoItem)
      setCurrentVideoId(videoItem.id)
      setIsPlayingVideo(true)
      // El video se reproducirá automáticamente cuando se cargue
    }
  }

  // Cerrar video al cambiar a imagen
  useEffect(() => {
    if (selectedMediaItem?.type === "image") {
      setIsPlayingVideo(false)
      setCurrentVideoId(null)
    }
  }, [selectedMediaItem])

  // Manejar reproducción automática cuando se selecciona un video
  useEffect(() => {
    if (selectedMediaItem?.type === "video" && videoRef.current) {
      videoRef.current.play().catch((e) => {
        console.error("Error al reproducir video automáticamente:", e)
        setIsPlayingVideo(false)
      })
    }
  }, [selectedMediaItem])

  // Calculate final price with discount if applicable
  const finalPrice = safeProduct.discountPercentage
    ? safeProduct.price * (1 - safeProduct.discountPercentage / 100)
    : safeProduct.price

  // Handle add to cart
  const handleAddToCart = () => {
    setIsAdding(true)

    // Add item to cart
    addItem({
      productId: safeProduct.id,
      variantId: selectedVariant?.id,
      name: safeProduct.name,
      price: finalPrice,
      currency: safeProduct.currency,
      quantity,
      image: selectedImage,
      variantName: selectedVariant?.name,
      stock: safeProduct.stock,
    })

    setTimeout(() => setIsAdding(false), 500)
  }

  // Get alt text for image
  const getImageAltText = (imageUrl: string, index: number) => {
    if (safeProduct.imageAltTexts && safeProduct.imageAltTexts[imageUrl]) {
      return safeProduct.imageAltTexts[imageUrl]
    }
    return `${safeProduct.name} - Imagen ${index + 1}`
  }

  // Solicitar la moneda actual al Navbar de forma más agresiva
  const requestCurrentCurrency = useCallback(() => {
    try {
      // Incrementar el contador de intentos
      requestAttemptsRef.current += 1

      console.log(`ProductDetail: Solicitando moneda actual al Navbar (intento ${requestAttemptsRef.current})`)

      // Emitir evento para solicitar la moneda actual
      window.dispatchEvent(new CustomEvent("request-currency"))

      // Solicitar más agresivamente al inicio
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!currency && mountedRef.current) {
            console.log(`ProductDetail: Solicitud agresiva inicial ${i + 1}`)
            window.dispatchEvent(new CustomEvent("request-currency"))
          }
        }, i * 50)
      }

      // Si ya tenemos la moneda o hemos alcanzado el máximo de intentos, detener las solicitudes
      if (currency || requestAttemptsRef.current >= maxRequestAttempts) {
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current)
          requestIntervalRef.current = null
        }
      }
    } catch (error) {
      console.error("Error requesting currency:", error)
    }
  }, [currency])

  // Iniciar solicitudes periódicas de moneda de forma más agresiva
  const startCurrencyPolling = useCallback(() => {
    try {
      // Solicitar inmediatamente
      requestCurrentCurrency()

      // Configurar solicitudes periódicas cada 100ms (más frecuente)
      requestIntervalRef.current = setInterval(() => {
        if (mountedRef.current && !currency) {
          requestCurrentCurrency()
          console.log(`ProductDetail: Intento agresivo ${requestAttemptsRef.current} para obtener moneda`)
        } else if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current)
          requestIntervalRef.current = null
        }
      }, 100) // Reducido de 200ms a 100ms

      // Establecer un tiempo máximo para el polling (2 segundos - más tiempo)
      setTimeout(() => {
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current)
          requestIntervalRef.current = null

          // Si después de 2 segundos no tenemos moneda, usar la moneda del producto
          if (!currency) {
            console.log(
              `ProductDetail: No se pudo obtener moneda del Navbar, usando moneda del producto: ${safeProduct.currency}`,
            )
            // Forzar actualización con la moneda del producto
            forceUpdate((prev) => prev + 1)
          }
        }
      }, 2000) // Aumentado de 1000ms a 2000ms
    } catch (error) {
      console.error("Error starting currency polling:", error)
    }
  }, [currency, requestCurrentCurrency, safeProduct.currency])

  // Escuchar la respuesta del Navbar con la moneda actual
  useEffect(() => {
    try {
      const handleCurrencyResponse = (event: CustomEvent) => {
        const newCurrency = event.detail
        if (!newCurrency) return

        console.log(`ProductDetail: Recibida respuesta de moneda: ${newCurrency}`)

        // Detener el polling si está activo
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current)
          requestIntervalRef.current = null
        }

        // Forzar actualización con la nueva moneda
        forceUpdate((prev) => prev + 1)
      }

      // Escuchar respuestas de moneda
      window.addEventListener("currency-response", handleCurrencyResponse as EventListener)

      // Iniciar el polling de moneda inmediatamente al montar el componente
      startCurrencyPolling()

      return () => {
        mountedRef.current = false

        // Limpiar el intervalo si existe
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current)
          requestIntervalRef.current = null
        }

        window.removeEventListener("currency-response", handleCurrencyResponse as EventListener)
      }
    } catch (error) {
      console.error("Error in currency response effect:", error)
      return () => {}
    }
  }, [startCurrencyPolling])

  // Escuchar cambios de moneda
  useEffect(() => {
    try {
      const handleCurrencyChange = (event: CustomEvent) => {
        const newCurrency = event.detail
        console.log(`ProductDetail: Evento currency-changed recibido: ${newCurrency}`)

        // Mostrar animación
        setIsUpdating(true)

        // Forzar actualización con la nueva moneda
        forceUpdate((prev) => prev + 1)

        // Ocultar animación después de un tiempo
        setTimeout(() => {
          setIsUpdating(false)
        }, 2000)
      }

      // Escuchar cambios de moneda
      window.addEventListener("currency-changed", handleCurrencyChange as EventListener)

      return () => {
        window.removeEventListener("currency-changed", handleCurrencyChange as EventListener)
      }
    } catch (error) {
      console.error("Error in currency change effect:", error)
      return () => {}
    }
  }, [])

  // Añadir este useEffect después del useEffect que escucha "currency-changed"
  useEffect(() => {
    try {
      const handleCurrencyHover = (event: CustomEvent) => {
        const hoveredCurrency = event.detail
        if (hoveredCurrency && hoveredCurrency !== currency) {
          console.log(`ProductDetail: Moneda en hover: ${hoveredCurrency}`)

          // Mostrar animación de actualización
          setIsUpdating(true)

          // Si hay descuento, mostrar ambos precios
          if (safeProduct.discountPercentage) {
            const originalPrice = formatCurrency(safeProduct.price, safeProduct.currency, hoveredCurrency)
            const discountedPrice = formatCurrency(finalPrice, safeProduct.currency, hoveredCurrency)
            setDisplayPrice(
              `${getCurrencySymbol(hoveredCurrency)} ${formatPrice(Number.parseFloat(originalPrice))} ${hoveredCurrency} - ${getCurrencySymbol(hoveredCurrency)} ${formatPrice(Number.parseFloat(discountedPrice))} ${hoveredCurrency}`,
            )
          } else {
            // Si no hay descuento, mostrar solo el precio final
            setDisplayPrice(
              `${getCurrencySymbol(hoveredCurrency)} ${formatPrice(Number.parseFloat(formatCurrency(finalPrice, safeProduct.currency, hoveredCurrency)))} ${hoveredCurrency}`,
            )
          }
        }
      }

      const handleCurrencyHoverEnd = () => {
        // Restaurar el precio original
        setDisplayPrice(null)
        setIsUpdating(false)
      }

      window.addEventListener("currency-hover", handleCurrencyHover as EventListener)
      window.addEventListener("currency-hover-end", handleCurrencyHoverEnd as EventListener)

      return () => {
        window.removeEventListener("currency-hover", handleCurrencyHover as EventListener)
        window.removeEventListener("currency-hover-end", handleCurrencyHoverEnd as EventListener)
      }
    } catch (error) {
      console.error("Error in currency hover effect:", error)
      return () => {}
    }
  }, [currency, finalPrice, safeProduct.currency, safeProduct.price, safeProduct.discountPercentage, formatCurrency])

  // Añadir este useEffect después del useEffect que escucha "currency-changed"
  useEffect(() => {
    try {
      console.log("ProductDetail: Navegación detectada a página de detalle de producto")

      // Reiniciar contador de intentos
      requestAttemptsRef.current = 0

      // Iniciar polling agresivo
      startCurrencyPolling()

      // Emitir evento para notificar que estamos en la página de detalle
      window.dispatchEvent(new CustomEvent("product-detail-mounted"))

      return () => {
        // Limpiar al desmontar
        if (requestIntervalRef.current) {
          clearInterval(requestIntervalRef.current)
          requestIntervalRef.current = null
        }
      }
    } catch (error) {
      console.error("Error in navigation effect:", error)
      return () => {}
    }
  }, [startCurrencyPolling]) // Se ejecuta solo al montar el componente

  // Añadir este useEffect después del useEffect que escucha "currency-changed"
  useEffect(() => {
    try {
      // Este efecto se ejecuta cada vez que cambia la moneda
      if (currency) {
        console.log(`ProductDetail: Actualizando precios con moneda: ${currency}`)
        // Forzar actualización de la interfaz
        forceUpdate((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error in currency update effect:", error)
    }
  }, [currency])

  // Fetch review count when component loads
  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        if (safeProduct.id) {
          const reviews = await getApprovedProductReviews(safeProduct.id)
          setReviewCount(reviews.length)
        }
      } catch (error) {
        console.error("Error fetching review count:", error)
        setReviewCount(0)
      }
    }

    fetchReviewCount()
  }, [safeProduct.id])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
          {selectedMediaItem?.type === "image" ? (
            <Image
              src={selectedMediaItem.url || "/placeholder.svg"}
              alt={getImageAltText(selectedMediaItem.url, 0)}
              fill
              className="object-contain p-4"
              priority
            />
          ) : selectedMediaItem?.type === "video" &&
            selectedMediaItem.provider === "youtube" &&
            selectedMediaItem.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${selectedMediaItem.videoId}?autoplay=1&mute=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : selectedMediaItem?.type === "video" &&
            selectedMediaItem.provider === "vimeo" &&
            selectedMediaItem.videoId ? (
            <iframe
              src={`https://player.vimeo.com/video/${selectedMediaItem.videoId}?autoplay=1`}
              title="Vimeo video player"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : selectedMediaItem?.type === "video" ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={selectedMediaItem.url}
                controls
                className="absolute inset-0 w-full h-full object-contain"
                onPlay={() => setIsPlayingVideo(true)}
                onPause={() => setIsPlayingVideo(false)}
              />
              {!isPlayingVideo && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                  onClick={() => toggleVideoPlayback(selectedMediaItem)}
                >
                  <div className="bg-white/80 rounded-full p-3">
                    <Video className="h-10 w-10 text-primary" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">No hay medios disponibles</div>
          )}
          {safeProduct.discountPercentage > 0 && (
            <Badge className="absolute top-4 right-4 bg-red-500 hover:bg-red-600">
              -{safeProduct.discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {organizedMedia.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {organizedMedia.map((mediaItem, index) => (
              <button
                key={mediaItem.id || `media-${index}`}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                  selectedMediaItem?.id === mediaItem.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedMediaItem(mediaItem)}
                aria-label={mediaItem.type === "image" ? `Ver imagen ${index + 1}` : `Ver video ${index + 1}`}
              >
                <Image
                  src={mediaItem.type === "image" ? mediaItem.url : mediaItem.thumbnailUrl || "/placeholder.svg"}
                  alt={
                    mediaItem.type === "image"
                      ? getImageAltText(mediaItem.url, index)
                      : `Miniatura de video ${index + 1}`
                  }
                  fill
                  className="object-cover"
                />
                {mediaItem.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{safeProduct.name}</h1>
          <div className="flex items-center mt-2 space-x-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < (safeProduct.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{reviewCount} reseñas</span>
          </div>
        </div>

        <div className="space-y-1">
          {safeProduct.discountPercentage > 0 ? (
            <>
              <div
                className={`text-xl line-through text-muted-foreground transition-all duration-300 ${isUpdating ? "animate-pulse" : ""}`}
                key={`original-${currency}-${forceUpdate}`}
              >
                {displayPrice && displayPrice.includes("-")
                  ? displayPrice.split("-")[0].trim()
                  : currency
                    ? `${getCurrencySymbol(currency)} ${formatPrice(Number.parseFloat(formatCurrency(safeProduct.price, safeProduct.currency, currency)))} ${currency}`
                    : `${getCurrencySymbol(safeProduct.currency)} ${formatPrice(safeProduct.price)} ${safeProduct.currency}`}
              </div>
              <div
                className={`text-3xl font-bold text-primary transition-all duration-300 ${isUpdating ? "animate-pulse" : ""}`}
                key={`discounted-${currency}-${forceUpdate}`}
              >
                {displayPrice && displayPrice.includes("-")
                  ? displayPrice.split("-")[1].trim()
                  : currency
                    ? `${getCurrencySymbol(currency)} ${formatPrice(Number.parseFloat(formatCurrency(finalPrice, safeProduct.currency, currency)))} ${currency}`
                    : `${getCurrencySymbol(safeProduct.currency)} ${formatPrice(finalPrice)} ${safeProduct.currency}`}
              </div>
            </>
          ) : (
            <div
              className={`text-3xl font-bold text-primary transition-all duration-300 ${isUpdating ? "animate-pulse" : ""}`}
              key={`price-${currency}-${forceUpdate}`}
            >
              {displayPrice ||
                (currency
                  ? `${getCurrencySymbol(currency)} ${formatPrice(Number.parseFloat(formatCurrency(finalPrice, safeProduct.currency, currency)))} ${currency}`
                  : `${getCurrencySymbol(safeProduct.currency)} ${formatPrice(finalPrice)} ${safeProduct.currency}`)}
            </div>
          )}
          {isUpdating && <div className="text-xs text-green-600 mt-1">Precio actualizado a {currency}</div>}

          <div className="text-sm text-muted-foreground">
            {safeProduct.stock > 0 ? (
              <span className="text-green-600">En stock ({safeProduct.stock} disponibles)</span>
            ) : (
              <span className="text-red-600">Agotado</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Short Description */}
        <div>
          <h2 className="text-lg font-medium mb-2">Descripción</h2>
          <p>{safeProduct.shortDescription}</p>
        </div>

        {/* Variants */}
        {safeProduct.variants && safeProduct.variants.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Color:</h3>
              <div className="flex flex-wrap gap-2">
                {safeProduct.variants.map((variant) => (
                  <button
                    key={variant.id || `variant-${Math.random()}`}
                    className={`relative h-12 w-12 overflow-hidden rounded-full border ${
                      selectedVariant?.id === variant.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                    title={variant.name}
                    aria-label={`Seleccionar variante ${variant.name}`}
                  >
                    <Image
                      src={variant.imageUrl || "/placeholder.svg?height=50&width=50"}
                      alt={variant.name || "Variante de producto"}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sizes */}
        {safeProduct.sizes && safeProduct.sizes.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Talla:</h3>
              <div className="flex flex-wrap gap-2">
                {safeProduct.sizes.map((size) => (
                  <button
                    key={size}
                    className={`h-10 min-w-[2.5rem] rounded-md border px-2 text-center ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setSelectedSize(size)}
                    aria-label={`Seleccionar talla ${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-2">
          <h3 className="font-medium">Cantidad:</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Disminuir cantidad"
            >
              -
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              disabled={quantity >= safeProduct.stock}
              aria-label="Aumentar cantidad"
            >
              +
            </Button>
          </div>
        </div>

        {/* Add to Cart */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1 py-2.5 text-sm font-medium shadow-sm hover:shadow transition-all"
            size="default"
            onClick={handleAddToCart}
            disabled={safeProduct.stock <= 0 || isAdding}
            aria-label="Agregar al carrito"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isAdding ? "Agregando..." : "Agregar al carrito"}
          </Button>
          <Button
            variant="outline"
            size="default"
            className="flex-1 sm:flex-none py-2.5 border hover:bg-accent/20 transition-all"
            aria-label="Añadir a favoritos"
          >
            <Heart className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Favorito</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden sm:flex h-10 w-10 border hover:bg-accent/20 transition-all"
            aria-label="Compartir producto"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Product Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Envío gratis</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Garantía de calidad</span>
          </div>
          <div className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Devolución fácil</span>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="col-span-1 md:col-span-2 mt-8">
        <Tabs defaultValue="description">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Descripción</TabsTrigger>
            <TabsTrigger value="specifications">Especificaciones</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="p-4 border rounded-md mt-2">
            <article className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-4">Acerca de este producto</h2>
              <div dangerouslySetInnerHTML={{ __html: safeProduct.description }} />
            </article>
          </TabsContent>
          <TabsContent value="specifications" className="p-4 border rounded-md mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeProduct.specifications &&
                safeProduct.specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <span className="font-medium">{spec.name}</span>
                    <span>{spec.value}</span>
                  </div>
                ))}
              {(!safeProduct.specifications || safeProduct.specifications.length === 0) && (
                <p>No hay especificaciones disponibles para este producto.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="p-4 border rounded-md mt-2">
            <div className="space-y-4">
              {safeProduct.reviews &&
                safeProduct.reviews.map((review, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{review.userName}</h4>
                        <div className="flex mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2">{review.comment}</p>
                  </Card>
                ))}
              {(!safeProduct.reviews || safeProduct.reviews.length === 0) && (
                <p>No hay reseñas disponibles para este producto.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
