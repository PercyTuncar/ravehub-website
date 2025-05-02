import { CategoryForm } from "@/components/admin/category-form"

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryForm categoryId={params.id} />
    </div>
  )
}
