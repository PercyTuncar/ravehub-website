import type { Metadata } from "next"
import BlogFormPage from "@/components/admin/blog-form-page"

export const metadata: Metadata = {
  title: "Editar artículo | Ravehub Admin",
  description: "Edita un artículo existente del blog de Ravehub",
}

export default function EditBlogPage({ params }: { params: { id: string } }) {
  return <BlogFormPage postId={params.id} isEditing={true} />
}
