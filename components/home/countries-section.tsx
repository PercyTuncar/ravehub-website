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
    <section className="py-12 md:py-20 bg-gradient-to-b from-background/95 to-background relative overflow-hidden">
      {/* Simplified decorative elements */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4">
        <div className="fade-in-up text-center mb-8 md:mb-16">
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
        </div>

        {/* Simplified mobile view */}
        {isMobile ? (
          <div className="mb-10 overflow-x-auto hide-scrollbar pb-4">
            <div className="flex gap-3">
              {countries.slice(0, 6).map((country, index) => (
                <div
                  key={country.name}
                  className="flex-shrink-0 w-[160px] flex flex-col items-center mx-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="relative w-12 h-12 mb-2 overflow-hidden rounded-full border-2 border-white/10 shadow-inner">
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
              ))}
            </div>
          </div>
        ) : (
          // Simplified desktop view
          <div className="fade-in-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-10 md:mb-16">
            {visibleCountries.map((country, index) => (
              <div
                key={country.name}
                onMouseEnter={() => setActiveCountry(index)}
                onTouchStart={() => setActiveCountry(index)}
                className={`relative rounded-xl p-3 md:p-6 transition-all duration-300 ${
                  activeCountry === index
                    ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5"
                    : "bg-white/5 border border-white/10 hover:border-primary/20"
                }`}
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
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">{country.name}</h3>
                    <div className="flex items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">{country.events} eventos</span>
                      {activeCountry === index && <div className="ml-2 h-2 w-2 rounded-full bg-primary fade-in" />}
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute bottom-2 right-2 md:bottom-3 md:right-3 transition-opacity duration-300 ${
                    activeCountry === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>

                {/* Region indicator */}
                <div className="absolute top-2 right-2 opacity-30">
                  {country.region === "latinamerica" && (
                    <span className="text-[10px] uppercase tracking-wider">LATAM</span>
                  )}
                </div>
              </div>
            ))}
            {!showAllCountries && (
              <div
                className="relative rounded-xl p-3 md:p-6 transition-all duration-300 bg-white/5 border border-white/10 hover:border-primary/20 flex items-center justify-center cursor-pointer"
                onClick={() => setShowAllCountries(true)}
              >
                <div className="text-center">
                  <p className="font-medium">Ver más países</p>
                  <span className="block mt-2 text-primary">⌄</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
