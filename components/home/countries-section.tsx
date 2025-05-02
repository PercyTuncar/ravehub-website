"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Globe, MapPin, Music, Star, ArrowDown } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"

// Definir los tipos fuera de la función del componente
interface CountryData {
  name: string
  flagUrl: string
  events: number
  region: string
}

// Datos estáticos para evitar recreaciones
const countries: CountryData[] = [
  {
    name: "México",
    flagUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Mexico-0xUhFkDrBrFA0jn0hNT84HrPuCXbTC.png",
    events: 24,
    region: "latinamerica",
  },
  {
    name: "Colombia",
    flagUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/colombia-flag-b43ED0VuCdc4K5AkyjsUj5ERrsF3WE.png",
    events: 18,
    region: "latinamerica",
  },
  {
    name: "Perú",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Web_Circle_Flags-04-68oD7wgTdKtEwwYkka7LpAQ0yMUeEh.png",
    events: 12,
    region: "latinamerica",
  },
  {
    name: "Ecuador",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ecuador%20%281%29-RYq21c4MLjQXZl3Je39ogXiKQ26MkQ.png",
    events: 15,
    region: "latinamerica",
  },
  {
    name: "Bolivia",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Web_Circle_Flags-03-OHnlUCwx8mbpqh7bdzOllhuenoaIen.png",
    events: 8,
    region: "latinamerica",
  },
  {
    name: "Guatemala",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/guatemala-flag-round-icon-128-HTa89IKyvYCCzcl3uSHc34GrfOU2YW.png",
    events: 6,
    region: "latinamerica",
  },
  {
    name: "Australia",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/australia-flag-mw7TRGG18uyRRWi48int7miQxDoe2k.png",
    events: 10,
    region: "oceania",
  },
  {
    name: "India",
    flagUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/india-flag-igAHa0zEjrcavSyOJdFJpB85cxGElB.png",
    events: 7,
    region: "asia",
  },
]

// Definir las variantes de animación fuera del componente para evitar recreaciones
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
}

