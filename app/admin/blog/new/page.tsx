import type { Metadata } from "next"
import BlogFormPage from "@/components/admin/blog-form-page"

export const metadata: Metadata = {
  title: "Crear nuevo artículo | RaveHub Admin",
  description: "Crea un nuevo artículo para el blog de RaveHub",
}

export default function NewBlogPage() {
  return <BlogFormPage isEditing={false} />
}
