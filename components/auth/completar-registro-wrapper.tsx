"use client"

import dynamic from "next/dynamic"

// Importamos el formulario de manera dinámica con ssr: false
const CompletarRegistroForm = dynamic(() => import("@/components/auth/completar-registro-form"), { ssr: false })

export default function CompletarRegistroWrapper() {
  return <CompletarRegistroForm />
}
