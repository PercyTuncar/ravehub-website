import type { Metadata } from "next"
import Link from "next/link"
import { BlogManagement } from "@/components/admin/blog-management"

export const metadata: Metadata = {
  title: "Gestión de Blog | Admin Ravehub",
  description: "Panel de administración de artículos del blog",
}

export default function AdminBlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión del Blog</h1>
        <div className="flex space-x-4">
          <Link href="/admin/blog/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            Nuevo artículo
          </Link>
          <Link
            href="/admin/blog/categorias/new"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Nueva categoría
          </Link>
        </div>
      </div>

      <BlogManagement />
    </div>
  )
}
