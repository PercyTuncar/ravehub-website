import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const metadata: Metadata = {
  title: "Configuración General | Admin",
  description: "Configuración general del sistema",
}

export default function GeneralSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Configuración General" description="Administra las configuraciones generales del sistema" />

      <Card>
        <CardContent className="pt-6">
          <Alert className="bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Esta sección está en desarrollo. Próximamente podrás configurar opciones generales del sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
