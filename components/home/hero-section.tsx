"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Headphones, Ticket, ShoppingBag, ArrowRight, Music } from "lucide-react"

export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const heroImages = [
    "/placeholder.svg?height=600&width=1920",
    "/placeholder.svg?height=600&width=1920",
    "/placeholder.svg?height=600&width=1920",
  ]

  // Load video after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.src = "https://tlbr-assets.stag.tomorrowland.com/welcome/tl25br_header.mp4_web_high.mp4"
        videoRef.current.onloadeddata = () => setVideoLoaded(true)
      }
    }, 1000) // Delay video loading by 1 second to prioritize other content

    return () => clearTimeout(timer)
  }, [])

  // Image carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <section className="relative w-full min-h-[600px] h-auto sm:h-[85vh] max-h-[800px] overflow-hidden">
      {/* Static background image for fast initial load */}
      <div className="absolute inset-0 bg-black">
        <Image
          src="/electronic-music-festival-night.png"
          alt="Festival background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ opacity: videoLoaded ? 0 : 1, transition: "opacity 0.5s ease-in-out" }}
        />

        {/* Background video - loaded after initial render */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
          style={{ opacity: videoLoaded ? 1 : 0, transition: "opacity 0.5s ease-in-out" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-white px-4 py-16 sm:py-0 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <span className="bg-primary/80 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium">
            La mejor experiencia electrónica
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-7xl font-bold text-center mb-4 sm:mb-6 leading-tight animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Vive la experiencia
          <span className="text-primary block">electrónica</span>
        </h1>

        <p
          className="text-lg sm:text-xl md:text-2xl text-center mb-6 sm:mb-10 max-w-2xl text-white/90 px-2 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          Encuentra los mejores eventos de música electrónica en Latinoamérica
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <Button asChild size="lg" className="text-lg group">
            <Link href="/eventos">
              <Ticket className="mr-2 h-5 w-5" />
              Explorar eventos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
          >
            <Link href="/tienda">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Visitar tienda
            </Link>
          </Button>
        </div>

        {/* Feature cards - using CSS for animation instead of framer-motion */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-16 w-full max-w-4xl px-2 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center border border-white/10 hover:border-primary/50 transition-colors">
            <div className="bg-primary/20 p-3 rounded-lg mr-3">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Entradas Seguras</h3>
              <p className="text-sm text-white/70">Compra con confianza</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center border border-white/10 hover:border-primary/50 transition-colors">
            <div className="bg-primary/20 p-3 rounded-lg mr-3">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Mejores Artistas</h3>
              <p className="text-sm text-white/70">Line-ups exclusivos</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center border border-white/10 hover:border-primary/50 transition-colors">
            <div className="bg-primary/20 p-3 rounded-lg mr-3">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Experiencia Única</h3>
              <p className="text-sm text-white/70">Momentos inolvidables</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator - using CSS animation instead of framer-motion */}
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block animate-fade-in"
        style={{ animationDelay: "0.7s" }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce-slow"></div>
        </div>
      </div>
    </section>
  )
}
