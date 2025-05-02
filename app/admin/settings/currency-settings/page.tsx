import type { Metadata } from "next"
import CurrencySettings from "@/components/admin/currency-settings"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Configuración de Moneda | Admin",
  description: "Configuración de monedas y tipos de cambio",
}

export default function CurrencySettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Configuración de Moneda"
        description="Administra las configuraciones de moneda y tipos de cambio"
      />
      <CurrencySettings />
    </div>
  )
}
