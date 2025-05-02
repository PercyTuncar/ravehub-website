"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getActiveStoreBanners } from "@/lib/firebase/banners"
import type { StoreBanner } from "@/types"
import { useCurrency } from "@/context/currency-context"

export function StoreBanner() {
  const [banners, setBanners] = useState<StoreBanner[]>([])
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

  // Add this effect after the other useEffect hooks (before the if statements)
  useEffect(() => {
    // Force re-render when currency changes
    const handleCurrencyChange = () => {
      // This will trigger a re-render
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
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg">
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
        <div className="w-full p-6 md:p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{currentBanner.title}</h2>
          {currentBanner.description && (
            <p className="text-sm md:text-base mb-4 max-w-2xl">{currentBanner.description}</p>
          )}

          <div className="flex items-center space-x-4">
            {currentBanner.price > 0 && (
              <div className="flex items-center space-x-2">
                {currentBanner.hasDiscount && currentBanner.discountPercentage ? (
                  <>
                    <span className="text-lg md:text-xl font-bold">
                      {(() => {
                        const price = convertCurrency(
                          currentBanner.price * (1 - currentBanner.discountPercentage / 100),
                          "PEN",
                          currency,
                        )

                        // Format based on currency
                        let symbol = ""
                        if (currency === "PEN") symbol = "S/ "
                        else if (currency === "USD" || currency === "CLP") symbol = "$ "

                        // Format number with thousand separators
                        const formattedNumber = new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(price)

                        return `${symbol}${formattedNumber} ${currency}`
                      })()}
                    </span>
                    <span className="text-sm line-through opacity-70">
                      {(() => {
                        const price = convertCurrency(currentBanner.price, "PEN", currency)

                        // Format based on currency
                        let symbol = ""
                        if (currency === "PEN") symbol = "S/ "
                        else if (currency === "USD" || currency === "CLP") symbol = "$ "

                        // Format number with thousand separators
                        const formattedNumber = new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(price)

                        return `${symbol}${formattedNumber} ${currency}`
                      })()}
                    </span>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      -{currentBanner.discountPercentage}%
                    </span>
                  </>
                ) : (
                  <span className="text-lg md:text-xl font-bold">
                    {(() => {
                      const price = convertCurrency(currentBanner.price, "PEN", currency)

                      // Format based on currency
                      let symbol = ""
                      if (currency === "PEN") symbol = "S/ "
                      else if (currency === "USD" || currency === "CLP") symbol = "$ "

                      // Format number with thousand separators
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
              <Link href={currentBanner.linkUrl}>
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Ver producto
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-primary" : "bg-white/50"}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
