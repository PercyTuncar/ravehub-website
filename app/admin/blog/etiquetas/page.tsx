import type { Metadata } from "next"
import Link from "next/link"
import { AdminTagsList } from "@/components/admin/admin-tags-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: "Gestión de Etiquetas | Admin Ravehub",
  description: "Administra las etiquetas del blog",
}

export default function AdminTagsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Etiquetas</h1>
        <Link href="/admin/blog/etiquetas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Etiqueta
          </Button>
        </Link>
      </div>

      <AdminTagsList />
    </div>
  )
}
