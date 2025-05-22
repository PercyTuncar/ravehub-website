"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import Image from "next/image"
import { Globe, MapPin } from "lucide-react"

// Definir los tipos fuera de la función del componente
interface CountryData {
  name: string
  flagUrl: string
  events: number
  region: string
}

// Datos de países definidos directamente en el componente
const countries: CountryData[] = [
  {
    name: "España",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spain-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 30,
    region: "europa",
  },
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
    name: "Argentina",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/argentina-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 22,
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
    name: "Venezuela",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/venezuela-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 10,
    region: "latinamerica",
  },
  {
    name: "Chile",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/chile-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 14,
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
    name: "Guatemala",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/guatemala-flag-round-icon-128-HTa89IKyvYCCzcl3uSHc34GrfOU2YW.png",
    events: 6,
    region: "latinamerica",
  },
  {
    name: "Cuba",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cuba-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 8,
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
    name: "Rep. Dominicana",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dominican-republic-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 9,
    region: "latinamerica",
  },
  {
    name: "Guinea Ecuatorial",
    flagUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/equatorial-guinea-flag-round-icon-128-Hs9Ik2JLpQwEQxnVzDFJpAKrfOU2YW.png",
    events: 2,
    region: "africa",
  },
]

export function CountriesSection() {
  const [activeRegion, setActiveRegion] = useState<string>("all")
  const [isMobile, setIsMobile] = useState(false)

  // Optimización: Usar useCallback para funciones estables
  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Filtrar países por región - Mostrar todos los países cuando se selecciona "all"
  const filteredCountries = useMemo(() => {
    if (activeRegion === "all") {
      // Mostrar todos los países cuando se selecciona "Todos"
      return countries
    } else {
      // Para otras regiones, mostrar solo los primeros 8 países de esa región
      return countries.filter((country) => country.region === activeRegion).slice(0, 8)
    }
  }, [activeRegion])

  // Optimización: Usar ResizeObserver una sola vez al montar
  useEffect(() => {
    checkIfMobile()

    // Usar ResizeObserver en lugar de eventos de ventana para mejor rendimiento
    const resizeObserver = new ResizeObserver(checkIfMobile)
    resizeObserver.observe(document.body)

    return () => resizeObserver.disconnect()
  }, [checkIfMobile])

  return (
    <section className="py-12 bg-white relative overflow-hidden">
      {/* Elementos decorativos modernos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/3 opacity-70" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10">
          <div className="mb-6 md:mb-0">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-primary mb-3">
              <Globe className="h-4 w-4 mr-2 text-primary" />
              <span className="text-xs font-medium">Eventos de Música Electronica en LATAM</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Encuentra Los Mejores Festivales de Música Electrónica
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
             Descubre
              festivales exclusivos, DJs internacionales y experiencias únicas en cada país.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-lg shadow-sm">
            <button
              onClick={() => setActiveRegion("all")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                activeRegion === "all"
                  ? "bg-white text-primary shadow-sm font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveRegion("latinamerica")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                activeRegion === "latinamerica"
                  ? "bg-white text-primary shadow-sm font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Latinoamérica
            </button>
            <button
              onClick={() => setActiveRegion("europa")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                activeRegion === "europa"
                  ? "bg-white text-primary shadow-sm font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Europa
            </button>
            <button
              onClick={() => setActiveRegion("africa")}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                activeRegion === "africa"
                  ? "bg-white text-primary shadow-sm font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              África
            </button>
          </div>
        </div>

        {/* Contenedor con scroll horizontal para países */}
        <div className="relative">
          <div className="overflow-x-auto pb-4 hide-scrollbar">
            <div className="flex gap-3" style={{ minWidth: isMobile ? `${filteredCountries.length * 160}px` : "auto" }}>
              {filteredCountries.map((country) => (
                <div key={country.name} className="flex-shrink-0 group" style={{ width: isMobile ? "150px" : "180px" }}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-gray-200 h-full flex flex-col">
                    <div className="relative h-20 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10 bg-pattern-dots"></div>
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <Image
                          src={country.flagUrl || "/placeholder.svg"}
                          alt={`Bandera de ${country.name}`}
                          fill
                          sizes="56px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div className="p-3 text-center flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{country.name}</h3>
                        <div className="mt-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                          <MapPin className="h-3 w-3 mr-1 text-primary" />
                          <span>{country.events} eventos</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {country.region === "latinamerica" && "Latinoamérica"}
                          {country.region === "europa" && "Europa"}
                          {country.region === "africa" && "África"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores de scroll */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        </div>
      </div>
    </section>
  )
}
