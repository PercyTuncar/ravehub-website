import type { Metadata } from "next"
import RegistroForm from "@/components/auth/registro-form"

export const metadata: Metadata = {
  title: "Registro | RaveHub",
  description: "Crea una cuenta en RaveHub para acceder a todas las funcionalidades",
}

export const viewport = {
  themeColor: "#000000",
}

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <RegistroForm />
    </div>
  )
}
