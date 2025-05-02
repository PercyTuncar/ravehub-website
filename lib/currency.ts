import { db } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"

// Interfaz para las tasas de cambiorfaz para las tasas de cambio
export interface ExchangeRates {
  [currency: string]: number
}

// Función para obtener las tasas de cambio
export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    // Primero intentamos obtener las tasas de cambio de localStorage para evitar llamadas innecesarias
    const cachedRates = localStorage.getItem("exchangeRates")
    const cachedTimestamp = localStorage.getItem("exchangeRatesTimestamp")

    // Si tenemos tasas en caché y no han pasado más de 1 hora, las usamos
    if (cachedRates && cachedTimestamp) {
      const timestamp = Number.parseInt(cachedTimestamp)
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      if (now - timestamp < oneHour) {
        console.log("Usando tasas de cambio en caché de localStorage")
        return JSON.parse(cachedRates)
      }
    }

    // Si no hay caché válida, intentamos obtener las tasas de Firestore
    console.log("Obteniendo tasas de cambio de Firestore")
    const ratesDoc = await getDoc(doc(db, "settings", "exchangeRates"))

    if (ratesDoc.exists()) {
      const data = ratesDoc.data()
      console.log("Tasas de cambio obtenidas de Firestore")

      // Guardar en localStorage para futuras consultas
      localStorage.setItem("exchangeRates", JSON.stringify(data.rates))
      localStorage.setItem("exchangeRatesTimestamp", Date.now().toString())

      return data.rates
    } else {
      // Si no hay documento en Firestore, intentamos obtener de la API
      console.log("No hay tasas en Firestore, obteniendo de API externa")
      return await fetchExchangeRatesFromAPI()
    }
  } catch (error) {
    console.error("Error al obtener tasas de cambio:", error)

    // En caso de error, intentamos usar la caché aunque sea antigua
    const cachedRates = localStorage.getItem("exchangeRates")
    if (cachedRates) {
      console.log("Usando tasas de cambio en caché antiguas debido a error")
      return JSON.parse(cachedRates)
    }

    // Si todo falla, devolvemos un objeto vacío
    return {}
  }
}

// Función para obtener tasas de cambio de una API externa
async function fetchExchangeRatesFromAPI(): Promise<ExchangeRates> {
  try {
    // Usamos Open Exchange Rates API (requiere API key)
    const apiKey = process.env.NEXT_PUBLIC_OPEN_EXCHANGE_RATES_API_KEY

    if (!apiKey) {
      throw new Error("No se encontró API key para Open Exchange Rates")
    }

    const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}`)
    const data = await response.json()

    if (data.rates) {
      console.log("Tasas de cambio obtenidas de API externa")

      // Guardar en localStorage solamente (no en Firestore)
      localStorage.setItem("exchangeRates", JSON.stringify(data.rates))
      localStorage.setItem("exchangeRatesTimestamp", Date.now().toString())

      return data.rates
    } else {
      throw new Error("Formato de respuesta de API inválido")
    }
  } catch (error) {
    console.error("Error al obtener tasas de API externa:", error)
    return {}
  }
}

// Función para convertir un precio entre monedas
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates,
): number {
  if (!rates || Object.keys(rates).length === 0) {
    console.warn("No hay tasas de cambio disponibles para conversión")
    return amount
  }

  if (fromCurrency === toCurrency) {
    return amount
  }

  try {
    // Normalizar monedas
    const from = fromCurrency.toUpperCase()
    const to = toCurrency.toUpperCase()

    // Verificar si tenemos las tasas necesarias
    if (!rates[from] && from !== "USD") {
      console.warn(`No hay tasa para ${from}`)
      return amount
    }

    if (!rates[to] && to !== "USD") {
      console.warn(`No hay tasa para ${to}`)
      return amount
    }

    // Convertir a USD primero (si no es USD ya)
    const amountInUSD = from === "USD" ? amount : amount / rates[from]

    // Luego convertir de USD a la moneda objetivo
    const convertedAmount = to === "USD" ? amountInUSD : amountInUSD * rates[to]

    return convertedAmount
  } catch (error) {
    console.error("Error al convertir moneda:", error)
    return amount
  }
}
