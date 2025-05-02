"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrency } from "@/context/currency-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function CurrencySettings() {
  const { refreshExchangeRates } = useCurrency()
  const [exchangeRateApiKey, setExchangeRateApiKey] = useState("")
  const [openExchangeRatesApiKey, setOpenExchangeRatesApiKey] = useState("")
  const [currencyApiKey, setCurrencyApiKey] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({
    type: null,
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  // Cargar las API keys existentes
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const apiKeysDoc = await getDoc(doc(db, "config", "apiKeys"))

        if (apiKeysDoc.exists()) {
          const data = apiKeysDoc.data()
          setExchangeRateApiKey(data.exchangeRateApiKey || "")
          setOpenExchangeRatesApiKey(data.openExchangeRatesApiKey || "")
          setCurrencyApiKey(data.currencyApiKey || "")
        }
      } catch (error) {
        console.error("Error al cargar API keys:", error)
      }
    }

    loadApiKeys()
  }, [])

  // Guardar las API keys
  const saveApiKeys = async () => {
    setIsLoading(true)
    setStatus({ type: "info", message: "Guardando API keys..." })

    try {
      await setDoc(doc(db, "config", "apiKeys"), {
        exchangeRateApiKey,
        openExchangeRatesApiKey,
        currencyApiKey,
        updatedAt: new Date(),
      })

      // Actualizar las variables de entorno (esto solo funcionaría en un entorno de desarrollo)
      // En producción, necesitarías configurar estas variables en el panel de control de tu proveedor de hosting
      if (typeof window !== "undefined") {
        // Esto es solo para mostrar cómo se usarían las variables
        console.log("API keys guardadas. En producción, configura estas variables en tu proveedor de hosting:")
        console.log(`EXCHANGE_RATE_API_KEY=${exchangeRateApiKey}`)
        console.log(`OPEN_EXCHANGE_RATES_API_KEY=${openExchangeRatesApiKey}`)
        console.log(`CURRENCY_API_KEY=${currencyApiKey}`)
      }

      // Refrescar las tasas de cambio
      await refreshExchangeRates()

      setStatus({ type: "success", message: "API keys guardadas correctamente. Tasas de cambio actualizadas." })
    } catch (error) {
      console.error("Error al guardar API keys:", error)
      setStatus({ type: "error", message: "Error al guardar API keys. Inténtalo de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Configuración de Moneda</CardTitle>
          <CardDescription>
            Configura las API keys para los servicios de tipo de cambio. Se utilizarán en el orden mostrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="exchangerate">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exchangerate">ExchangeRate-API</TabsTrigger>
              <TabsTrigger value="openexchange">Open Exchange Rates</TabsTrigger>
              <TabsTrigger value="currencyapi">Currency API</TabsTrigger>
            </TabsList>

            <TabsContent value="exchangerate" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exchangerate-api-key">ExchangeRate-API Key</Label>
                <Input
                  id="exchangerate-api-key"
                  value={exchangeRateApiKey}
                  onChange={(e) => setExchangeRateApiKey(e.target.value)}
                  placeholder="Ingresa tu API key de ExchangeRate-API"
                />
                <p className="text-sm text-muted-foreground">
                  Regístrate en{" "}
                  <a
                    href="https://www.exchangerate-api.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ExchangeRate-API
                  </a>{" "}
                  para obtener una API key gratuita. El plan gratuito permite hasta 1,500 solicitudes por mes.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="openexchange" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openexchange-api-key">Open Exchange Rates API Key</Label>
                <Input
                  id="openexchange-api-key"
                  value={openExchangeRatesApiKey}
                  onChange={(e) => setOpenExchangeRatesApiKey(e.target.value)}
                  placeholder="Ingresa tu API key de Open Exchange Rates"
                />
                <p className="text-sm text-muted-foreground">
                  Regístrate en{" "}
                  <a
                    href="https://openexchangerates.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Open Exchange Rates
                  </a>{" "}
                  para obtener una API key gratuita. El plan gratuito permite hasta 1,000 solicitudes por mes.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="currencyapi" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currencyapi-key">Currency API Key</Label>
                <Input
                  id="currencyapi-key"
                  value={currencyApiKey}
                  onChange={(e) => setCurrencyApiKey(e.target.value)}
                  placeholder="Ingresa tu API key de Currency API"
                />
                <p className="text-sm text-muted-foreground">
                  Regístrate en{" "}
                  <a
                    href="https://currencyapi.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Currency API
                  </a>{" "}
                  para obtener una API key gratuita. El plan gratuito permite hasta 300 solicitudes por mes.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {status.type && (
            <Alert
              className={`mt-4 ${
                status.type === "success" ? "bg-green-50" : status.type === "error" ? "bg-red-50" : "bg-blue-50"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : status.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600" />
              )}
              <AlertTitle>
                {status.type === "success" ? "Éxito" : status.type === "error" ? "Error" : "Información"}
              </AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={saveApiKeys} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar API Keys"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Configuración de Variables de Entorno</CardTitle>
          <CardDescription>
            Para configurar las API keys en producción, agrega estas variables de entorno en tu proveedor de hosting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            <p>EXCHANGE_RATE_API_KEY=tu_api_key_aquí</p>
            <p>OPEN_EXCHANGE_RATES_API_KEY=tu_api_key_aquí</p>
            <p>CURRENCY_API_KEY=tu_api_key_aquí</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            En Vercel, puedes agregar estas variables en la sección "Environment Variables" de la configuración de tu
            proyecto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
