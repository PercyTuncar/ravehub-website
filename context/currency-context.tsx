"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useGeolocation } from "@/context/geolocation-context"
import { useAuth } from "@/context/auth-context"
import { getExchangeRates } from "@/lib/firebase/currency"
import { formatCurrencyValue, convertCurrency } from "@/lib/currency/exchange-api"
import { currencies, countryToCurrency } from "@/lib/constants"

interface CurrencyContextType {
  currency: string
  setCurrency: (currency: string) => void
  exchangeRates: Record<string, number>
  loading: boolean
  refreshExchangeRates: () => Promise<void>
  formatCurrency: (amount: number, fromCurrency: string, toCurrency: string) => string
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { country, loading: geoLoading } = useGeolocation()
  const { user } = useAuth()
  const [currency, setCurrency] = useState<string>("USD")
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // Función para refrescar las tasas de cambio
  const refreshExchangeRates = useCallback(async () => {
    try {
      console.log("Refrescando tasas de cambio...")
      setLoading(true)
      const rates = await getExchangeRates()
      setExchangeRates(rates)
      console.log("Tasas de cambio actualizadas:", rates)
      // Forzar actualización de componentes
      setForceUpdate((prev) => prev + 1)
    } catch (error) {
      console.error("Error al refrescar tasas de cambio:", error)
      // Default to 1:1 exchange rate if API fails
      setExchangeRates({
        USD: 1,
        PEN: 3.7,
        CLP: 900,
        MXN: 17.5,
        ARS: 350,
        BRL: 5.2,
        COP: 4000,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Función para formatear moneda
  const formatCurrency = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): string => {
      if (Object.keys(exchangeRates).length === 0) {
        return `${amount.toFixed(2)} ${fromCurrency}`
      }
      return formatCurrencyValue(amount, fromCurrency, toCurrency, exchangeRates)
    },
    [exchangeRates],
  )

  // Función para convertir moneda
  const convertCurrencyValue = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number => {
      if (Object.keys(exchangeRates).length === 0) {
        return amount
      }
      return convertCurrency(amount, fromCurrency, toCurrency, exchangeRates)
    },
    [exchangeRates],
  )

  // Load exchange rates
  useEffect(() => {
    // Cargar tasas inmediatamente
    refreshExchangeRates().then(() => {
      console.log("Tasas de cambio iniciales cargadas")
      // Forzar una actualización de la interfaz
      window.dispatchEvent(new CustomEvent("currency-changed", { detail: currency }))
    })

    // Configurar intervalo para actualizar tasas cada hora
    const interval = setInterval(
      () => {
        refreshExchangeRates().then(() => {
          console.log("Tasas de cambio actualizadas periódicamente")
          // Forzar una actualización de la interfaz
          window.dispatchEvent(new CustomEvent("currency-changed", { detail: currency }))
        })
      },
      60 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [refreshExchangeRates, currency])

  // Set initial currency based on user preference or geolocation
  useEffect(() => {
    // Solo ejecutamos esta lógica cuando la geolocalización ha terminado de cargar
    // y no hemos hecho la carga inicial aún
    if (!geoLoading && !initialLoadDone) {
      const setCurrencyBasedOnPriority = async () => {
        console.log("Estableciendo moneda basada en prioridades...")
        console.log("País detectado:", country)

        let selectedCurrency = "USD" // Valor por defecto
        let source = "default"

        // First priority: Check localStorage
        const savedCurrency = typeof window !== "undefined" ? localStorage.getItem("preferredCurrency") : null

        if (savedCurrency && currencies.some((c) => c.code === savedCurrency)) {
          selectedCurrency = savedCurrency
          source = "localStorage"
        }
        // Second priority: Use logged in user's preference
        else if (user?.preferredCurrency) {
          selectedCurrency = user.preferredCurrency
          source = "userPreference"
        }
        // Third priority: Use user's country from profile if available
        else if (user?.country && countryToCurrency[user.country]) {
          selectedCurrency = countryToCurrency[user.country]
          source = "userCountry"
        }
        // Fourth priority: Use geolocation
        else if (country && countryToCurrency[country]) {
          selectedCurrency = countryToCurrency[country]
          source = "geolocation"

          // Si el país es CL, aseguramos que la moneda sea CLP
          if (country === "CL") {
            selectedCurrency = "CLP"
          }
        }

        console.log(`Moneda seleccionada: ${selectedCurrency} (fuente: ${source})`)
        setCurrency(selectedCurrency)

        // Guardamos en localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("preferredCurrency", selectedCurrency)
        }

        setInitialLoadDone(true)
      }

      setCurrencyBasedOnPriority()
    }
  }, [user, country, geoLoading, initialLoadDone])

  // Save currency preference to localStorage when it changes manually
  useEffect(() => {
    if (typeof window !== "undefined" && currency && initialLoadDone) {
      console.log("Guardando preferencia de moneda en localStorage:", currency)
      localStorage.setItem("preferredCurrency", currency)

      // Disparar evento personalizado para notificar cambio de moneda
      window.dispatchEvent(new CustomEvent("currency-changed", { detail: currency }))

      // Forzar actualización de componentes
      setForceUpdate((prev) => prev + 1)
    }
  }, [currency, initialLoadDone])

  // Debug de tasas de cambio
  useEffect(() => {
    if (Object.keys(exchangeRates).length > 0) {
      console.log("Tasas de cambio actuales:", exchangeRates)
    }
  }, [exchangeRates])

  // Reemplazar la función setCurrency actual con esta versión mejorada
  const setCurrencyWithUpdate = useCallback(
    (newCurrency: string) => {
      console.log(`Cambiando moneda de ${currency} a ${newCurrency}`)

      // Actualizar el estado
      setCurrency(newCurrency)

      // Guardar en localStorage inmediatamente
      if (typeof window !== "undefined") {
        localStorage.setItem("preferredCurrency", newCurrency)
      }

      // Forzar actualización inmediata con un pequeño retraso para permitir que el estado se actualice
      setTimeout(() => {
        console.log("Disparando evento currency-changed")

        // Disparar el evento con la nueva moneda
        window.dispatchEvent(
          new CustomEvent("currency-changed", {
            detail: newCurrency,
            bubbles: true,
            composed: true,
          }),
        )

        // Incrementar el contador de actualizaciones forzadas
        setForceUpdate((prev) => prev + 1)

        // Forzar un reflow del DOM para asegurar que los cambios visuales se apliquen
        document.body.offsetHeight
      }, 10)
    },
    [currency],
  )

  // Actualizar el contextValue para usar la nueva función
  const contextValue = {
    currency,
    setCurrency: setCurrencyWithUpdate,
    exchangeRates,
    loading: loading || (geoLoading && !initialLoadDone),
    refreshExchangeRates,
    formatCurrency,
    convertCurrency: convertCurrencyValue,
    _forceUpdate: forceUpdate,
  }

  return <CurrencyContext.Provider value={contextValue}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
