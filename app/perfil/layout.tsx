import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Área de Usuario | Ravehub",
  description: "Gestiona tu cuenta, entradas y compras en Ravehub",
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
