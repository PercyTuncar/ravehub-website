import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Área de Usuario | RaveHub",
  description: "Gestiona tu cuenta, entradas y compras en RaveHub",
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
