import type { Metadata } from "next"
import RestablecerPasswordClientPage from "./restablecer-password-client-page"

export const metadata: Metadata = {
  title: "Restablecer contraseña | Ravehub",
  description: "Crea una nueva contraseña para tu cuenta de Ravehub",
}

export const viewport = {
  themeColor: "#000000",
}

export default function RestablecerPasswordPage() {
  return <RestablecerPasswordClientPage />
}
