"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface GeolocationContextType {
  country: string | null
  loading: boolean
  error: string | null
  city?: string | null
  region?: string | null
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

// API Keys proporcionadas por el usuario
const API_KEYS = {
  ipgeolocation: "a0bd5909819c43af99d9216158838f5c",
  ipstack: "a67e585de5bb0d0a199933a958db8618",
  ipdata: "136be60cc7cb618995d5c539045807f3f9536418ce7ceea95c0d0745",
}

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [region, setRegion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Primero verificamos si hay un país guardado en localStorage
        if (typeof window !== "undefined") {
          const savedCountry = localStorage.getItem("userCountry")
          const savedCity = localStorage.getItem("userCity")
          const savedRegion = localStorage.getItem("userRegion")

          // Si tenemos datos guardados y no han pasado más de 24 horas, los usamos
          const lastUpdate = localStorage.getItem("geoLastUpdate")
          const now = Date.now()
          const ONE_DAY = 24 * 60 * 60 * 1000 // 24 horas en milisegundos

          if (savedCountry && lastUpdate && now - Number.parseInt(lastUpdate) < ONE_DAY) {
            setCountry(savedCountry)
            if (savedCity) setCity(savedCity)
            if (savedRegion) setRegion(savedRegion)
            setLoading(false)
            return
          }
        }

        // Si no hay datos guardados o han expirado, consultamos las APIs

        // 1. Intentamos con ipgeolocation.io (primera opción)
        try {
          const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEYS.ipgeolocation}`)

          if (response.ok) {
            const data = await response.json()

            if (data.country_code2) {
              const detectedCountry = data.country_code2
              const detectedCity = data.city || null
              const detectedRegion = data.state_prov || null

              setCountry(detectedCountry)
              setCity(detectedCity)
              setRegion(detectedRegion)

              // Guardamos en localStorage con timestamp
              if (typeof window !== "undefined") {
                localStorage.setItem("userCountry", detectedCountry)
                if (detectedCity) localStorage.setItem("userCity", detectedCity)
                if (detectedRegion) localStorage.setItem("userRegion", detectedRegion)
                localStorage.setItem("geoLastUpdate", Date.now().toString())
              }

              setLoading(false)
              return
            }
          } else {
            console.warn("Error en respuesta de ipgeolocation.io:", response.status)
          }
        } catch (err) {
          console.error("Error con ipgeolocation.io:", err)
        }

        // 2. Si falla, intentamos con ipstack.com (segunda opción)
        try {
          const response = await fetch(`http://api.ipstack.com/check?access_key=${API_KEYS.ipstack}`)

          if (response.ok) {
            const data = await response.json()

            if (data.country_code) {
              const detectedCountry = data.country_code
              const detectedCity = data.city || null
              const detectedRegion = data.region_name || null

              setCountry(detectedCountry)
              setCity(detectedCity)
              setRegion(detectedRegion)

              // Guardamos en localStorage con timestamp
              if (typeof window !== "undefined") {
                localStorage.setItem("userCountry", detectedCountry)
                if (detectedCity) localStorage.setItem("userCity", detectedCity)
                if (detectedRegion) localStorage.setItem("userRegion", detectedRegion)
                localStorage.setItem("geoLastUpdate", Date.now().toString())
              }

              setLoading(false)
              return
            }
          } else {
            console.warn("Error en respuesta de ipstack.com:", response.status)
          }
        } catch (err) {
          console.error("Error con ipstack.com:", err)
        }

        // 3. Si falla, intentamos con ipdata.co (tercera opción)
        try {
          const response = await fetch(`https://api.ipdata.co?api-key=${API_KEYS.ipdata}`)

          if (response.ok) {
            const data = await response.json()

            if (data.country_code) {
              const detectedCountry = data.country_code
              const detectedCity = data.city || null
              const detectedRegion = data.region || null

              setCountry(detectedCountry)
              setCity(detectedCity)
              setRegion(detectedRegion)

              // Guardamos en localStorage con timestamp
              if (typeof window !== "undefined") {
                localStorage.setItem("userCountry", detectedCountry)
                if (detectedCity) localStorage.setItem("userCity", detectedCity)
                if (detectedRegion) localStorage.setItem("userRegion", detectedRegion)
                localStorage.setItem("geoLastUpdate", Date.now().toString())
              }

              setLoading(false)
              return
            }
          } else {
            console.warn("Error en respuesta de ipdata.co:", response.status)
          }
        } catch (err) {
          console.error("Error con ipdata.co:", err)
        }

        // 4. Si todas las APIs fallan, intentamos con una API sin clave como último recurso
        try {
          const response = await fetch("https://ipapi.co/json/", {
            headers: {
              Accept: "application/json",
              "User-Agent": "Ravehub/1.0",
            },
          })

          if (response.ok) {
            const data = await response.json()

            if (data.country) {
              const detectedCountry = data.country
              const detectedCity = data.city || null
              const detectedRegion = data.region || null

              setCountry(detectedCountry)
              setCity(detectedCity)
              setRegion(detectedRegion)

              // Guardamos en localStorage con timestamp
              if (typeof window !== "undefined") {
                localStorage.setItem("userCountry", detectedCountry)
                if (detectedCity) localStorage.setItem("userCity", detectedCity)
                if (detectedRegion) localStorage.setItem("userRegion", detectedRegion)
                localStorage.setItem("geoLastUpdate", Date.now().toString())
              }

              setLoading(false)
              return
            }
          } else {
            console.warn("Error en respuesta de API de respaldo:", response.status)
          }
        } catch (err) {
          console.error("Error con API de respaldo:", err)
        }

        // Si todas las APIs fallan, establecemos US como país por defecto
        console.warn("Todas las APIs de geolocalización fallaron, usando país por defecto (US)")
        setCountry("US")
        if (typeof window !== "undefined") {
          localStorage.setItem("userCountry", "US")
          localStorage.setItem("geoLastUpdate", Date.now().toString())
        }
      } catch (err) {
        console.error("Error general detectando país:", err)
        setError("No se pudo detectar tu ubicación")
        // Establecemos US como país por defecto
        setCountry("US")
        if (typeof window !== "undefined") {
          localStorage.setItem("userCountry", "US")
          localStorage.setItem("geoLastUpdate", Date.now().toString())
        }
      } finally {
        setLoading(false)
      }
    }

    detectCountry()
  }, [])

  return (
    <GeolocationContext.Provider value={{ country, city, region, loading, error }}>
      {children}
    </GeolocationContext.Provider>
  )
}

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider")
  }
  return context
}
