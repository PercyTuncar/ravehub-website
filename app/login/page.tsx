import type { Metadata } from "next"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Iniciar sesión | RaveHub",
  description: "Accede a tu cuenta de RaveHub para gestionar tus entradas y compras",
}

export const viewport = {
  themeColor: "#000000",
}

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <LoginForm />
    </div>
  )
}
