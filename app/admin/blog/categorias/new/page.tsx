import type { Metadata } from "next"
import CategoryFormPage from "@/components/admin/blog-category-form"

export const metadata: Metadata = {
  title: "Nueva Categoría de Blog | Admin RaveHub",
  description: "Crear una nueva categoría para el blog de RaveHub",
}

export default function NewCategoryPage() {
  return <CategoryFormPage isEditing={false} />
}
