import type React from "react"
import type { Metadata } from "next"
import SettingsLayoutClient from "./settings-layout-client"

export const metadata: Metadata = {
  title: "Configuración | Admin",
  description: "Configuración del sistema",
}

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>
}
