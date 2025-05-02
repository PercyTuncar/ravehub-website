import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Configuración General | Admin",
  description: "Configuración general del sistema",
}

export default function GeneralSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Configuración General" description="Administra las configuraciones generales del sistema" />
      <div className="p-8 text-center text-muted-foreground">
        Esta sección está en desarrollo. Próximamente podrás configurar opciones generales del sistema.
      </div>
    </div>
  )
}
