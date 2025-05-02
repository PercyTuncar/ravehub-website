import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula y formatea el tiempo estimado de lectura de un texto.
 * @param content El contenido a leer
 * @param wordsPerMinute La cantidad promedio de palabras por minuto que una persona puede leer (por defecto: 200)
 * @returns Una cadena formateada con el tiempo de lectura (ej. "5 min de lectura")
 */
export function formatReadingTime(content: string, wordsPerMinute = 200): string {
  // Si no hay contenido, devolver un valor predeterminado
  if (!content) return "1 min de lectura"

  // Contar palabras (dividir por espacios y filtrar elementos vacíos)
  const words = content.trim().split(/\s+/).filter(Boolean).length

  // Calcular minutos redondeando hacia arriba
  const minutes = Math.ceil(words / wordsPerMinute)

  // Formatear el resultado
  return `${minutes} min de lectura`
}

// Format currency with proper symbol and conversion
export function formatCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number> = {},
): string {
  // Get currency info
  const currencies: Record<string, { symbol: string; position: "before" | "after" }> = {
    USD: { symbol: "$", position: "before" },
    PEN: { symbol: "S/", position: "before" },
    CLP: { symbol: "$", position: "before" },
    MXN: { symbol: "$", position: "before" },
    ARS: { symbol: "$", position: "before" },
    BRL: { symbol: "R$", position: "before" },
    COP: { symbol: "$", position: "before" },
    EUR: { symbol: "€", position: "before" },
    GBP: { symbol: "£", position: "before" },
  }

  // Convert amount if needed
  let convertedAmount = amount
  if (fromCurrency !== toCurrency && exchangeRates) {
    // Convert to USD first if not already
    const amountInUSD = fromCurrency === "USD" ? amount : amount / (exchangeRates[fromCurrency] || 1)

    // Then convert from USD to target currency
    convertedAmount = toCurrency === "USD" ? amountInUSD : amountInUSD * (exchangeRates[toCurrency] || 1)
  }

  // Format the number
  const formattedNumber = new Intl.NumberFormat("es-419", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount)

  // Get currency formatting info
  const currencyInfo = currencies[toCurrency] || currencies.USD

  // Return formatted string
  return currencyInfo.position === "before"
    ? `${currencyInfo.symbol}${formattedNumber}`
    : `${formattedNumber} ${currencyInfo.symbol}`
}

// Generate a slug from a string
export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

// Add the following function to generate a slug from a string:
// Generate a slug from a string
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

// Calculate installment payment dates
export function calculateInstallmentDates(
  startDate: Date,
  numberOfInstallments: number,
  frequency: "weekly" | "biweekly" | "monthly",
): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < numberOfInstallments; i++) {
    dates.push(new Date(currentDate))

    // Calculate next date based on frequency
    if (frequency === "weekly") {
      currentDate.setDate(currentDate.getDate() + 7)
    } else if (frequency === "biweekly") {
      currentDate.setDate(currentDate.getDate() + 14)
    } else if (frequency === "monthly") {
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  }

  return dates
}

// Modificar la función formatDate para manejar valores de fecha inválidos
export function formatDate(date: Date | string | number | undefined | null): string {
  if (!date) {
    return "Fecha no disponible"
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date)

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida"
    }

    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error en formato de fecha"
  }
}

// Format time to Spanish locale
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const date = new Date()
  date.setHours(Number.parseInt(hours, 10))
  date.setMinutes(Number.parseInt(minutes, 10))

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

// Calcular el tiempo de lectura estimado
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Formatear tiempo transcurrido
export function formatTimeAgo(date: Date | string | number): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "hace unos segundos"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `hace ${diffInDays} ${diffInDays === 1 ? "día" : "días"}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `hace ${diffInWeeks} ${diffInWeeks === 1 ? "semana" : "semanas"}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `hace ${diffInMonths} ${diffInMonths === 1 ? "mes" : "meses"}`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `hace ${diffInYears} ${diffInYears === 1 ? "año" : "años"}`
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000 // seconds in year

  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 año" : `hace ${Math.floor(interval)} años`
  }

  interval = seconds / 2592000 // seconds in month
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 mes" : `hace ${Math.floor(interval)} meses`
  }

  interval = seconds / 86400 // seconds in day
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 día" : `hace ${Math.floor(interval)} días`
  }

  interval = seconds / 3600 // seconds in hour
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 hora" : `hace ${Math.floor(interval)} horas`
  }

  interval = seconds / 60 // seconds in minute
  if (interval > 1) {
    return Math.floor(interval) === 1 ? "hace 1 minuto" : `hace ${Math.floor(interval)} minutos`
  }

  return seconds <= 5 ? "ahora mismo" : `hace ${Math.floor(seconds)} segundos`
}
