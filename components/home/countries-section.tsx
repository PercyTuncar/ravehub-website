"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { Globe, MapPin, Music, Star } from "lucide-react"

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

export function CountriesSection() {
  const [activeCountry, setActiveCountry] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showAllCountries, setShowAllCountries] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Memoizar los países visibles para evitar cálculos innecesarios
  const visibleCountries = useMemo(() => (showAllCountries ? countries : countries.slice(0, 4)), [showAllCountries])

  // Simplify resize detection
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768)
    checkIfMobile()

    // Use resize observer for better performance
    const resizeObserver = new ResizeObserver(checkIfMobile)
    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Simplify auto-rotation effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Auto-rotate, but only if not on a reduced data connection
    if (
      !navigator.connection ||
      !(navigator.connection.saveData || navigator.connection.effectiveType.includes("2g"))
    ) {
      intervalRef.current = setInterval(
        () => {
          setActiveCountry((prev) => {
            if (prev === null) return 0
            return (prev + 1) % countries.length
          })
        },
        isMobile ? 4000 : 3000,
      )
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isMobile])

  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-background/95 to-background/80 relative overflow-hidden">
      {/* Elementos decorativos mejorados */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
      <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-secondary/5 rounded-full blur-2xl opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto fade-in-up text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3 md:mb-4">
            <Globe className="text-primary mr-2 h-4 w-4 md:h-5 md:w-5" />
            <span className="text-xs md:text-sm font-medium uppercase tracking-wider text-primary">
              Presencia Global
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Conectando el mundo a través de la música
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Estamos presentes en múltiples países, llevando la mejor experiencia electrónica a todos los rincones del
            mundo.
          </p>
        </div>

        {/* Vista móvil mejorada */}
        {isMobile ? (
          <div className="mb-8 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4">
            <div className="flex gap-3">
              {countries.slice(0, 6).map((country, index) => (
                <div
                  key={country.name}
                  className="flex-shrink-0 w-[150px] flex flex-col items-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="relative w-12 h-12 mb-2 overflow-hidden rounded-full border-2 border-white/10 shadow-lg">
                    <Image
                      src={country.flagUrl || "/placeholder.svg"}
                      alt={`Bandera de ${country.name}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-bold text-sm whitespace-nowrap">{country.name}</h3>
                  <div className="flex items-center mt-1 px-2 py-0.5 rounded-full bg-white/5">
                    {country.region === "latinamerica" ? (
                      <>
                        <Star className="h-3 w-3 mr-1 text-primary" />
                        <span className="text-xs">{country.events} eventos</span>
                      </>
                    ) : (
                      <>
                        <Music className="h-3 w-3 mr-1 text-primary" />
                        <span className="text-xs">{country.events} eventos</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Vista de escritorio mejorada
          <div className="fade-in-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
            {visibleCountries.map((country, index) => (
              <div
                key={country.name}
                onMouseEnter={() => setActiveCountry(index)}
                onTouchStart={() => setActiveCountry(index)}
                className={`relative rounded-xl p-4 transition-all duration-300 backdrop-blur-sm ${
                  activeCountry === index
                    ? "bg-primary/10 border border-primary/30 shadow-lg shadow-primary/10 transform scale-[1.02]"
                    : "bg-white/5 border border-white/10 hover:border-primary/20"
                }`}
              >
                <div className="flex items-center">
                  <div className="relative w-10 h-10 md:w-12 md:h-12 mr-3 overflow-hidden rounded-full border-2 border-white/10 shadow-lg">
                    <Image
                      src={country.flagUrl || "/placeholder.svg"}
                      alt={`Bandera de ${country.name}`}
                      fill
                      sizes="(max-width: 768px) 40px, 48px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">{country.name}</h3>
                    <div className="flex items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">{country.events} eventos</span>
                      {activeCountry === index && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute bottom-2 right-2 md:bottom-3 md:right-3 transition-all duration-300 ${
                    activeCountry === index ? "opacity-100 scale-110" : "opacity-0 scale-90 group-hover:opacity-100"
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  </div>
                </div>

                {/* Indicador de región */}
                <div className="absolute top-2 right-2 opacity-60">
                  {country.region === "latinamerica" && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      LATAM
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!showAllCountries && (
              <div
                className="relative rounded-xl p-4 transition-all duration-300 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/20 hover:bg-white/10 flex items-center justify-center cursor-pointer"
                onClick={() => setShowAllCountries(true)}
              >
                <div className="text-center">
                  <p className="font-medium text-sm md:text-base">Ver más países</p>
                  <span className="block mt-1 text-primary text-lg">⌄</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
