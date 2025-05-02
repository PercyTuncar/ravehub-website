import type React from "react"
import type { Metadata } from "next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Configuración | Admin",
  description: "Configuración del sistema",
}

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Tabs defaultValue="currency" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <Link href="/admin/settings/currency-settings" passHref>
              <TabsTrigger value="currency" asChild>
                <div className="w-full cursor-pointer">Moneda</div>
              </TabsTrigger>
            </Link>
            <Link href="/admin/settings/general" passHref>
              <TabsTrigger value="general" asChild>
                <div className="w-full cursor-pointer">General</div>
              </TabsTrigger>
            </Link>
            <Link href="/admin/settings/api" passHref>
              <TabsTrigger value="api" asChild>
                <div className="w-full cursor-pointer">API</div>
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  )
}
