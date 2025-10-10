"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { updateExistingEventsWithDescriptionText } from "@/scripts/update-event-descriptions"

export default function UpdateEventsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    updatedCount?: number
    error?: string
  } | null>(null)

  const handleUpdate = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const updateResult = await updateExistingEventsWithDescriptionText()
      setResult(updateResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Actualizar Eventos - Schema</h1>
          <p className="text-muted-foreground mt-2">
            Esta herramienta actualiza todos los eventos existentes para generar el campo descriptionText
            necesario para el schema JSON-LD correcto.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actualización de Schema para Eventos</CardTitle>
            <CardDescription>
              Los eventos publicados antes de la mejora del schema necesitan ser actualizados para incluir
              texto plano de descripción. Esto mejora el SEO y la compatibilidad con motores de búsqueda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Información importante
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Esta operación procesará todos los eventos en la base de datos. Solo se actualizarán
                    los eventos que no tengan el campo descriptionText. La operación es segura y no
                    eliminará datos existentes.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando eventos...
                </>
              ) : (
                "Ejecutar Actualización"
              )}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <div>
                      <p className="font-medium">¡Actualización completada exitosamente!</p>
                      <p className="text-sm mt-1">
                        Se actualizaron {result.updatedCount} eventos con el campo descriptionText.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Error en la actualización</p>
                      <p className="text-sm mt-1">{result.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            <strong>¿Qué hace esta actualización?</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Convierte las descripciones HTML a texto plano</li>
            <li>Trunca el texto a 160 caracteres para SEO óptimo</li>
            <li>Mejora la compatibilidad con motores de búsqueda</li>
            <li>No afecta el contenido existente de los eventos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}