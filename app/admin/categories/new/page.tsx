import { CategoryForm } from "@/components/admin/category-form"

export const viewport = {
  themeColor: "#000000",
}

export default function NewCategoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryForm />
    </div>
  )
}
