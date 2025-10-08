import type { Metadata } from "next"
import CategoryFormPage from "@/components/admin/blog-category-form"

export const metadata: Metadata = {
  title: "Editar Categoría | Admin Ravehub",
  description: "Editar una categoría existente del blog",
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  return <CategoryFormPage categoryId={params.id} isEditing={true} />
}
