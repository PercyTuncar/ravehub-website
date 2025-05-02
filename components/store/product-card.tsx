"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { ShoppingCart, Eye, Star, Clock, TrendingUp, Zap } from "lucide-react"
import type { Product } from "@/types"
import { getExchangeRates } from "@/lib/currency/exchange-api"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

// Función para obtener el símbolo de la moneda
const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    PEN: "S/",
    ARS: "$",
    BRL: "R$",
    CLP: "$",
    COP: "$",
    MXN: "$",
    BOB: "Bs.",
    VES: "Bs.",
    UYU: "$U",
    PYG: "₲",
    CAD: "C$",
    AUD: "A$",
    NZD: "NZ$",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    RUB: "₽",
    INR: "₹",
    ZAR: "R",
  }

  return symbols[currencyCode] || ""
}

// Función para formatear precios con separadores de miles según la moneda
const formatPrice = (price: number, currencyCode: string): string => {
  // Aplicar formato con coma como separador de miles para pesos chilenos
  if (currencyCode === "CLP") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Para otras monedas, mantener el formato original
  return price.toFixed(2)
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [isHovered, setIsHovered] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [displayPrice, setDisplayPrice] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const mountedRef = useRef(true)
  const requestAttemptsRef = useRef(0)
  const maxRequestAttempts = 5
  const requestIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Asegurar que la moneda del producto sea siempre un string y usar el valor de Firebase
  const productCurrency = product.currency || "USD"

  // Calcular precio final con descuento si es aplicable
  const finalPrice = product.discountPercentage ? product.price * (1 - product.discountPercentage / 100) : product.price

  // Filtrar URLs de blob que no funcionarán en producción
  const validImages = product.images?.filter((url) => !url.startsWith("blob:")) || []

  // Obtener la primera imagen válida o usar placeholder
  const mainImage = validImages.length > 0 ? validImages[0] : "/placeholder.svg?height=400&width=400"

  const imageAltText =
    product.imageAltTexts && product.imageAltTexts[mainImage]
      ? product.imageAltTexts[mainImage]
      : `${product.name} - Imagen principal`

  // Cargar tasas de cambio
  const loadExchangeRates = async () => {
    try {
      const rates = await getExchangeRates()
      console.log(`ProductCard ${product.id}: Tasas de cambio cargadas`, Object.keys(rates).length)
      setExchangeRates(rates)
      return rates
    } catch (error) {
      console.error(`ProductCard ${product.id}: Error al cargar tasas de cambio`, error)
      return {}
    }
  }

  // Función para convertir el precio a la moneda seleccionada
  const convertPrice = (
    amount: number,
    from: string,
    to: string,
    rates: Record<string, number> = exchangeRates,
  ): number => {
    if (!rates || Object.keys(rates).length === 0) {
      console.log(`ProductCard ${product.id}: No hay tasas de cambio disponibles`)
      return amount
    }

    if (from === to) {
      return amount
    }

    try {
      // Normalizar monedas
      const fromCurrency = from.toUpperCase()
      const toCurrency = to.toUpperCase()

      // Verificar si tenemos las tasas necesarias
      if (!rates[fromCurrency] && fromCurrency !== "USD") {
        console.warn(`ProductCard ${product.id}: No hay tasa para ${fromCurrency}`)
        return amount
      }

      if (!rates[toCurrency] && toCurrency !== "USD") {
        console.warn(`ProductCard ${product.id}: No hay tasa para ${toCurrency}`)
        return amount
      }

      // Convertir a USD primero (si no es USD ya)
      const amountInUSD = fromCurrency === "USD" ? amount : amount / rates[fromCurrency]

      // Luego convertir de USD a la moneda objetivo
      const convertedAmount = toCurrency === "USD" ? amountInUSD : amountInUSD * rates[toCurrency]

      return convertedAmount
    } catch (error) {
      console.error(`ProductCard ${product.id}: Error al convertir precio`, error)
      return amount
    }
  }

  // Actualizar el precio mostrado
  const updateDisplayPrice = (targetCurrency: string, rates: Record<string, number> = exchangeRates) => {
    if (!targetCurrency) {
      console.log(`ProductCard ${product.id}: No hay moneda objetivo, mostrando precio original`)
      setDisplayPrice(`${finalPrice.toFixed(2)} ${productCurrency}`)
      return
    }

    if (!rates || Object.keys(rates).length === 0) {
      console.log(`ProductCard ${product.id}: No hay tasas de cambio disponibles, mostrando precio original`)
      setDisplayPrice(`${finalPrice.toFixed(2)} ${productCurrency}`)
      return
    }

    console.log(`ProductCard ${product.id}: Convirtiendo de ${productCurrency} a ${targetCurrency}`)

    // Si las monedas son iguales, no necesitamos convertir
    if (productCurrency === targetCurrency) {
      console.log(`ProductCard ${product.id}: Monedas iguales, no se requiere conversión`)
      setDisplayPrice(`${finalPrice.toFixed(2)} ${productCurrency}`)
      return
    }

    const convertedPrice = convertPrice(finalPrice, productCurrency, targetCurrency, rates)
    console.log(
      `ProductCard ${product.id}: Precio convertido: ${finalPrice} ${productCurrency} -> ${convertedPrice.toFixed(2)} ${targetCurrency}`,
    )
    setDisplayPrice(`${convertedPrice.toFixed(2)} ${targetCurrency}`)
  }

  // Handle add to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAdding(true)

    // Crear objeto para agregar al carrito
    const cartItem = {
      productId: product.id,
      name: product.name,
      price: finalPrice,
      currency: productCurrency,
      quantity: 1,
      image: mainImage,
      stock: product.stock,
    }

    console.log("ProductCard: Agregando al carrito", cartItem)

    // Add item to cart
    addItem(cartItem)

    // Mostrar notificación
    toast({
      title: "Producto agregado",
      description: `${product.name} se ha agregado al carrito`,
      duration: 3000,
    })

    setTimeout(() => setIsAdding(false), 500)
  }

  // Solicitar la moneda actual al Navbar de forma más agresiva
  const requestCurrentCurrency = () => {
    // Incrementar el contador de intentos
    requestAttemptsRef.current += 1

    console.log(
      `ProductCard ${product.id}: Solicitando moneda actual al Navbar (intento ${requestAttemptsRef.current})`,
    )

    // Emitir evento para solicitar la moneda actual
    window.dispatchEvent(new CustomEvent("request-currency"))

    // Si ya tenemos la moneda o hemos alcanzado el máximo de intentos, detener las solicitudes
    if (selectedCurrency || requestAttemptsRef.current >= maxRequestAttempts) {
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current)
        requestIntervalRef.current = null
      }

      // Si hemos alcanzado el máximo de intentos y aún no tenemos moneda, usar la moneda original
      if (!selectedCurrency && requestAttemptsRef.current >= maxRequestAttempts) {
        console.log(`ProductCard ${product.id}: Máximo de intentos alcanzado, usando moneda original`)
        setDisplayPrice(`${finalPrice.toFixed(2)} ${productCurrency}`)
      }
    }
  }

  // Iniciar solicitudes periódicas de moneda
  const startCurrencyPolling = () => {
    // Solicitar inmediatamente
    requestCurrentCurrency()

    // Configurar solicitudes periódicas cada 200ms
    requestIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !selectedCurrency) {
        requestCurrentCurrency()
      } else if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current)
        requestIntervalRef.current = null
      }
    }, 200)

    // Establecer un tiempo máximo para el polling (1 segundo)
    setTimeout(() => {
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current)
        requestIntervalRef.current = null

        // Si después de 1 segundo no tenemos moneda, usar la moneda original
        if (!selectedCurrency && mountedRef.current) {
          console.log(`ProductCard ${product.id}: Tiempo de polling agotado, usando moneda original`)
          setDisplayPrice(`${finalPrice.toFixed(2)} ${productCurrency}`)
        }
      }
    }, 1000)
  }

  // Escuchar la respuesta del Navbar con la moneda actual
  useEffect(() => {
    const handleCurrencyResponse = (event: CustomEvent) => {
      const currency = event.detail
      if (!currency) return

      console.log(`ProductCard ${product.id}: Recibida respuesta de moneda: ${currency}`)

      // Detener el polling si está activo
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current)
        requestIntervalRef.current = null
      }

      // Actualizar la moneda seleccionada
      setSelectedCurrency(currency)

      // Inicializar el componente con la moneda recibida
      if (!isInitialized) {
        loadExchangeRates().then((rates) => {
          updateDisplayPrice(currency, rates)
          setIsInitialized(true)
        })
      } else {
        updateDisplayPrice(currency)
      }
    }

    // Escuchar respuestas de moneda
    window.addEventListener("currency-response", handleCurrencyResponse as EventListener)

    // Iniciar el polling de moneda inmediatamente al montar el componente
    startCurrencyPolling()

    // Cargar tasas de cambio al inicio
    loadExchangeRates()

    return () => {
      mountedRef.current = false

      // Limpiar el intervalo si existe
      if (requestIntervalRef.current) {
        clearInterval(requestIntervalRef.current)
        requestIntervalRef.current = null
      }

      window.removeEventListener("currency-response", handleCurrencyResponse as EventListener)
    }
  }, [])

  // Escuchar cambios de moneda
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const newCurrency = event.detail
      console.log(`ProductCard ${product.id}: Evento currency-changed recibido: ${newCurrency}`)

      // Mostrar animación
      setIsUpdating(true)

      // Actualizar la moneda seleccionada
      setSelectedCurrency(newCurrency)

      // Actualizar el precio con la nueva moneda
      if (isInitialized) {
        updateDisplayPrice(newCurrency)
      } else {
        loadExchangeRates().then((rates) => {
          updateDisplayPrice(newCurrency, rates)
          setIsInitialized(true)
        })
      }

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
  }, [isInitialized])

  // Establecer un tiempo máximo de espera para mostrar el precio original
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!displayPrice && mountedRef.current) {
        console.log(`ProductCard ${product.id}: Tiempo de espera agotado, mostrando precio original`)
        setDisplayPrice(`${finalPrice.toFixed(2)} ${productCurrency}`)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [displayPrice])

  // Indicador de carga mientras se inicializa
  if (!displayPrice) {
    return (
      <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-md animate-pulse rounded-xl">
        <div className="relative aspect-square overflow-hidden bg-gray-200 rounded-t-xl"></div>
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="p-4 pt-0">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  return (
    <Link href={`/tienda/${product.slug}`} passHref>
      <Card
        id={`product-${product.id}`}
        className={cn(
          "group relative h-full overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300",
          "shadow-[0_4px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1),0_2px_6px_-1px_rgba(0,0,0,0.06)]",
          "hover:border-primary/20 hover:translate-y-[-2px]",
          "will-change-transform transform-gpu",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Imagen con efecto de hover y badges */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Image
            src={mainImage || "/placeholder.svg"}
            alt={imageAltText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-all duration-500 ease-out",
              isHovered ? "scale-108" : "scale-100",
              !imageLoaded && "blur-sm",
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=400&width=400"
            }}
          />

          {/* Badges y etiquetas */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
            {product.discountPercentage && (
              <Badge
                className="bg-red-500 text-white font-medium px-2 py-0.5 
              shadow-sm flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                {product.discountPercentage}% OFF
              </Badge>
            )}

            {product.isNew && (
              <Badge
                className="bg-emerald-500 text-white font-medium px-2 py-0.5 
              shadow-sm flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Nuevo
              </Badge>
            )}
          </div>

          {/* Rating display */}
          {product.rating && (
            <div
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 
          flex items-center gap-1 shadow-sm"
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-gray-800">{product.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Overlay para productos agotados */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <span
                className="text-white font-semibold px-3 py-1 rounded-full bg-black/70 shadow-inner 
            flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                Agotado
              </span>
            </div>
          )}

          {/* Botones de acción rápida */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent",
              "flex justify-center gap-2 transition-all duration-300 ease-out",
              isHovered ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
          >
            <Button
              size="sm"
              className={cn(
                "flex-1 bg-white hover:bg-white text-gray-900 hover:text-primary shadow-md",
                "border border-white/20 backdrop-blur-sm transition-all duration-200",
                "hover:shadow-primary/20 hover:border-primary/30",
                isAdding && "animate-pulse",
              )}
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || isAdding}
            >
              <ShoppingCart className={cn("h-3.5 w-3.5 mr-1.5", isAdding && "animate-bounce")} />
              {isAdding ? "Agregando..." : "Agregar"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-white/80 hover:bg-white border-white/20 hover:border-primary/30 text-gray-900 
            hover:text-primary shadow-md hover:shadow-primary/20 backdrop-blur-sm transition-all duration-200"
              asChild
            >
              <Link href={`/tienda/${product.slug}`}>
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-3">
          {/* Nombre del producto */}
          <h3
            className={cn(
              "font-medium text-gray-800 line-clamp-1 transition-colors duration-300",
              "text-sm group-hover:text-primary",
            )}
          >
            {product.name}
          </h3>

          {/* Descripción corta */}
          <p
            className="text-xs text-gray-500 line-clamp-1 mt-0.5 leading-snug opacity-90 
    group-hover:opacity-100 transition-opacity duration-300"
          >
            {product.shortDescription}
          </p>

          {/* Sección de precios - MEJORADA */}
          <div className="mt-2">
            {product.discountPercentage ? (
              <div className="flex flex-col">
                {/* Etiqueta de descuento */}
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm font-medium flex items-center">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    {product.discountPercentage}% DESCUENTO
                  </span>
                </div>

                {/* Precio con descuento */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-base font-bold text-red-600 transition-all duration-500",
                      isUpdating && "animate-pulse",
                    )}
                  >
                    {(selectedCurrency && (
                      <>
                        {getCurrencySymbol(selectedCurrency)}
                        {formatPrice(convertPrice(finalPrice, productCurrency, selectedCurrency), selectedCurrency)}
                      </>
                    )) || (
                      <>
                        {getCurrencySymbol(productCurrency)}
                        {formatPrice(finalPrice, productCurrency)}
                      </>
                    )}
                  </span>

                  {/* Precio original */}
                  <span className="text-xs line-through text-gray-500">
                    {selectedCurrency && exchangeRates && Object.keys(exchangeRates).length > 0
                      ? `${getCurrencySymbol(selectedCurrency)}${formatPrice(
                          convertPrice(product.price, productCurrency, selectedCurrency),
                          selectedCurrency,
                        )}`
                      : `${getCurrencySymbol(productCurrency)}${formatPrice(product.price, productCurrency)}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline">
                <span
                  className={cn(
                    "text-base font-bold text-gray-800 transition-all duration-500",
                    isUpdating && "animate-pulse",
                  )}
                >
                  {(selectedCurrency && (
                    <>
                      {getCurrencySymbol(selectedCurrency)}
                      {formatPrice(convertPrice(finalPrice, productCurrency, selectedCurrency), selectedCurrency)}
                    </>
                  )) || (
                    <>
                      {getCurrencySymbol(productCurrency)}
                      {formatPrice(finalPrice, productCurrency)}
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Moneda actual */}
            <div className="text-xs text-gray-600 font-medium mt-0.5 flex items-center">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm">{selectedCurrency || productCurrency}</span>

              {isUpdating && (
                <span className="ml-1 text-emerald-600 inline-flex items-center animate-pulse">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-0.5"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                  </svg>
                  Actualizado
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
