import type { Metadata } from "next"
import CategoryFormPage from "@/components/admin/blog-category-form"

export const metadata: Metadata = {
  title: "Nueva Categoría de Blog | Admin Ravehub",
  description: "Crear una nueva categoría para el blog de Ravehub",
}

export default function NewCategoryPage() {
  return <CategoryFormPage isEditing={false} />
}
