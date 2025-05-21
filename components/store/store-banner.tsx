"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getActiveStoreBanners } from "@/lib/firebase/banners"
import { useCurrency } from "@/context/currency-context"

export function StoreBanner() {
  const [banners, setBanners] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { currency, formatCurrency, convertCurrency } = useCurrency()

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getActiveStoreBanners()
      setBanners(data)
    } catch (error) {
      console.error("Error fetching banners:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrentIndex((prevIndex) => prevIndex)
    }

    window.addEventListener("currency-changed", handleCurrencyChange)

    return () => {
      window.removeEventListener("currency-changed", handleCurrencyChange)
    }
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
  }

  if (isLoading) {
    return <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg"></div>
  }

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative w-full h-[300px] sm:h-[350px] md:h-[450px] lg:h-[500px] overflow-hidden rounded-lg">
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/70 hover:bg-background/90 shadow-md transition-all h-8 w-8 sm:h-10 sm:w-10"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/70 hover:bg-background/90 shadow-md transition-all h-8 w-8 sm:h-10 sm:w-10"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </Button>
        </>
      )}

      <div className="absolute inset-0 flex items-center">
        {currentBanner.mediaType === "image" ? (
          <Image
            src={currentBanner.mediaUrl || "/placeholder.svg"}
            alt={currentBanner.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full">
            {currentBanner.videoProvider === "youtube" && currentBanner.videoId && (
              <iframe
                src={`https://www.youtube.com/embed/${currentBanner.videoId}?autoplay=1&mute=1&loop=1&playlist=${currentBanner.videoId}&controls=0&showinfo=0`}
                title={currentBanner.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full"
              ></iframe>
            )}
            {currentBanner.videoProvider === "vimeo" && currentBanner.videoId && (
              <iframe
                src={`https://player.vimeo.com/video/${currentBanner.videoId}?autoplay=1&loop=1&background=1`}
                title={currentBanner.title}
                allow="autoplay; fullscreen; picture-in-picture"
                className="w-full h-full"
              ></iframe>
            )}
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-end">
        {/* Gradiente complejo con múltiples capas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-[2px]"></div>

        {/* Elemento decorativo */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* Contenido */}
        <div className="relative w-full">
          {/* Borde decorativo superior */}
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white/10 opacity-50"></div>

          <div className="w-full p-4 sm:p-6 md:p-8 text-white">
            <div className="relative">
              {/* Decoración del título */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-full hidden sm:block"></div>

              <div className="sm:pl-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 tracking-tight drop-shadow-md">
                  {currentBanner.title}
                </h2>
                {currentBanner.description && (
                  <p className="text-xs sm:text-sm md:text-base mb-4 max-w-2xl text-white/90 line-clamp-2 sm:line-clamp-3 drop-shadow-sm">
                    {currentBanner.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-2">
              {currentBanner.price > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {currentBanner.hasDiscount && currentBanner.discountPercentage ? (
                    <>
                      <span className="text-base sm:text-lg md:text-xl font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                        {(() => {
                          const price = convertCurrency(
                            currentBanner.price * (1 - currentBanner.discountPercentage / 100),
                            "PEN",
                            currency,
                          )

                          let symbol = ""
                          if (currency === "PEN") symbol = "S/ "
                          else if (currency === "USD" || currency === "CLP") symbol = "$ "

                          const formattedNumber = new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(price)

                          return `${symbol}${formattedNumber} ${currency}`
                        })()}
                      </span>
                      <div className="flex flex-col items-start">
                        <span className="text-xs sm:text-sm line-through opacity-70">
                          {(() => {
                            const price = convertCurrency(currentBanner.price, "PEN", currency)

                            let symbol = ""
                            if (currency === "PEN") symbol = "S/ "
                            else if (currency === "USD" || currency === "CLP") symbol = "$ "

                            const formattedNumber = new Intl.NumberFormat("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(price)

                            return `${symbol}${formattedNumber} ${currency}`
                          })()}
                        </span>
                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-0.5 rounded-full font-medium shadow-sm">
                          -{currentBanner.discountPercentage}% OFF
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-base sm:text-lg md:text-xl font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                      {(() => {
                        const price = convertCurrency(currentBanner.price, "PEN", currency)

                        let symbol = ""
                        if (currency === "PEN") symbol = "S/ "
                        else if (currency === "USD" || currency === "CLP") symbol = "$ "

                        const formattedNumber = new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(price)

                        return `${symbol}${formattedNumber} ${currency}`
                      })()}
                    </span>
                  )}
                </div>
              )}

              {currentBanner.linkUrl && (
                <Link href={currentBanner.linkUrl} className="group">
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-primary/30 text-sm sm:text-base px-5 py-2 h-auto border border-primary/20 group-hover:scale-105"
                  >
                    Ver producto
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Borde decorativo inferior */}
          <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                index === currentIndex ? "bg-primary scale-110 shadow-md" : "bg-white/50 hover:bg-white/70"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir al banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
