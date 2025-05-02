"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { BlogFakeData } from "./blog-fake-data"
import { StoreFakeData } from "./store-fake-data"

export function FakeDataGenerator() {
  const [activeTab, setActiveTab] = useState<string>("blog")

  return (
    <div className="space-y-6">
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Precaución</AlertTitle>
        <AlertDescription>
          Esta herramienta genera datos falsos que se guardarán en la base de datos. Úsala con responsabilidad y solo en
          entornos de desarrollo o prueba.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="blog" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="store">Tienda</TabsTrigger>
        </TabsList>
        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle>Generador de Datos Falsos para Blog</CardTitle>
              <CardDescription>
                Selecciona un post y genera vistas, reacciones, comentarios, reseñas o shares falsos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlogFakeData />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Generador de Datos Falsos para Tienda</CardTitle>
              <CardDescription>
                Selecciona un producto y genera reseñas falsas con diferentes calificaciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StoreFakeData />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
