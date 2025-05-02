import type { Metadata } from "next"
import { TagForm } from "@/components/admin/tag-form"

export const metadata: Metadata = {
  title: "Nueva Etiqueta | Admin RaveHub",
  description: "Crear una nueva etiqueta para el blog",
}

export default function NewTagPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nueva Etiqueta</h1>
      <TagForm />
    </div>
  )
}
