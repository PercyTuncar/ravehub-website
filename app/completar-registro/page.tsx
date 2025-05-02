import type { Metadata } from "next"
import CompletarRegistroWrapper from "@/components/auth/completar-registro-wrapper"

export const metadata: Metadata = {
  title: "Completar Registro | RaveHub",
  description: "Completa tu registro en RaveHub para acceder a todas las funcionalidades",
}

export default function CompletarRegistroPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <CompletarRegistroWrapper />
    </div>
  )
}
