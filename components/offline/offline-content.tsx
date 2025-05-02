"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff, Home, RefreshCw } from "lucide-react"

export default function OfflineContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <WifiOff className="h-24 w-24 text-gray-400 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Sin conexión</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Parece que no tienes conexión a internet. Algunas funciones pueden no estar disponibles hasta que te vuelvas a
        conectar.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" className="flex items-center gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>
        </Button>
        <Button className="flex items-center gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
