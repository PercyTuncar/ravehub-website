import type { Metadata } from "next"
import RecuperarPasswordForm from "@/components/auth/recuperar-password-form"

export const metadata: Metadata = {
  title: "Recuperar contraseña | Ravehub",
  description: "Recupera el acceso a tu cuenta de Ravehub",
}

export const viewport = {
  themeColor: "#000000",
}

export default function RecuperarPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <RecuperarPasswordForm />
    </div>
  )
}
