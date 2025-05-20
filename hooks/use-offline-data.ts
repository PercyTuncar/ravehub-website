"use client"

import { useState, useEffect, useCallback } from "react"
import { useOfflineDataCache } from "@/lib/pwa/offline-data-cache"
import { useOfflineSync } from "@/hooks/use-offline-sync"

interface UseOfflineDataOptions {
  key: string
  fetcher: () => Promise<any>
  expiryInMinutes?: number | null
  dependencies?: any[]
}

export function useOfflineData<T>({ key, fetcher, expiryInMinutes = 60, dependencies = [] }: UseOfflineDataOptions) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  const cache = useOfflineDataCache()
  const { isOnline } = useOfflineSync()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Intentar obtener datos de la caché primero
      const cachedData = await cache.getData(key)

      if (cachedData) {
        setData(cachedData)
        setIsFromCache(true)
        setIsLoading(false)

        // Si estamos online, actualizar en segundo plano
        if (isOnline) {
          try {
            const freshData = await fetcher()
            await cache.setData(key, freshData, expiryInMinutes)
            setData(freshData)
            setIsFromCache(false)
          } catch (backgroundError) {
            console.error(`Error al actualizar datos en segundo plano para ${key}:`, backgroundError)
            // No actualizamos el estado de error para no interrumpir la UI
          }
        }
      } else {
        // No hay datos en caché, intentar obtener de la red
        if (isOnline) {
          const freshData = await fetcher()
          await cache.setData(key, freshData, expiryInMinutes)
          setData(freshData)
          setIsFromCache(false)
          setIsLoading(false)
        } else {
          // Estamos offline y no hay datos en caché
          throw new Error("No hay conexión a internet y no se encontraron datos en caché")
        }
      }
    } catch (err) {
      console.error(`Error al obtener datos para ${key}:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setIsLoading(false)
    }
  }, [key, fetcher, expiryInMinutes, isOnline, cache])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  // Función para forzar una recarga
  const refetch = useCallback(() => {
    return fetchData()
  }, [fetchData])

  // Función para invalidar la caché
  const invalidateCache = useCallback(async () => {
    await cache.removeData(key)
    return fetchData()
  }, [key, fetchData, cache])

  return {
    data,
    isLoading,
    error,
    isFromCache,
    refetch,
    invalidateCache,
  }
}
