// Interfaces para las respuestas de las APIs
interface ExchangeRateAPIResponse {
  result: string
  conversion_rates: Record<string, number>
}

interface OpenExchangeRatesResponse {
  rates: Record<string, number>
  base: string
}

interface CurrencyAPIResponse {
  data: Record<string, { value: number }>
}

// Función para obtener tasas de cambio de ExchangeRate-API
async function getExchangeRateAPI(): Promise<Record<string, number>> {
  try {
    // Reemplazar con tu API key real
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || ""

    if (!apiKey) {
      console.warn("ExchangeRate-API key no configurada")
      throw new Error("API key no configurada")
    }

    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)

    if (!response.ok) {
      throw new Error(`Error en ExchangeRate-API: ${response.status}`)
    }

    const data: ExchangeRateAPIResponse = await response.json()
    console.log("ExchangeRate-API respuesta exitosa")
    return data.conversion_rates
  } catch (error) {
    console.error("Error al obtener tasas de ExchangeRate-API:", error)
    throw error
  }
}

// Función para obtener tasas de cambio de Open Exchange Rates
async function getOpenExchangeRates(): Promise<Record<string, number>> {
  try {
    // Reemplazar con tu API key real
    const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY || ""

    if (!apiKey) {
      console.warn("Open Exchange Rates API key no configurada")
      throw new Error("API key no configurada")
    }

    const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}`)

    if (!response.ok) {
      throw new Error(`Error en Open Exchange Rates: ${response.status}`)
    }

    const data: OpenExchangeRatesResponse = await response.json()
    console.log("Open Exchange Rates respuesta exitosa")
    return data.rates
  } catch (error) {
    console.error("Error al obtener tasas de Open Exchange Rates:", error)
    throw error
  }
}

// Función para obtener tasas de cambio de Currency API
async function getCurrencyAPI(): Promise<Record<string, number>> {
  try {
    // Reemplazar con tu API key real
    const apiKey = process.env.CURRENCY_API_KEY || ""

    if (!apiKey) {
      console.warn("Currency API key no configurada")
      throw new Error("API key no configurada")
    }

    const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${apiKey}&base_currency=USD`)

    if (!response.ok) {
      throw new Error(`Error en Currency API: ${response.status}`)
    }

    const data: CurrencyAPIResponse = await response.json()
    console.log("Currency API respuesta exitosa")

    // Transformar el formato de respuesta para que coincida con los demás
    const rates: Record<string, number> = {}
    for (const [currency, details] of Object.entries(data.data)) {
      rates[currency] = details.value
    }

    return rates
  } catch (error) {
    console.error("Error al obtener tasas de Currency API:", error)
    throw error
  }
}

// Tasas de cambio predeterminadas como último recurso
const defaultRates: Record<string, number> = {
  USD: 1,
  PEN: 3.7,
  CLP: 900,
  MXN: 17.5,
  ARS: 350,
  BRL: 5.2,
  COP: 4000,
  EUR: 0.92,
  GBP: 0.79,
}

// Función principal que intenta cada API en orden
export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // Intentar con ExchangeRate-API primero
    return await getExchangeRateAPI()
  } catch (error) {
    console.log("Fallback a Open Exchange Rates...")

    try {
      // Si falla, intentar con Open Exchange Rates
      return await getOpenExchangeRates()
    } catch (error) {
      console.log("Fallback a Currency API...")

      try {
        // Si falla, intentar con Currency API
        return await getCurrencyAPI()
      } catch (error) {
        console.log("Todas las APIs fallaron, usando tasas predeterminadas")

        // Si todas fallan, usar tasas predeterminadas
        return defaultRates
      }
    }
  }
}

// Función para convertir precios entre monedas
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  // Normalizar monedas a mayúsculas
  fromCurrency = fromCurrency.toUpperCase()
  toCurrency = toCurrency.toUpperCase()

  // Si es la misma moneda, no necesitamos convertir
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Comprobar si tenemos las tasas necesarias
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.warn(`Tasa de cambio no disponible para ${fromCurrency} o ${toCurrency}`, rates)
    return amount // Devolver el monto original si no hay tasas disponibles
  }

  // Convertir a USD primero (si no es USD)
  const amountInUSD = fromCurrency === "USD" ? amount : amount / rates[fromCurrency]

  // Luego convertir de USD a la moneda objetivo
  const convertedAmount = toCurrency === "USD" ? amountInUSD : amountInUSD * rates[toCurrency]

  // Redondear a 2 decimales para evitar problemas de precisión
  return Math.round(convertedAmount * 100) / 100
}

// Función para formatear el precio según la moneda
export function formatCurrencyValue(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): string {
  // Validar parámetros
  if (typeof amount !== "number") {
    console.error("formatCurrencyValue: amount no es un número", amount)
    return "0.00"
  }

  if (!fromCurrency || typeof fromCurrency !== "string") {
    console.error("formatCurrencyValue: fromCurrency no es válido", fromCurrency)
    fromCurrency = "USD"
  }

  if (!toCurrency || typeof toCurrency !== "string") {
    console.error("formatCurrencyValue: toCurrency no es válido", toCurrency)
    toCurrency = "USD"
  }

  // Normalizar monedas a mayúsculas
  fromCurrency = fromCurrency.toUpperCase()
  toCurrency = toCurrency.toUpperCase()

  console.log(`Conversión: ${amount} ${fromCurrency} -> ${toCurrency}`, { rates })

  // Verificar si tenemos las tasas necesarias
  if (!rates[fromCurrency]) {
    console.error(`No hay tasa para ${fromCurrency}`, rates)
  }

  if (!rates[toCurrency]) {
    console.error(`No hay tasa para ${toCurrency}`, rates)
  }

  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency, rates)
  console.log(`Resultado: ${convertedAmount} ${toCurrency}`)

  return convertedAmount.toFixed(2)
}
