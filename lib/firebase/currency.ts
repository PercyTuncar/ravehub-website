import { db } from "@/lib/firebase/config"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getExchangeRates as getApiExchangeRates } from "@/lib/currency/exchange-api"

// Tiempo de caché en milisegundos (1 hora)
const CACHE_TIME = 60 * 60 * 1000

// Función para obtener tasas de cambio
export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // Intentar obtener tasas de cambio de Firestore primero
    const ratesDoc = await getDoc(doc(db, "config", "exchangeRates"))

    if (ratesDoc.exists()) {
      const data = ratesDoc.data()
      const lastUpdated = data.timestamp?.toMillis() || 0
      const now = Date.now()

      // Si las tasas están actualizadas (menos de 1 hora), usarlas
      if (now - lastUpdated < CACHE_TIME) {
        console.log("Usando tasas de cambio en caché de Firestore")
        return data.rates
      }
    }

    // Si no hay tasas en caché o están desactualizadas, obtener nuevas tasas
    console.log("Obteniendo nuevas tasas de cambio de las APIs")
    const rates = await getApiExchangeRates()

    // Guardar las nuevas tasas en Firestore
    await setDoc(doc(db, "config", "exchangeRates"), {
      rates,
      timestamp: new Date(),
    })

    return rates
  } catch (error) {
    console.error("Error al obtener tasas de cambio:", error)
    throw error
  }
}