export function CountriesSection() {
  const [activeCountry, setActiveCountry] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showAllCountries, setShowAllCountries] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Memoizar los países visibles para evitar cálculos innecesarios
  const visibleCountries = useMemo(() => (showAllCountries ? countries : countries.slice(0, 4)), [showAllCountries])

  // Optimizar la detección de dispositivos móviles con useCallback
  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Optimizar el cambio de país activo con useCallback
  const handleCountryChange = useCallback(() => {
    setActiveCountry((prev) => {
      if (prev === null) return 0
      return (prev + 1) % countries.length
    })
  }, [])

  // Memoizar el virtualizador para evitar recreaciones
  const rowVirtualizer = useVirtualizer({
    count: countries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  })

  // Optimizar el efecto de detección de dispositivos móviles
  useEffect(() => {
    // Usar requestAnimationFrame para evitar bloquear el hilo principal
    const frameId = requestAnimationFrame(() => {
      checkIfMobile()
    })

    // Usar un debounce para el evento resize
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkIfMobile, 100)
    }

    window.addEventListener("resize", handleResize, { passive: true })

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timeoutId)
      window.removeEventListener("resize", handleResize)
    }
  }, [checkIfMobile])

  // Optimizar el efecto de rotación automática de países
  useEffect(() => {
    // Limpiar el intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Crear un nuevo intervalo
    intervalRef.current = setInterval(handleCountryChange, isMobile ? 4000 : 3000)

    // Limpiar el intervalo al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isMobile, handleCountryChange])

  // Renderizado condicional para móviles y escritorio
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-background/95 to-background relative overflow-hidden">
      {/* Decorative elements - Usar will-change para optimizar las animaciones */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/20 to-transparent" />
      <div
        className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        style={{ willChange: "transform" }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"
        style={{ willChange: "transform" }}
      />

      <div className="container mx-auto px-4">
        {/* Optimizar la animación del título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px 0px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-16"
        >
          <div className="inline-flex items-center justify-center mb-3 md:mb-4">
            <Globe className="text-primary mr-2 h-5 w-5 md:h-6 md:w-6" />
            <span className="text-xs md:text-sm font-medium uppercase tracking-wider text-primary">
              Presencia Global
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Conectando el mundo a través de la música
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            Estamos presentes en múltiples países, llevando la mejor experiencia electrónica a todos los rincones del
            mundo.
          </p>
        </motion.div>

        {/* Renderizado condicional optimizado para móviles */}
        {isMobile ? (
          <div
            ref={parentRef}
            className="mb-10 overflow-x-auto hide-scrollbar"
            style={{
              height: "160px",
              WebkitOverflowScrolling: "touch", // Mejorar el rendimiento del desplazamiento en iOS
            }}
          >
            <div
              style={{
                width: `${rowVirtualizer.getTotalSize()}px`,
                height: "100%",
                position: "relative",
                willChange: "transform", // Optimizar animaciones
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const country = countries[virtualItem.index]
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: "absolute",
                      left: `${virtualItem.start}px`,
                      width: `${virtualItem.size}px`,
                      height: "100%",
                      transform: "translateZ(0)", // Forzar aceleración por hardware
                    }}
                    className="relative flex flex-col items-center mx-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="relative w-12 h-12 mb-2 overflow-hidden rounded-full border-2 border-white/10 shadow-inner">
                      <Image
                        src={country.flagUrl || "/placeholder.svg"}
                        alt={`Bandera de ${country.name}`}
                        fill
                        sizes="48px"
                        className="object-cover"
                        loading="lazy"
                        fetchPriority="low"
                      />
                    </div>
                    <h3 className="font-bold text-sm whitespace-nowrap">{country.name}</h3>
                    <div className="flex items-center mt-1">
                      {country.region === "latinamerica" ? (
                        <>
                          <Star className="h-3 w-3 mr-1 text-primary" />
                          <span className="text-xs text-muted-foreground">{country.events}</span>
                        </>
                      ) : (
                        <>
                          <Music className="h-3 w-3 mr-1 text-primary" />
                          <span className="text-xs text-muted-foreground">{country.events}</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Vista de escritorio optimizada
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px 0px" }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-16"
          >
            {visibleCountries.map((country, index) => (
              <motion.div
                key={country.name}
                variants={item}
                onMouseEnter={() => setActiveCountry(index)}
                onTouchStart={() => setActiveCountry(index)}
                className={`relative group rounded-xl p-3 md:p-6 transition-all duration-300 ${
                  activeCountry === index
                    ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5 scale-[1.02]"
                    : "bg-white/5 border border-white/10 hover:border-primary/20"
                }`}
                style={{ willChange: activeCountry === index ? "transform, opacity" : "auto" }}
              >
                <div className="flex items-center">
                  <div className="relative w-10 h-10 md:w-12 md:h-12 mr-3 md:mr-4 overflow-hidden rounded-full border-2 border-white/10 shadow-inner">
                    <Image
                      src={country.flagUrl || "/placeholder.svg"}
                      alt={`Bandera de ${country.name}`}
                      fill
                      sizes="(max-width: 768px) 40px, 48px"
                      className="object-cover"
                      loading="lazy"
                      fetchPriority="low"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">{country.name}</h3>
                    <div className="flex items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">{country.events} eventos</span>
                      {activeCountry === index && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="ml-2 h-2 w-2 rounded-full bg-primary"
                          style={{ willChange: "transform, opacity" }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute bottom-2 right-2 md:bottom-3 md:right-3 transition-opacity duration-300 ${
                    activeCountry === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <motion.div
                    animate={{ scale: activeCountry === index ? [1, 1.1, 1] : 1 }}
                    transition={{ repeat: activeCountry === index ? Number.POSITIVE_INFINITY : 0, duration: 2 }}
                    style={{ willChange: activeCountry === index ? "transform" : "auto" }}
                  >
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </motion.div>
                </div>

                {/* Region indicator */}
                <div className="absolute top-2 right-2 opacity-30">
                  {country.region === "latinamerica" && (
                    <span className="text-[10px] uppercase tracking-wider">LATAM</span>
                  )}
                </div>
              </motion.div>
            ))}
            {!showAllCountries && !isMobile && (
              <motion.div
                variants={item}
                className="relative group rounded-xl p-3 md:p-6 transition-all duration-300 bg-white/5 border border-white/10 hover:border-primary/20 flex items-center justify-center cursor-pointer"
                onClick={() => setShowAllCountries(true)}
              >
                <div className="text-center">
                  <p className="font-medium">Ver más países</p>
                  <ArrowDown className="h-4 w-4 mx-auto mt-2 text-primary" />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
