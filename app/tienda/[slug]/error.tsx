"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registrar el error en un servicio de análisis o monitoreo
    console.error("Product page error:", error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">Algo salió mal</h2>
      <p className="mb-8 text-gray-600">
        No pudimos cargar la información del producto. Por favor, inténtalo de nuevo.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={reset} variant="default">
          Intentar de nuevo
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tienda">Volver a la tienda</Link>
        </Button>
      </div>
    </div>
  )
}
