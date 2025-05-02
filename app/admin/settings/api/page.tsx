import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Configuración de API | Admin",
  description: "Configuración de API del sistema",
}

export default function ApiSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Configuración de API" description="Administra las configuraciones de API del sistema" />
      <div className="p-8 text-center text-muted-foreground">
        Esta sección está en desarrollo. Próximamente podrás configurar opciones de API del sistema.
      </div>
    </div>
  )
}
