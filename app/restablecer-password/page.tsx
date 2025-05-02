import type { Metadata } from "next"
import RestablecerPasswordClientPage from "./restablecer-password-client-page"

export const metadata: Metadata = {
  title: "Restablecer contraseña | RaveHub",
  description: "Crea una nueva contraseña para tu cuenta de RaveHub",
}

export const viewport = {
  themeColor: "#000000",
}

export default function RestablecerPasswordPage() {
  return <RestablecerPasswordClientPage />
}
