"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrency } from "@/context/currency-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function CurrencySettings() {
  const { refreshExchangeRates, rates } = useCurrency()
  const [exchangeRateApiKey, setExchangeRateApiKey] = useState("")
  const [openExchangeRatesApiKey, setOpenExchangeRatesApiKey] = useState("")
  const [currencyApiKey, setCurrencyApiKey] = useState("")
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({
    type: null,
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [availableCurrencies, setAvailableCurrencies] = useState<
    Array<{ code: string; name: string; enabled: boolean; symbol: string }>
  >([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Cargar las API keys existentes y configuración de monedas
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Cargar API keys
        const apiKeysDoc = await getDoc(doc(db, "config", "apiKeys"))
        if (apiKeysDoc.exists()) {
          const data = apiKeysDoc.data()
          setExchangeRateApiKey(data.exchangeRateApiKey || "")
          setOpenExchangeRatesApiKey(data.openExchangeRatesApiKey || "")
          setCurrencyApiKey(data.currencyApiKey || "")

          if (data.lastUpdated) {
            setLastUpdated(data.lastUpdated.toDate())
          }
        }

        // Cargar configuración de monedas
        const currencyConfigDoc = await getDoc(doc(db, "config", "currencies"))
        if (currencyConfigDoc.exists()) {
          const data = currencyConfigDoc.data()
          setAvailableCurrencies(data.availableCurrencies || getDefaultCurrencies())
        } else {
          // Si no existe, usar valores predeterminados
          setAvailableCurrencies(getDefaultCurrencies())
        }
      } catch (error) {
        console.error("Error al cargar configuración:", error)
        setStatus({
          type: "error",
          message: "Error al cargar la configuración. Por favor, intenta de nuevo.",
        })
      }
    }

    loadSettings()
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

      setStatus({ type: "success", message: "API keys guardadas correctamente." })
    } catch (error) {
      console.error("Error al guardar API keys:", error)
      setStatus({
        type: "error",
        message: "Error al guardar API keys. Inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar tasas de cambio manualmente
  const handleRefreshRates = async () => {
    setIsRefreshing(true)
    setStatus({ type: "info", message: "Actualizando tasas de cambio..." })

    try {
      await refreshExchangeRates()

      // Actualizar la fecha de última actualización
      await updateDoc(doc(db, "config", "apiKeys"), {
        lastUpdated: new Date(),
      })

      setLastUpdated(new Date())
      setStatus({ type: "success", message: "Tasas de cambio actualizadas correctamente." })
    } catch (error) {
      console.error("Error al actualizar tasas de cambio:", error)
      setStatus({
        type: "error",
        message: "Error al actualizar tasas de cambio. Inténtalo de nuevo.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Guardar configuración de monedas
  const saveCurrencyConfig = async () => {
    setIsLoading(true)
    setStatus({ type: "info", message: "Guardando configuración de monedas..." })

    try {
      await setDoc(doc(db, "config", "currencies"), {
        availableCurrencies,
        updatedAt: new Date(),
      })

      setStatus({ type: "success", message: "Configuración de monedas guardada correctamente." })
    } catch (error) {
      console.error("Error al guardar configuración de monedas:", error)
      setStatus({
        type: "error",
        message: "Error al guardar configuración de monedas. Inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cambiar el estado de habilitación de una moneda
  const toggleCurrencyEnabled = (code: string) => {
    setAvailableCurrencies((prev) =>
      prev.map((currency) => (currency.code === code ? { ...currency, enabled: !currency.enabled } : currency)),
    )
  }

  // Obtener lista predeterminada de monedas
  const getDefaultCurrencies = () => [
    { code: "USD", name: "Dólar estadounidense", enabled: true, symbol: "$" },
    { code: "PEN", name: "Sol peruano", enabled: true, symbol: "S/" },
    { code: "EUR", name: "Euro", enabled: true, symbol: "€" },
    { code: "GBP", name: "Libra esterlina", enabled: true, symbol: "£" },
    { code: "MXN", name: "Peso mexicano", enabled: true, symbol: "$" },
    { code: "CLP", name: "Peso chileno", enabled: true, symbol: "$" },
    { code: "ARS", name: "Peso argentino", enabled: true, symbol: "$" },
    { code: "BRL", name: "Real brasileño", enabled: true, symbol: "R$" },
    { code: "COP", name: "Peso colombiano", enabled: true, symbol: "$" },
  ]

  return (
    <div className="space-y-8">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys para Tipos de Cambio</CardTitle>
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

      {/* Tasas de Cambio Actuales */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tasas de Cambio Actuales</CardTitle>
              <CardDescription>
                Tasas de cambio actuales con respecto al USD. Última actualización:{" "}
                {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Nunca"}
              </CardDescription>
            </div>
            <Button onClick={handleRefreshRates} disabled={isRefreshing} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Tasa (1 USD =)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates
                  ? Object.entries(rates)
                      .filter(([code]) => code !== "USD") // Excluir USD
                      .sort(([codeA], [codeB]) => codeA.localeCompare(codeB)) // Ordenar alfabéticamente
                      .map(([code, rate]) => (
                        <TableRow key={code}>
                          <TableCell>{availableCurrencies.find((c) => c.code === code)?.name || code}</TableCell>
                          <TableCell>{code}</TableCell>
                          <TableCell className="text-right font-mono">{rate.toFixed(4)}</TableCell>
                        </TableRow>
                      ))
                  : // Skeleton loader mientras se cargan las tasas
                    Array(8)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-10" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-4 w-16 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monedas Disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Monedas Disponibles</CardTitle>
          <CardDescription>
            Configura qué monedas estarán disponibles para los usuarios en el selector de moneda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Símbolo</TableHead>
                  <TableHead className="text-right">Habilitada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableCurrencies.map((currency) => (
                  <TableRow key={currency.code}>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.code}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={currency.enabled}
                        onCheckedChange={() => toggleCurrencyEnabled(currency.code)}
                        aria-label={`Habilitar ${currency.name}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveCurrencyConfig} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Configuración de Monedas"}
          </Button>
        </CardFooter>
      </Card>

      {/* Variables de Entorno */}
      <Card>
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
