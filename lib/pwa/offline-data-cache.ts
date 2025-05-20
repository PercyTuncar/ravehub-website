import { openDB, type DBSchema } from "idb"

// Definir el esquema de la base de datos IndexedDB
interface OfflineDataDB extends DBSchema {
  "cached-data": {
    key: string
    value: {
      data: any
      timestamp: number
      expiry: number | null
    }
    indexes: {
      "by-timestamp": number
    }
  }
}

export class OfflineDataCache {
  private static instance: OfflineDataCache
  private dbPromise: Promise<any>

  private constructor() {
    // Inicializar la base de datos IndexedDB
    this.dbPromise = openDB<OfflineDataDB>("ravehub-offline-data", 1, {
      upgrade(db) {
        const store = db.createObjectStore("cached-data", {
          keyPath: "key",
        })

        // Crear índice para consultas por timestamp
        store.createIndex("by-timestamp", "timestamp")
      },
    })
  }

  public static getInstance(): OfflineDataCache {
    if (!OfflineDataCache.instance) {
      OfflineDataCache.instance = new OfflineDataCache()
    }
    return OfflineDataCache.instance
  }

  // Guardar datos en caché
  public async setData(key: string, data: any, expiryInMinutes: number | null = 60): Promise<void> {
    const db = await this.dbPromise

    const entry = {
      key,
      data,
      timestamp: Date.now(),
      expiry: expiryInMinutes ? Date.now() + expiryInMinutes * 60 * 1000 : null,
    }

    await db.put("cached-data", entry)
    console.log(`📦 Datos guardados en caché: ${key}`)
  }

  // Obtener datos de caché
  public async getData(key: string): Promise<any | null> {
    const db = await this.dbPromise
    const entry = await db.get("cached-data", key)

    if (!entry) {
      console.log(`🔍 Datos no encontrados en caché: ${key}`)
      return null
    }

    // Verificar si los datos han expirado
    if (entry.expiry && entry.expiry < Date.now()) {
      console.log(`⏰ Datos expirados en caché: ${key}`)
      await this.removeData(key)
      return null
    }

    console.log(`📦 Datos recuperados de caché: ${key}`)
    return entry.data
  }

  // Eliminar datos de caché
  public async removeData(key: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete("cached-data", key)
    console.log(`🗑️ Datos eliminados de caché: ${key}`)
  }

  // Limpiar datos expirados
  public async clearExpiredData(): Promise<number> {
    const db = await this.dbPromise
    const now = Date.now()

    // Obtener todas las entradas
    const entries = await db.getAll("cached-data")

    // Filtrar entradas expiradas
    const expiredEntries = entries.filter((entry) => entry.expiry && entry.expiry < now)

    // Eliminar entradas expiradas
    for (const entry of expiredEntries) {
      await db.delete("cached-data", entry.key)
    }

    console.log(`🧹 ${expiredEntries.length} entradas expiradas eliminadas`)
    return expiredEntries.length
  }

  // Obtener todas las claves de caché
  public async getAllKeys(): Promise<string[]> {
    const db = await this.dbPromise
    const entries = await db.getAll("cached-data")
    return entries.map((entry) => entry.key)
  }

  // Obtener el tamaño aproximado de la caché en bytes
  public async getCacheSize(): Promise<number> {
    const db = await this.dbPromise
    const entries = await db.getAll("cached-data")

    // Calcular tamaño aproximado
    let totalSize = 0

    for (const entry of entries) {
      // Convertir a JSON y medir la longitud
      const jsonSize = JSON.stringify(entry.data).length
      totalSize += jsonSize
    }

    return totalSize
  }
}

// Hook para usar en componentes React
export function useOfflineDataCache() {
  const cache = OfflineDataCache.getInstance()

  return {
    setData: cache.setData.bind(cache),
    getData: cache.getData.bind(cache),
    removeData: cache.removeData.bind(cache),
    clearExpiredData: cache.clearExpiredData.bind(cache),
    getAllKeys: cache.getAllKeys.bind(cache),
    getCacheSize: cache.getCacheSize.bind(cache),
  }
}
